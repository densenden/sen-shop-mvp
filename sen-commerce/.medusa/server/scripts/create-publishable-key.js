"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = createPublishableKey;
async function createPublishableKey() {
    console.log("Creating publishable API key...");
    try {
        const key = "pk_0b024fc90febe17f54a9359f1e0d24141802d6e4b951bf227649695ee31895e0";
        // For now, let's just log that we need to create this key manually via the admin
        console.log("Key to create:", key);
        console.log("This key needs to be created via the Medusa admin interface or by running SQL directly");
        console.log("You can access the admin at: http://localhost:9000/app");
        // SQL to insert the key directly
        const sql = `
INSERT INTO publishable_api_key (id, title, created_at, updated_at) 
VALUES ('${key}', 'Storefront API Key', NOW(), NOW()) 
ON CONFLICT (id) DO NOTHING;
    `;
        console.log("SQL to create key:");
        console.log(sql);
        return { success: true, key };
    }
    catch (error) {
        console.error("❌ Error:", error);
        return { success: false, error: error.message };
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlLXB1Ymxpc2hhYmxlLWtleS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zY3JpcHRzL2NyZWF0ZS1wdWJsaXNoYWJsZS1rZXkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFFQSx1Q0EwQkM7QUExQmMsS0FBSyxVQUFVLG9CQUFvQjtJQUNoRCxPQUFPLENBQUMsR0FBRyxDQUFDLGlDQUFpQyxDQUFDLENBQUE7SUFFOUMsSUFBSSxDQUFDO1FBQ0gsTUFBTSxHQUFHLEdBQUcscUVBQXFFLENBQUE7UUFFakYsaUZBQWlGO1FBQ2pGLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLEVBQUUsR0FBRyxDQUFDLENBQUE7UUFDbEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyx3RkFBd0YsQ0FBQyxDQUFBO1FBQ3JHLE9BQU8sQ0FBQyxHQUFHLENBQUMsd0RBQXdELENBQUMsQ0FBQTtRQUVyRSxpQ0FBaUM7UUFDakMsTUFBTSxHQUFHLEdBQUc7O1dBRUwsR0FBRzs7S0FFVCxDQUFBO1FBRUQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFBO1FBQ2pDLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUE7UUFFaEIsT0FBTyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLENBQUE7SUFDL0IsQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDZixPQUFPLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUMsQ0FBQTtRQUNoQyxPQUFPLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFBO0lBQ2pELENBQUM7QUFDSCxDQUFDIn0=