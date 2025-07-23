"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = createApiKey;
async function createApiKey() {
    console.log("Creating publishable API key...");
    try {
        // Use medusa's database connection
        const { Pool } = require('pg');
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL
        });
        const key = 'pk_0b024fc90febe17f54a9359f1e0d24141802d6e4b951bf227649695ee31895e0';
        // Insert the publishable API key
        await pool.query(`
      INSERT INTO publishable_api_key (id, title, created_at, updated_at) 
      VALUES ($1, $2, NOW(), NOW()) 
      ON CONFLICT (id) DO NOTHING
    `, [key, 'Storefront API Key']);
        // Create default sales channel
        await pool.query(`
      INSERT INTO sales_channel (id, name, description, is_default, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `, ['sc_default', 'Default Sales Channel', 'Default sales channel for the storefront', true]);
        // Link API key to sales channel
        await pool.query(`
      INSERT INTO publishable_api_key_sales_channel (publishable_api_key_id, sales_channel_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `, [key, 'sc_default']);
        console.log("✅ Created publishable API key:", key);
        console.log("✅ Created sales channel: sc_default");
        console.log("✅ Linked API key to sales channel");
        await pool.end();
        return { success: true, key };
    }
    catch (error) {
        console.error("❌ Error creating API key:", error);
        return { success: false, error: error.message };
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlLWFwaS1rZXkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvc2NyaXB0cy9jcmVhdGUtYXBpLWtleS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLCtCQTRDQztBQTVDYyxLQUFLLFVBQVUsWUFBWTtJQUN4QyxPQUFPLENBQUMsR0FBRyxDQUFDLGlDQUFpQyxDQUFDLENBQUE7SUFFOUMsSUFBSSxDQUFDO1FBQ0gsbUNBQW1DO1FBQ25DLE1BQU0sRUFBRSxJQUFJLEVBQUUsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDOUIsTUFBTSxJQUFJLEdBQUcsSUFBSSxJQUFJLENBQUM7WUFDcEIsZ0JBQWdCLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZO1NBQzNDLENBQUMsQ0FBQTtRQUVGLE1BQU0sR0FBRyxHQUFHLHFFQUFxRSxDQUFBO1FBRWpGLGlDQUFpQztRQUNqQyxNQUFNLElBQUksQ0FBQyxLQUFLLENBQUM7Ozs7S0FJaEIsRUFBRSxDQUFDLEdBQUcsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDLENBQUE7UUFFL0IsK0JBQStCO1FBQy9CLE1BQU0sSUFBSSxDQUFDLEtBQUssQ0FBQzs7OztLQUloQixFQUFFLENBQUMsWUFBWSxFQUFFLHVCQUF1QixFQUFFLDBDQUEwQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUE7UUFFN0YsZ0NBQWdDO1FBQ2hDLE1BQU0sSUFBSSxDQUFDLEtBQUssQ0FBQzs7OztLQUloQixFQUFFLENBQUMsR0FBRyxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUE7UUFFdkIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQ0FBZ0MsRUFBRSxHQUFHLENBQUMsQ0FBQTtRQUNsRCxPQUFPLENBQUMsR0FBRyxDQUFDLHFDQUFxQyxDQUFDLENBQUE7UUFDbEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQ0FBbUMsQ0FBQyxDQUFBO1FBRWhELE1BQU0sSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFBO1FBRWhCLE9BQU8sRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFBO0lBQy9CLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2YsT0FBTyxDQUFDLEtBQUssQ0FBQywyQkFBMkIsRUFBRSxLQUFLLENBQUMsQ0FBQTtRQUNqRCxPQUFPLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFBO0lBQ2pELENBQUM7QUFDSCxDQUFDIn0=