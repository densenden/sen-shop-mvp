import { Migration } from '@mikro-orm/migrations';

export class Migration20250701000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS pod_product (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        artwork_id VARCHAR NOT NULL,
        printful_product_id VARCHAR NOT NULL,
        name VARCHAR NOT NULL,
        thumbnail_url VARCHAR,
        price NUMERIC,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP,
        CONSTRAINT fk_artwork FOREIGN KEY (artwork_id) REFERENCES artwork(id) ON DELETE CASCADE
      );
    `);
    this.addSql('CREATE INDEX IF NOT EXISTS idx_pod_product_artwork_id ON pod_product(artwork_id);');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_pod_product_deleted_at ON pod_product(deleted_at) WHERE deleted_at IS NULL;');
  }

  override async down(): Promise<void> {
    this.addSql('DROP TABLE IF EXISTS pod_product CASCADE;');
  }
} 