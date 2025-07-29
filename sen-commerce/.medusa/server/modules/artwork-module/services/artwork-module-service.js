"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArtworkModuleService = void 0;
const utils_1 = require("@medusajs/framework/utils");
const models_1 = require("../models");
class ArtworkModuleService extends (0, utils_1.MedusaService)({
    Artwork: models_1.Artwork,
    ArtworkCollection: models_1.ArtworkCollection,
    ArtworkProductRelation: models_1.ArtworkProductRelation, // Add ArtworkProductRelation to the service
}) {
    // MedusaService automatically generates:
    // - listArtworks(filters, config)
    // - listArtworkCollections(filters, config)
    // - createArtworks(data)
    // - createArtworkCollections(data)
    // - updateArtworks(id, data)
    // - updateArtworkCollections(id, data)
    // - deleteArtworks(id)
    // - deleteArtworkCollections(id)
    // - listArtworkProductRelations(filters, config)
    // - createArtworkProductRelations(data)
    // - updateArtworkProductRelations(id, data)
    // - deleteArtworkProductRelations(id)
    async createArtworkProductRelation(data) {
        const [relation] = await this.createArtworkProductRelations([data]);
        return relation;
    }
}
exports.ArtworkModuleService = ArtworkModuleService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXJ0d29yay1tb2R1bGUtc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9tb2R1bGVzL2FydHdvcmstbW9kdWxlL3NlcnZpY2VzL2FydHdvcmstbW9kdWxlLXNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEscURBQXlEO0FBQ3pELHNDQUE4RTtBQUU5RSxNQUFNLG9CQUFxQixTQUFRLElBQUEscUJBQWEsRUFBQztJQUMvQyxPQUFPLEVBQVAsZ0JBQU87SUFDUCxpQkFBaUIsRUFBakIsMEJBQWlCO0lBQ2pCLHNCQUFzQixFQUF0QiwrQkFBc0IsRUFBRSw0Q0FBNEM7Q0FDckUsQ0FBQztJQUNBLHlDQUF5QztJQUN6QyxrQ0FBa0M7SUFDbEMsNENBQTRDO0lBQzVDLHlCQUF5QjtJQUN6QixtQ0FBbUM7SUFDbkMsNkJBQTZCO0lBQzdCLHVDQUF1QztJQUN2Qyx1QkFBdUI7SUFDdkIsaUNBQWlDO0lBQ2pDLGlEQUFpRDtJQUNqRCx3Q0FBd0M7SUFDeEMsNENBQTRDO0lBQzVDLHNDQUFzQztJQUV0QyxLQUFLLENBQUMsNEJBQTRCLENBQUMsSUFNbEM7UUFDQyxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQUcsTUFBTSxJQUFJLENBQUMsNkJBQTZCLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFBO1FBQ25FLE9BQU8sUUFBUSxDQUFBO0lBQ2pCLENBQUM7Q0FDRjtBQUVRLG9EQUFvQiJ9