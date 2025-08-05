#!/bin/bash

echo "🧪 Testing SenCommerce Email API Endpoints"
echo "========================================="

BASE_URL="http://localhost:9000"
EMAIL="shop@sen.studio"

echo ""
echo "1️⃣ Testing Connection..."
curl -s -X POST "$BASE_URL/api/admin/test-email" \
  -H "Content-Type: application/json" \
  -d '{"type": "connection-test"}' | jq '.'

echo ""
echo "2️⃣ Testing Welcome Email..."
curl -s -X POST "$BASE_URL/api/admin/test-email" \
  -H "Content-Type: application/json" \
  -d "{\"type\": \"welcome\", \"email\": \"$EMAIL\"}" | jq '.'

echo ""
echo "3️⃣ Testing Order Confirmation..."
curl -s -X POST "$BASE_URL/api/admin/test-email" \
  -H "Content-Type: application/json" \
  -d "{\"type\": \"order-confirmation\", \"email\": \"$EMAIL\"}" | jq '.'

echo ""
echo "4️⃣ Testing Download Links..."
curl -s -X POST "$BASE_URL/api/admin/test-email" \
  -H "Content-Type: application/json" \
  -d "{\"type\": \"download-links\", \"email\": \"$EMAIL\"}" | jq '.'

echo ""
echo "5️⃣ Testing Payment Confirmation..."
curl -s -X POST "$BASE_URL/api/admin/test-email" \
  -H "Content-Type: application/json" \
  -d "{\"type\": \"payment-confirmation\", \"email\": \"$EMAIL\"}" | jq '.'

echo ""
echo "✅ All API tests completed!"
echo "📧 Check your email at $EMAIL for all templates"