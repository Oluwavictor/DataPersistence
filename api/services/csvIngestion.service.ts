import { parse } from "csv-parse";
import { Readable } from "stream";
import { AppDataSource } from "../database/data-source";
import { Profile } from "../entities/Profile";
import { generateId } from "../utils";
import { invalidateCacheByPattern } from "../cache/redis.client";

export interface IngestionResult {
  total_rows: number;
  inserted: number;
  skipped: number;
  reasons: {
    duplicate_name: number;
    invalid_age: number;
    missing_fields: number;
    malformed_row: number;
    invalid_gender: number;
  };
}

interface CsvRow {
  name?: string;
  gender?: string;
  gender_probability?: string;
  age?: string;
  age_group?: string;
  country_id?: string;
  country_name?: string;
  country_probability?: string;
  sample_size?: string;
  [key: string]: string | undefined;
}

const VALID_GENDERS = ["male", "female"];
const CHUNK_SIZE = 500; // process 500 rows at a time

function getAgeGroup(age: number): string {
  if (age < 13) return "child";
  if (age < 18) return "teenager";
  if (age < 65) return "adult";
  return "senior";
}

export class CsvIngestionService {
  private readonly repo = () => AppDataSource.getRepository(Profile);

  async ingestCsvBuffer(buffer: Buffer): Promise<IngestionResult> {
    const result: IngestionResult = {
      total_rows: 0,
      inserted: 0,
      skipped: 0,
      reasons: {
        duplicate_name: 0,
        invalid_age: 0,
        missing_fields: 0,
        malformed_row: 0,
        invalid_gender: 0,
      },
    };

    const chunk: CsvRow[] = [];

    await new Promise<void>((resolve) => {
      // ✅ Stream the buffer — never load entire file into memory
      const stream = Readable.from(buffer);

      const parser = stream.pipe(
        parse({
          columns: true,
          skip_empty_lines: true,
          trim: true,
          // ✅ Don't fail entire file on bad rows
          relax_column_count: true,
          encoding: "utf-8",
        })
      );

      parser.on("data", (row: CsvRow) => {
        result.total_rows++;
        chunk.push(row);

        // ✅ When chunk is full, pause and process
        if (chunk.length >= CHUNK_SIZE) {
          parser.pause();
          const currentChunk = chunk.splice(0, CHUNK_SIZE);

          this.processChunk(currentChunk, result).then(() => {
            parser.resume(); // resume after chunk processed
          });
        }
      });

      parser.on("end", async () => {
        // Process remaining rows in last partial chunk
        if (chunk.length > 0) {
          await this.processChunk(chunk, result);
        }
        resolve();
      });

      parser.on("error", () => {
        // Resolve anyway — partial results are kept
        resolve();
      });
    });

    // ✅ Invalidate cache after bulk write
    await invalidateCacheByPattern("profiles:list:*");
    await invalidateCacheByPattern("profiles:search:*");

    return result;
  }

  private async processChunk(
    rows: CsvRow[],
    result: IngestionResult
  ): Promise<void> {
    const validRows: Omit<Profile, "created_at">[] = [];

    // ✅ Get all names in this chunk first
    const names = rows
      .map((r) => r.name?.toLowerCase().trim())
      .filter(Boolean) as string[];

    // ✅ Check duplicates in one query — not per row
    const existing = await this.repo()
      .createQueryBuilder("p")
      .select("p.name")
      .where("LOWER(p.name) IN (:...names)", { names })
      .getMany();

    const existingNames = new Set(existing.map((p) => p.name.toLowerCase()));

    for (const row of rows) {
      try {
        // ── Validate name ─────────────────────────────
        if (!row.name || !row.name.trim()) {
          result.skipped++;
          result.reasons.missing_fields++;
          continue;
        }

        const name = row.name.toLowerCase().trim();

        // ── Check duplicate ───────────────────────────
        if (existingNames.has(name)) {
          result.skipped++;
          result.reasons.duplicate_name++;
          continue;
        }

        // ── Validate gender ───────────────────────────
        if (!row.gender || !row.gender.trim()) {
          result.skipped++;
          result.reasons.missing_fields++;
          continue;
        }

        const gender = row.gender.toLowerCase().trim();
        if (!VALID_GENDERS.includes(gender)) {
          result.skipped++;
          result.reasons.invalid_gender++;
          continue;
        }

        // ── Validate age ──────────────────────────────
        if (!row.age || !row.age.trim()) {
          result.skipped++;
          result.reasons.missing_fields++;
          continue;
        }

        const age = parseInt(row.age.trim(), 10);
        if (isNaN(age) || age < 0 || age > 150) {
          result.skipped++;
          result.reasons.invalid_age++;
          continue;
        }

        // ── Build profile row ─────────────────────────
        const ageGroup = row.age_group?.trim() || getAgeGroup(age);
        const countryId = row.country_id?.toUpperCase().trim() || null;
        const countryName = row.country_name?.trim() || countryId;
        const genderProb = parseFloat(row.gender_probability || "0.99");
        const countryProb = parseFloat(row.country_probability || "0.99");
        const sampleSize = parseInt(row.sample_size || "100", 10);

        validRows.push({
          id: generateId(),
          name,
          gender,
          gender_probability: isNaN(genderProb) ? 0.99 : genderProb,
          sample_size: isNaN(sampleSize) ? 100 : sampleSize,
          age,
          age_group: ageGroup,
          country_id: countryId,
          country_name: countryName,
          country_probability: isNaN(countryProb) ? null : countryProb,
        } as any);

        // ✅ Track inserted names to prevent
        // duplicates within the same chunk
        existingNames.add(name);
      } catch {
        // ── Any unexpected error skips the row ─────────
        result.skipped++;
        result.reasons.malformed_row++;
      }
    }

    // ✅ Bulk insert — not one by one
    if (validRows.length > 0) {
      try {
        await this.repo()
          .createQueryBuilder()
          .insert()
          .into(Profile)
          .values(validRows)
          .orIgnore() // skip duplicates without failing
          .execute();

        result.inserted += validRows.length;
      } catch {
        // ✅ If bulk insert fails, fall back to
        // individual inserts to maximize inserted rows
        for (const row of validRows) {
          try {
            await this.repo().save(row);
            result.inserted++;
          } catch {
            result.skipped++;
            result.reasons.duplicate_name++;
          }
        }
      }
    }
  }
}

export const csvIngestionService = new CsvIngestionService();