# Setup Guide for SenCommerce

## Environment Variables

### Backend Configuration
Create a `.env` file in the `sen-commerce` directory with the following:

```
# Database
DATABASE_URL=postgres://localhost/medusa-db

# JWT & Cookie secrets
JWT_SECRET=your-super-secret-jwt-secret
COOKIE_SECRET=your-super-secret-cookie-secret

# CORS configuration
STORE_CORS=http://localhost:8000
ADMIN_CORS=http://localhost:9000
AUTH_CORS=http://localhost:9000
```

### Frontend Configuration
Create a `.env` file in the `sen-commerce-storefront` directory:

```
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=<will-be-generated>
MEDUSA_BACKEND_URL=http://localhost:9000
```

## Setup Steps

### 1. Install Dependencies

```bash
# Backend
cd sen-commerce
npm install

# Frontend
cd ../sen-commerce-storefront
npm install
```

### 2. Setup Database

```bash
cd sen-commerce

# Run migrations
npx medusa db:migrate

# Run seed (optional - adds sample data)
npm run seed
```

### 3. Start the Backend Server

```bash
npm run dev
```

The server will start at http://localhost:9000

### 4. Create Admin User

Once the server is running, you need to create an admin user. There are two ways:

#### Option A: Using the Admin UI (Recommended)
1. Open http://localhost:9000/app in your browser
2. Click "Create account" 
3. Fill in your admin credentials
4. Login with your new account

#### Option B: Using API
```bash
# Create admin user via API
curl -X POST http://localhost:9000/auth/user/emailpass/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@sen.studio",
    "password": "NwO_2025"
  }'
```

### 5. Generate Publishable API Key

After creating an admin user and logging in:

1. Go to Admin Dashboard → Settings → API Keys
2. Click "Create API Key"
3. Set type as "Publishable"
4. Copy the generated key
5. Add it to `sen-commerce-storefront/.env`:
   ```
   NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=your-generated-key
   ```

Alternative: Use the script after starting the server:
```bash
npx medusa exec ./src/scripts/create-publishable-key.ts
```

### 6. Create Customer Account

Customers can register through the storefront:

1. Start the storefront: `npm run dev` (in sen-commerce-storefront)
2. Go to http://localhost:8000
3. Click "Account" → "Register"
4. Fill in customer details

Or via API:
```bash
curl -X POST http://localhost:9000/store/customers \
  -H "Content-Type: application/json" \
  -H "x-publishable-api-key: your-publishable-key" \
  -d '{
    "email": "customer@sen.studio",
    "password": "customer123",
    "first_name": "Test",
    "last_name": "Customer"
  }'
```

## User Types in Medusa 2

- **Admin Users**: Access the admin panel at http://localhost:9000/app
- **Customer Users**: Shop on the storefront at http://localhost:8000

## Troubleshooting

### Module Resolution Errors
If you see errors like "Could not resolve '@medusajs/user'", make sure:
1. All dependencies are installed
2. The server is running before executing scripts
3. You're using the correct Medusa v2 APIs

### Publishable Key Issues
If the storefront shows "Missing required environment variables":
1. Ensure the key is generated and added to `.env`
2. Restart the Next.js development server
3. Check that the key starts with `pk_` 