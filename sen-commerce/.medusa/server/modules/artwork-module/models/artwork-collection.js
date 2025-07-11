"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArtworkCollection = void 0;
const utils_1 = require("@medusajs/framework/utils");
exports.ArtworkCollection = utils_1.model.define("artwork_collection", {
    id: utils_1.model.id().primaryKey(),
    name: utils_1.model.text(),
    description: utils_1.model.text().nullable(),
    topic: utils_1.model.text().nullable(),
    month_created: utils_1.model.text().nullable(),
    midjourney_version: utils_1.model.text().nullable(),
    purpose: utils_1.model.text().nullable(),
    thumbnail_url: utils_1.model.text().nullable(),
    // Editorial Images (4 additional images for showcasing the collection)
    editorial_image_1: utils_1.model.text().nullable(),
    editorial_image_2: utils_1.model.text().nullable(),
    editorial_image_3: utils_1.model.text().nullable(),
    editorial_image_4: utils_1.model.text().nullable(),
    // Brand Story & Identity
    brand_story: utils_1.model.text().nullable(),
    genesis_story: utils_1.model.text().nullable(),
    design_philosophy: utils_1.model.text().nullable(),
    // Marketing Keywords & Topics stored as JSON
    core_values: utils_1.model.json().nullable(), // Array of strings
    visual_themes: utils_1.model.json().nullable(), // Array of strings
    lifestyle_concepts: utils_1.model.json().nullable(), // Array of strings
    // Campaign & Messaging
    campaign_ideas: utils_1.model.json().nullable(), // Array of objects with title and description
    target_audience_messaging: utils_1.model.text().nullable(),
    brand_tagline: utils_1.model.text().nullable(),
    // Additional metadata
    brand_colors: utils_1.model.json().nullable(), // Array of hex colors
    brand_fonts: utils_1.model.json().nullable(), // Array of font names
    social_media_tags: utils_1.model.json().nullable(), // Array of hashtags
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXJ0d29yay1jb2xsZWN0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL21vZHVsZXMvYXJ0d29yay1tb2R1bGUvbW9kZWxzL2FydHdvcmstY29sbGVjdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxxREFBaUQ7QUFFcEMsUUFBQSxpQkFBaUIsR0FBRyxhQUFLLENBQUMsTUFBTSxDQUFDLG9CQUFvQixFQUFFO0lBQ2xFLEVBQUUsRUFBRSxhQUFLLENBQUMsRUFBRSxFQUFFLENBQUMsVUFBVSxFQUFFO0lBQzNCLElBQUksRUFBRSxhQUFLLENBQUMsSUFBSSxFQUFFO0lBQ2xCLFdBQVcsRUFBRSxhQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsUUFBUSxFQUFFO0lBQ3BDLEtBQUssRUFBRSxhQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsUUFBUSxFQUFFO0lBQzlCLGFBQWEsRUFBRSxhQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsUUFBUSxFQUFFO0lBQ3RDLGtCQUFrQixFQUFFLGFBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxRQUFRLEVBQUU7SUFDM0MsT0FBTyxFQUFFLGFBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxRQUFRLEVBQUU7SUFDaEMsYUFBYSxFQUFFLGFBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxRQUFRLEVBQUU7SUFFdEMsdUVBQXVFO0lBQ3ZFLGlCQUFpQixFQUFFLGFBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxRQUFRLEVBQUU7SUFDMUMsaUJBQWlCLEVBQUUsYUFBSyxDQUFDLElBQUksRUFBRSxDQUFDLFFBQVEsRUFBRTtJQUMxQyxpQkFBaUIsRUFBRSxhQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsUUFBUSxFQUFFO0lBQzFDLGlCQUFpQixFQUFFLGFBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxRQUFRLEVBQUU7SUFFMUMseUJBQXlCO0lBQ3pCLFdBQVcsRUFBRSxhQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsUUFBUSxFQUFFO0lBQ3BDLGFBQWEsRUFBRSxhQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsUUFBUSxFQUFFO0lBQ3RDLGlCQUFpQixFQUFFLGFBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxRQUFRLEVBQUU7SUFFMUMsNkNBQTZDO0lBQzdDLFdBQVcsRUFBRSxhQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsUUFBUSxFQUFFLEVBQUUsbUJBQW1CO0lBQ3pELGFBQWEsRUFBRSxhQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsUUFBUSxFQUFFLEVBQUUsbUJBQW1CO0lBQzNELGtCQUFrQixFQUFFLGFBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxRQUFRLEVBQUUsRUFBRSxtQkFBbUI7SUFFaEUsdUJBQXVCO0lBQ3ZCLGNBQWMsRUFBRSxhQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsUUFBUSxFQUFFLEVBQUUsOENBQThDO0lBQ3ZGLHlCQUF5QixFQUFFLGFBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxRQUFRLEVBQUU7SUFDbEQsYUFBYSxFQUFFLGFBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxRQUFRLEVBQUU7SUFFdEMsc0JBQXNCO0lBQ3RCLFlBQVksRUFBRSxhQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsUUFBUSxFQUFFLEVBQUUsc0JBQXNCO0lBQzdELFdBQVcsRUFBRSxhQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsUUFBUSxFQUFFLEVBQUUsc0JBQXNCO0lBQzVELGlCQUFpQixFQUFFLGFBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxRQUFRLEVBQUUsRUFBRSxvQkFBb0I7Q0FDakUsQ0FBQyxDQUFBIn0=