import "reflect-metadata";
import { AppDataSource } from "../api/database/data-source";
import { Profile } from "../api/entities/Profile";

async function clearDatabase() {
  try {
    await AppDataSource.initialize();
    console.log(" Connected to database");

    const repo = AppDataSource.getRepository(Profile);
    const count = await repo.count();
    
    console.log(`Current records: ${count}`);
    
    await repo.clear(); // Deletes all records
    console.log(" All records deleted");
    
    console.log(" Database cleared successfully");
    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error(" Failed to clear database:", error);
    process.exit(1);
  }
}

clearDatabase();