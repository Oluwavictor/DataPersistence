import "reflect-metadata";
import { DataSource, DataSourceOptions } from "typeorm";
import { Profile } from "../entities/Profile";
import { User } from "../entities/User";
import { RefreshToken } from "../entities/RefreshToken";
import dotenv from "dotenv";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";
const isTest = process.env.NODE_ENV === "test";

const options: DataSourceOptions = {
  type: "mysql",

  host: process.env.DB_HOST || process.env.MYSQLHOST || "localhost",
  port: parseInt(process.env.DB_PORT || process.env.MYSQLPORT || "3306", 10),

  username: process.env.DB_USER || process.env.MYSQLUSER || "root",
  password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || "",

  database: isTest
    ? process.env.DB_NAME_TEST || "insighta_test"
    : process.env.DB_NAME || process.env.MYSQLDATABASE || "insighta",

  //synchronize: !isProduction,
  synchronize: true,
  logging: !isProduction && !isTest,

  entities: [Profile, User, RefreshToken],

  charset: "utf8mb4_unicode_ci",

  extra: {
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || "10", 10),
  },
};

export const AppDataSource = new DataSource(options);