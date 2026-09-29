import { MigrationInterface, QueryRunner } from 'typeorm';

export class SyncEntitySchema1735689600001 implements MigrationInterface {
  name = 'SyncEntitySchema1735689600001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "accounts"
      ADD COLUMN IF NOT EXISTS "isArchived" boolean NOT NULL DEFAULT false
    `);

    await queryRunner.query(`
      ALTER TABLE "transactions"
      ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
    `);

    await queryRunner.query(`
      ALTER TABLE "income_sources"
      ADD COLUMN IF NOT EXISTS "currency" "currency_enum" NOT NULL DEFAULT 'AMD'
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TYPE "account_type_enum" ADD VALUE IF NOT EXISTS 'card';
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TYPE "account_type_enum" ADD VALUE IF NOT EXISTS 'savings';
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "income_sources" DROP COLUMN IF EXISTS "currency"
    `);
    await queryRunner.query(`
      ALTER TABLE "transactions" DROP COLUMN IF EXISTS "updatedAt"
    `);
    await queryRunner.query(`
      ALTER TABLE "accounts" DROP COLUMN IF EXISTS "isArchived"
    `);
  }
}
