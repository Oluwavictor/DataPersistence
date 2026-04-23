import { AppDataSource } from "../database/data-source";
import { Profile } from "../entities/Profile";
import { generateId, classifyAge } from "../utils";
import path from "path";
import fs from "fs";

interface SeedProfile {
  name: string;
  gender: string;
  gender_probability: number;
  sample_size: number; 
  age: number;
  country_id: string;
  country_name: string;
  country_probability: number;
}

export async function seedDatabase(): Promise<void> {
  const repo = AppDataSource.getRepository(Profile);

  const scriptsDir = path.join(__dirname, "../../scripts");

  if (!fs.existsSync(scriptsDir)) {
    console.warn("scripts/ folder not found, skipping seed");
    return;
  }

  const files = fs.readdirSync(scriptsDir).filter((f) => f.endsWith(".json"));

  if (files.length === 0) {
    console.warn("No JSON file found in scripts/, skipping seed");
    return;
  }

  const filePath = path.join(scriptsDir, files[0]);
  console.log(`Using seed file: ${files[0]}`);

  let raw: string;
  try {
    raw = fs.readFileSync(filePath, "utf-8");
  } catch (err) {
    console.warn("Could not read seed file, skipping seed:", err);
    return;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.warn("Seed file is not valid JSON, skipping seed:", err);
    return;
  }

  let profiles: SeedProfile[];

  if (Array.isArray(parsed)) {
    profiles = parsed as SeedProfile[];
  } else if (
    typeof parsed === "object" &&
    parsed !== null &&
    Array.isArray((parsed as Record<string, unknown>).data)
  ) {
    profiles = (parsed as Record<string, unknown>).data as SeedProfile[];
  } else if (
    typeof parsed === "object" &&
    parsed !== null &&
    Array.isArray((parsed as Record<string, unknown>).profiles)
  ) {
    profiles = (parsed as Record<string, unknown>).profiles as SeedProfile[];
  } else {
    console.warn("Seed file format not recognized, skipping seed");
    console.warn("Expected: array [] or { data: [] } or { profiles: [] }");
    console.warn("Got:", typeof parsed, Array.isArray(parsed) ? "array" : "");
    return;
  }

  if (profiles.length === 0) {
    console.warn("Seed file is empty, skipping seed");
    return;
  }

  console.log(`Seeding ${profiles.length} profiles...`);

  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const p of profiles) {
    try {
      if (!p.name) {
        errors++;
        continue;
      }

      const normalizedName = p.name.trim().toLowerCase();

      const existing = await repo.findOne({
        where: { name: normalizedName },
      });

      if (existing) {
        skipped++;
        continue;
      }

      const profile = repo.create({
        id: generateId(),
        name: normalizedName,
        gender: p.gender || "unknown",
        gender_probability: p.gender_probability || 0,
        sample_size: p.sample_size || 0,
        age: p.age || 0,
        age_group: classifyAge(p.age || 0),
        country_id: p.country_id || "XX",
        country_name: p.country_name || "Unknown",
        country_probability: p.country_probability || 0,
      });

      await repo.save(profile);
      inserted++;
    } catch (err) {
      console.error(`Error inserting ${p.name}:`, err);
      errors++;
    }
  }

  console.log(
    `Seed complete: ${inserted} inserted, ${skipped} skipped, ${errors} errors`
  );
}