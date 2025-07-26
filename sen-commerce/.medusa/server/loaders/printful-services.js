"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = printfulServicesLoader;
const awilix_1 = require("awilix");
const printful_fulfillment_service_1 = require("../modules/printful/services/printful-fulfillment-service");
const printful_order_service_1 = require("../modules/printful/services/printful-order-service");
async function printfulServicesLoader({ container }) {
    try {
        container.register({
            printfulFulfillmentService: (0, awilix_1.asClass)(printful_fulfillment_service_1.PrintfulFulfillmentService).singleton(),
            printfulOrderService: (0, awilix_1.asClass)(printful_order_service_1.PrintfulOrderService).singleton()
        });
        console.log("Printful services registered successfully");
    }
    catch (error) {
        console.error("Failed to register Printful services:", error);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJpbnRmdWwtc2VydmljZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbG9hZGVycy9wcmludGZ1bC1zZXJ2aWNlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUlBLHlDQVdDO0FBZkQsbUNBQWdDO0FBQ2hDLDRHQUFzRztBQUN0RyxnR0FBMEY7QUFFM0UsS0FBSyxVQUFVLHNCQUFzQixDQUFDLEVBQUUsU0FBUyxFQUFFO0lBQ2hFLElBQUksQ0FBQztRQUNILFNBQVMsQ0FBQyxRQUFRLENBQUM7WUFDakIsMEJBQTBCLEVBQUUsSUFBQSxnQkFBTyxFQUFDLHlEQUEwQixDQUFDLENBQUMsU0FBUyxFQUFFO1lBQzNFLG9CQUFvQixFQUFFLElBQUEsZ0JBQU8sRUFBQyw2Q0FBb0IsQ0FBQyxDQUFDLFNBQVMsRUFBRTtTQUNoRSxDQUFDLENBQUE7UUFFRixPQUFPLENBQUMsR0FBRyxDQUFDLDJDQUEyQyxDQUFDLENBQUE7SUFDMUQsQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDZixPQUFPLENBQUMsS0FBSyxDQUFDLHVDQUF1QyxFQUFFLEtBQUssQ0FBQyxDQUFBO0lBQy9ELENBQUM7QUFDSCxDQUFDIn0=