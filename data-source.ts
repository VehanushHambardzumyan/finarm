import { DataSource } from "typeorm";
import { InitialSchema1735689600000 } from "./backend/dist/migrations/1735689600000-InitialSchema.js";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "postgres",
  password: "123456",
  database: "postgres",
  synchronize: false,
  logging: true,
  entities: ["backend/src/entities/**/*.ts"],
  migrations: [InitialSchema1735689600000],
  subscribers: [],
});