import { Migration } from "@mikro-orm/migrations"

export class Migration20250115000000 extends Migration {
  async up(): Promise<void> {
    // Change product_ids from array to jsonb type
    this.addSql(`
      ALTER TABLE artwork 
      ALTER COLUMN product_ids TYPE jsonb 
      USING CASE 
        WHEN product_ids IS NULL THEN '[]'::jsonb
        ELSE to_jsonb(product_ids)
      END
    `)
  }

  async down(): Promise<void> {
    // Revert back to array type if needed
    this.addSql(`
      ALTER TABLE artwork 
      ALTER COLUMN product_ids TYPE text[] 
      USING CASE 
        WHEN product_ids IS NULL THEN NULL
        ELSE ARRAY(SELECT jsonb_array_elements_text(product_ids))
      END
    `)
  }
} 