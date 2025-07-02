import Medusa from "@medusajs/js-sdk"

// Use getEnvVar for compatibility with both frontend and backend
export const sdk = new Medusa({
  baseUrl: process.env.VITE_BACKEND_URL || "/",
  debug: process.env.DEV === "true",
  auth: {
    type: "session",
  },
}) 