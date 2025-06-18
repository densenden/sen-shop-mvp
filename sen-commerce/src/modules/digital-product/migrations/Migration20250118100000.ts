import { Migration } from "@mikro-orm/migrations"

export class Migration20250118100000 extends Migration {
  async up(): Promise<void> {
    // Create digital_product table
    this.addSql(`
      CREATE TABLE IF NOT EXISTS digital_product (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR NOT NULL,
        file_url VARCHAR NOT NULL,
        file_key VARCHAR NOT NULL,
        file_size BIGINT NOT NULL,
        mime_type VARCHAR NOT NULL,
        description TEXT,
        preview_url VARCHAR,
        max_downloads INTEGER DEFAULT -1,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP
      );
    `)

    // Create digital_product_download table
    this.addSql(`
      CREATE TABLE IF NOT EXISTS digital_product_download (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        digital_product_id VARCHAR NOT NULL,
        order_id VARCHAR NOT NULL,
        customer_id VARCHAR NOT NULL,
        token VARCHAR UNIQUE NOT NULL,
        download_count INTEGER DEFAULT 0,
        last_downloaded_at TIMESTAMP,
        expires_at TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP,
        CONSTRAINT fk_digital_product 
          FOREIGN KEY (digital_product_id) 
          REFERENCES digital_product(id) 
          ON DELETE CASCADE
      );
    `)

    // Create indexes
    this.addSql(`CREATE INDEX idx_digital_product_download_token ON digital_product_download(token);`)
    this.addSql(`CREATE INDEX idx_digital_product_download_order ON digital_product_download(order_id);`)
    this.addSql(`CREATE INDEX idx_digital_product_download_customer ON digital_product_download(customer_id);`)
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS digital_product_download CASCADE;`)
    this.addSql(`DROP TABLE IF EXISTS digital_product CASCADE;`)
  }
} 