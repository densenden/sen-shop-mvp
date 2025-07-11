"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const artwork_module_1 = require("../../../modules/artwork-module");
console.log("[Medusa] Loaded /admin/artwork-collections route.ts");
async function GET(req, res) {
    const artworkModuleService = req.scope.resolve(artwork_module_1.ARTWORK_MODULE);
    const artworkCollections = await artworkModuleService.listArtworkCollections();
    res.json(artworkCollections);
}
async function POST(req, res) {
    const artworkModuleService = req.scope.resolve(artwork_module_1.ARTWORK_MODULE);
    const body = req.body;
    console.log('[artwork-collections] POST body:', body);
    try {
        const artworkCollection = await artworkModuleService.createArtworkCollections(body);
        console.log('[artwork-collections] Created:', artworkCollection);
        res.json(artworkCollection);
    }
    catch (error) {
        console.error('[artwork-collections] Error:', error);
        res.status(500).json({ code: 'unknown_error', type: 'unknown_error', message: error.message || 'An unknown error occurred.' });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL2FydHdvcmstY29sbGVjdGlvbnMvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFLQSxrQkFJQztBQUVELG9CQVlDO0FBdEJELG9FQUFnRTtBQUVoRSxPQUFPLENBQUMsR0FBRyxDQUFDLHFEQUFxRCxDQUFDLENBQUM7QUFFNUQsS0FBSyxVQUFVLEdBQUcsQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQy9ELE1BQU0sb0JBQW9CLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsK0JBQWMsQ0FBQyxDQUFBO0lBQzlELE1BQU0sa0JBQWtCLEdBQUcsTUFBTSxvQkFBb0IsQ0FBQyxzQkFBc0IsRUFBRSxDQUFBO0lBQzlFLEdBQUcsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQTtBQUM5QixDQUFDO0FBRU0sS0FBSyxVQUFVLElBQUksQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQ2hFLE1BQU0sb0JBQW9CLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsK0JBQWMsQ0FBQyxDQUFBO0lBQzlELE1BQU0sSUFBSSxHQUFHLEdBQUcsQ0FBQyxJQUFXLENBQUE7SUFDNUIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQ0FBa0MsRUFBRSxJQUFJLENBQUMsQ0FBQTtJQUNyRCxJQUFJLENBQUM7UUFDSCxNQUFNLGlCQUFpQixHQUFHLE1BQU0sb0JBQW9CLENBQUMsd0JBQXdCLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDbkYsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQ0FBZ0MsRUFBRSxpQkFBaUIsQ0FBQyxDQUFBO1FBQ2hFLEdBQUcsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQTtJQUM3QixDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNmLE9BQU8sQ0FBQyxLQUFLLENBQUMsOEJBQThCLEVBQUUsS0FBSyxDQUFDLENBQUE7UUFDcEQsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLEVBQUUsZUFBZSxFQUFFLElBQUksRUFBRSxlQUFlLEVBQUUsT0FBTyxFQUFFLEtBQUssQ0FBQyxPQUFPLElBQUksNEJBQTRCLEVBQUUsQ0FBQyxDQUFBO0lBQ2hJLENBQUM7QUFDSCxDQUFDIn0=