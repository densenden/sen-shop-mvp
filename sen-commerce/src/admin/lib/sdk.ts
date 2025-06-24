import Medusa from "@medusajs/js-sdk"

// Use process.env for backend compatibility
export const sdk = new Medusa({
  baseUrl: process.env.VITE_BACKEND_URL || "/",
  debug: process.env.NODE_ENV === "development",
  auth: {
    type: "session",
  },
}) 