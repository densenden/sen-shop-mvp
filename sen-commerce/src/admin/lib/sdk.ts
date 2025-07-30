import Medusa from "@medusajs/js-sdk"
import { getEnvVar } from "./env"

// Use getEnvVar for compatibility with both frontend and backend
export const sdk = new Medusa({
  baseUrl: getEnvVar("VITE_BACKEND_URL") || "http://localhost:9000",
  debug: getEnvVar("DEV") === "true",
  auth: {
    type: "session",
  },
}) 