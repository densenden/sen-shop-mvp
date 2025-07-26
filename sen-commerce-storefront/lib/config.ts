export const MEDUSA_API_CONFIG = {
  baseUrl: 'http://localhost:9000',
  publishableApiKey: 'pk_0b024fc90febe17f54a9359f1e0d24141802d6e4b951bf227649695ee31895e0'
}

export const getHeaders = () => ({
  'x-publishable-api-key': MEDUSA_API_CONFIG.publishableApiKey,
  'Content-Type': 'application/json'
})