// // bootstrap();
// import "reflect-metadata";
// import dotenv from "dotenv";

// dotenv.config();

// import app from "./api/utils/app";
// import { AppDataSource } from "./api/database/data-source";
// import { seedDatabase } from "./api/services/seed.service";   // ← your seed function

// const PORT = parseInt(process.env.PORT || "3000", 10);

// async function bootstrap(): Promise<void> {
//   try {
//     await AppDataSource.initialize();
//     console.log(" MySQL connected via TypeORM");

//     // ---------- AUTO-SEED (only if RUN_SEED=true) ----------
//     if (process.env.RUN_SEED === "true") {
//       console.log(" RUN_SEED=true → starting seed...");
//       await seedDatabase();
//       console.log(" Seeding complete");
//     }
//     // -------------------------------------------------------

//     app.listen(PORT, () => {
//       console.log(`\n Server  : http://localhost:${PORT}`);
//       console.log(` Swagger : http://localhost:${PORT}/api/docs`);
//       console.log(` Env     : ${process.env.NODE_ENV || "development"}\n`);
//     });
//   } catch (err) {
//     console.error(" Startup failed:", err);
//     process.exit(1);
//   }
// }

// const shutdown = async (signal: string): Promise<void> => {
//   console.log(`\n${signal} — shutting down gracefully...`);
//   if (AppDataSource.isInitialized) {
//     await AppDataSource.destroy();
//     console.log(" DB connection closed");
//   }
//   process.exit(0);
// };

// process.on("SIGTERM", () => shutdown("SIGTERM"));
// process.on("SIGINT", () => shutdown("SIGINT"));
// process.on("unhandledRejection", (reason) =>
//   console.error("[unhandledRejection]", reason)
// );
// process.on("uncaughtException", (err) => {
//   console.error("[uncaughtException]", err);
//   process.exit(1);
// });

// bootstrap();

import "reflect-metadata";
import dotenv from "dotenv";

dotenv.config();

import app from "./api/utils/app";
import { AppDataSource } from "./api/database/data-source";
import { seedDatabase } from "./api/services/seed.service";

const PORT = parseInt(process.env.PORT || "3000", 10);

async function bootstrap(): Promise<void> {
  try {
   
    if (process.env.FORCE_SYNC === "true") {
      console.log(" FORCE_SYNC=true → Dropping tables & recreating schema...");
      
      await AppDataSource.synchronize(true);
      console.log(" Schema updated successfully!");
    }
    

    await AppDataSource.initialize();
    console.log(" MySQL connected via TypeORM");

    // - AUTO-SEED 
    if (process.env.RUN_SEED === "true") {
      console.log(" RUN_SEED=true → starting seed...");
      await seedDatabase();
      console.log(" Seeding complete");
    }
   

    app.listen(PORT, () => {
      console.log(`\n Server  : http://localhost:${PORT}`);
      console.log(` Swagger : http://localhost:${PORT}/api/docs`);
      console.log(` Env     : ${process.env.NODE_ENV || "development"}\n`);
    });
  } catch (err) {
    console.error(" Startup failed:", err);
    process.exit(1);
  }
}

const shutdown = async (signal: string): Promise<void> => {
  console.log(`\n${signal} — shutting down gracefully...`);
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    console.log(" DB connection closed");
  }
  process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (reason) =>
  console.error("[unhandledRejection]", reason)
);
process.on("uncaughtException", (err) => {
  console.error("[uncaughtException]", err);
  process.exit(1);
});

bootstrap();