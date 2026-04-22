import "reflect-metadata";
import dotenv from "dotenv";
dotenv.config();

import { AppDataSource } from "../api/database/data-source";
import { seedDatabase } from "../api/services/seed.service";

async function run(): Promise<void> {
  try {
    await AppDataSource.initialize();
    console.log("Database connected");
    await seedDatabase();
    await AppDataSource.destroy();
    console.log("Done");
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  }
}

run();