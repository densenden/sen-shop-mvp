import type { MedusaAppOutput } from "@medusajs/framework"

export default {
  // Custom admin configuration
  projectConfig: {
    name: "SenCommerce",
    store_name: "SEN Studio Store", 
  },
  admin: {
    path: "/app",
    outDir: "./build",
    // Custom branding
    brand: {
      name: "SenCommerce",
      logo: "/logo.svg",
    },
    // Disable default routes we're overriding
    disable: [],
  },
}