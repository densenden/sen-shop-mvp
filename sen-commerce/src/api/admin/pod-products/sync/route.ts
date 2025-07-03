// Simple Medusa/Express-style handler for POST /admin/pod-products/sync
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  // TODO: Add your sync logic here
  res.json({ success: true });
} 