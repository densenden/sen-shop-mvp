"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArtworkProductRelation = void 0;
const utils_1 = require("@medusajs/framework/utils");
// Junction table for artwork-product many-to-many relationships
exports.ArtworkProductRelation = utils_1.model.define("artwork_product_relation", {
    id: utils_1.model.id().primaryKey(),
    // Foreign keys
    artwork_id: utils_1.model.text(), // References artwork.id
    product_id: utils_1.model.text(), // Can reference digital_product.id or printful_product.id
    product_type: utils_1.model.text(), // "digital" | "printful_pod" | "standard"
    // Relationship metadata
    is_primary: utils_1.model.boolean().default(false), // Is this the primary artwork for the product?
    position: utils_1.model.number().default(0), // Order of artwork on product
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXJ0d29yay1wcm9kdWN0LXJlbGF0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL21vZHVsZXMvYXJ0d29yay1tb2R1bGUvbW9kZWxzL2FydHdvcmstcHJvZHVjdC1yZWxhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxxREFBaUQ7QUFFakQsZ0VBQWdFO0FBQ25ELFFBQUEsc0JBQXNCLEdBQUcsYUFBSyxDQUFDLE1BQU0sQ0FBQywwQkFBMEIsRUFBRTtJQUM3RSxFQUFFLEVBQUUsYUFBSyxDQUFDLEVBQUUsRUFBRSxDQUFDLFVBQVUsRUFBRTtJQUUzQixlQUFlO0lBQ2YsVUFBVSxFQUFFLGFBQUssQ0FBQyxJQUFJLEVBQUUsRUFBRSx3QkFBd0I7SUFDbEQsVUFBVSxFQUFFLGFBQUssQ0FBQyxJQUFJLEVBQUUsRUFBRSwwREFBMEQ7SUFDcEYsWUFBWSxFQUFFLGFBQUssQ0FBQyxJQUFJLEVBQUUsRUFBRSwwQ0FBMEM7SUFFdEUsd0JBQXdCO0lBQ3hCLFVBQVUsRUFBRSxhQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLCtDQUErQztJQUMzRixRQUFRLEVBQUUsYUFBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSw4QkFBOEI7Q0FDcEUsQ0FBQyxDQUFBIn0=