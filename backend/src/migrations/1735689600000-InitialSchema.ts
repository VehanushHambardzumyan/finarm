import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1735689600000 implements MigrationInterface {
  name = 'InitialSchema1735689600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable pgcrypto
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    // Users table
    await queryRunner.query(`
      CREATE TYPE "user_role_enum" AS ENUM('user', 'admin')
    `);
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "email" character varying,
        "phone" character varying,
        "name" character varying NOT NULL,
        "role" "user_role_enum" NOT NULL DEFAULT 'user',
        "profile" jsonb,
        "passwordHash" character varying NOT NULL,
        "refresh_token_hash" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
        CONSTRAINT "UQ_a000cca60bcf04454e727699490" UNIQUE ("phone"),
        CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
      )
    `);

    // Accounts table
    await queryRunner.query(`
      CREATE TYPE "account_type_enum" AS ENUM('cash', 'bank', 'debit', 'credit')
    `);
    await queryRunner.query(`
      CREATE TYPE "currency_enum" AS ENUM('AMD', 'USD', 'EUR')
    `);
    await queryRunner.query(`
      CREATE TABLE "accounts" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "name" character varying NOT NULL,
        "type" "account_type_enum" NOT NULL,
        "balance" numeric(15,2) NOT NULL DEFAULT '0',
        "currency" "currency_enum" NOT NULL,
        "creditLimit" numeric(15,2),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_4c88e956195bba85977da21b8f4" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_4c88e956195bba85977da21b8f4" ON "accounts" ("userId")
    `);

    // Transactions table
    await queryRunner.query(`
      CREATE TYPE "transaction_type_enum" AS ENUM('income', 'expense', 'transfer')
    `);
    await queryRunner.query(`
      CREATE TABLE "transactions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "type" "transaction_type_enum" NOT NULL,
        "accountId" uuid,
        "toAccountId" uuid,
        "amount" numeric(15,2) NOT NULL,
        "currency" "currency_enum" NOT NULL,
        "category" character varying,
        "txDate" date NOT NULL,
        "notes" character varying,
        "recurringId" uuid,
        "meta" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_7761bf9766670b894ff2fdb8f40" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_7761bf9766670b894ff2fdb8f40" ON "transactions" ("userId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_4c88e956195bba85977da21b8f5" ON "transactions" ("accountId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_7761bf9766670b894ff2fdb8f41" ON "transactions" ("createdAt")
    `);

    // Income sources table
    await queryRunner.query(`
      CREATE TABLE "income_sources" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "name" character varying NOT NULL,
        "amount" numeric(15,2) NOT NULL,
        "frequency" character varying NOT NULL,
        "active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_4c88e956195bba85977da21b8f5" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_4c88e956195bba85977da21b8f6" ON "income_sources" ("userId")
    `);

    // Budgets table
    await queryRunner.query(`
      CREATE TYPE "budget_period_enum" AS ENUM('weekly', 'monthly', 'yearly')
    `);
    await queryRunner.query(`
      CREATE TABLE "budgets" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "period" "budget_period_enum" NOT NULL,
        "totalLimit" numeric(15,2) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_4c88e956195bba85977da21b8f6" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_4c88e956195bba85977da21b8f7" ON "budgets" ("userId")
    `);

    // Budget categories table
    await queryRunner.query(`
      CREATE TABLE "budget_categories" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "budgetId" uuid NOT NULL,
        "category" character varying NOT NULL,
        "limitAmount" numeric(15,2) NOT NULL,
        CONSTRAINT "PK_4c88e956195bba85977da21b8f7" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_budget_category" ON "budget_categories" ("budgetId", "category")
    `);

    // Goals table
    await queryRunner.query(`
      CREATE TABLE "goals" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "title" character varying NOT NULL,
        "targetAmount" numeric(15,2) NOT NULL,
        "currentAmount" numeric(15,2) NOT NULL DEFAULT '0',
        "deadline" date,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_4c88e956195bba85977da21b8f8" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_4c88e956195bba85977da21b8f8" ON "goals" ("userId")
    `);

    // Notifications table
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "type" character varying NOT NULL,
        "message" character varying NOT NULL,
        "isRead" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_4c88e956195bba85977da21b8f9" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_4c88e956195bba85977da21b8f9" ON "notifications" ("userId")
    `);

    // Foreign keys
    await queryRunner.query(`
      ALTER TABLE "accounts" ADD CONSTRAINT "FK_4c88e956195bba85977da21b8f4" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "transactions" ADD CONSTRAINT "FK_7761bf9766670b894ff2fdb8f40" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "transactions" ADD CONSTRAINT "FK_4c88e956195bba85977da21b8f5" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "transactions" ADD CONSTRAINT "FK_7761bf9766670b894ff2fdb8f41" FOREIGN KEY ("toAccountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "income_sources" ADD CONSTRAINT "FK_4c88e956195bba85977da21b8f6" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "budgets" ADD CONSTRAINT "FK_4c88e956195bba85977da21b8f7" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "budget_categories" ADD CONSTRAINT "FK_4c88e956195bba85977da21b8f7" FOREIGN KEY ("budgetId") REFERENCES "budgets"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "goals" ADD CONSTRAINT "FK_4c88e956195bba85977da21b8f8" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "notifications" ADD CONSTRAINT "FK_4c88e956195bba85977da21b8f9" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TABLE "goals"`);
    await queryRunner.query(`DROP TABLE "budget_categories"`);
    await queryRunner.query(`DROP TABLE "budgets"`);
    await queryRunner.query(`DROP TABLE "income_sources"`);
    await queryRunner.query(`DROP TABLE "transactions"`);
    await queryRunner.query(`DROP TABLE "accounts"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "budget_period_enum"`);
    await queryRunner.query(`DROP TYPE "currency_enum"`);
    await queryRunner.query(`DROP TYPE "account_type_enum"`);
    await queryRunner.query(`DROP TYPE "transaction_type_enum"`);
    await queryRunner.query(`DROP TYPE "user_role_enum"`);
  }
}
