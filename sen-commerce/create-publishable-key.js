const { medusaIntegrationTestRunner } = require("@medusajs/test-utils")
const { resolve } = require("path")

medusaIntegrationTestRunner({
  testSuite: () => {
    console.log("Creating publishable API key...")
    // This would create a publishable API key
    const key = "pk_0b024fc90febe17f54a9359f1e0d24141802d6e4b951bf227649695ee31895e0"
    console.log("Key to create:", key)
  },
  cwd: __dirname,
})