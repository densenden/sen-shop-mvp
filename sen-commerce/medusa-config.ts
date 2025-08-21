import { loadEnv, defineConfig, Modules } from '@medusajs/framework/utils';

loadEnv(process.env.NODE_ENV || 'development', process.cwd());

export default defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret"
    }
  },
  admin: {
    backendUrl: process.env.MEDUSA_BACKEND_URL || "http://localhost:9000",
    path: "/app",
    outDir: "./build"
  },
  modules: [
    {
      resolve: "@medusajs/medusa/cache-redis",
      options: { 
        redisUrl: process.env.CACHE_REDIS_URL,
        ttl: 30, 
        namespace: "medusa:"
      },
    },
    {
      resolve: "@medusajs/medusa/stock-location",
      options: {
        database: {
          clientUrl: process.env.DATABASE_URL,
        }
      }
    },
    {
      resolve: "./src/modules/artwork-module",
      alias: "artworkModuleService",
      definition: {
        isQueryable: true
      }
    },
    {
      resolve: "./src/modules/digital-product",
      alias: "digitalProductModuleService",
      definition: {
        isQueryable: true
      }
    },
    {
      resolve: "@medusajs/medusa/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/file-s3",
            id: "s3",
            options: {
              // File URL for public access
              file_url: process.env.S3_FILE_URL!,
              // S3 Access Keys from Supabase
              access_key_id: process.env.S3_ACCESS_KEY_ID!,
              secret_access_key: process.env.S3_SECRET_ACCESS_KEY!,
              // Supabase specific settings
              region: process.env.S3_REGION || "auto",
              bucket: process.env.S3_BUCKET!,
              endpoint: process.env.S3_ENDPOINT!,
              // Supabase S3 compatibility
        additional_client_config: {
                forcePathStyle: true
              }
            }
        }
        ]
      }
    },
    {
      resolve: "./src/modules/printful",
      alias: "printfulModule",
      definition: {
        isQueryable: true
      }
    },
  ]
});
