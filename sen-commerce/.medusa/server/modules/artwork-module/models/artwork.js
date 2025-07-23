"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Artwork = void 0;
const utils_1 = require("@medusajs/framework/utils");
exports.Artwork = utils_1.model.define("artwork", {
    id: utils_1.model.id().primaryKey(),
    title: utils_1.model.text(),
    description: utils_1.model.text().nullable(),
    image_url: utils_1.model.text(),
    artwork_collection_id: utils_1.model.text().nullable(),
    product_ids: utils_1.model.json().nullable(),
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXJ0d29yay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9tb2R1bGVzL2FydHdvcmstbW9kdWxlL21vZGVscy9hcnR3b3JrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHFEQUFpRDtBQUVwQyxRQUFBLE9BQU8sR0FBRyxhQUFLLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRTtJQUM3QyxFQUFFLEVBQUUsYUFBSyxDQUFDLEVBQUUsRUFBRSxDQUFDLFVBQVUsRUFBRTtJQUMzQixLQUFLLEVBQUUsYUFBSyxDQUFDLElBQUksRUFBRTtJQUNuQixXQUFXLEVBQUUsYUFBSyxDQUFDLElBQUksRUFBRSxDQUFDLFFBQVEsRUFBRTtJQUNwQyxTQUFTLEVBQUUsYUFBSyxDQUFDLElBQUksRUFBRTtJQUN2QixxQkFBcUIsRUFBRSxhQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsUUFBUSxFQUFFO0lBQzlDLFdBQVcsRUFBRSxhQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsUUFBUSxFQUFFO0NBQ3JDLENBQUMsQ0FBQSJ9