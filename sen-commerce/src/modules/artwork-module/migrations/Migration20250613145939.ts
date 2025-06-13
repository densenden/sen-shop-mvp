import { Migration } from '@mikro-orm/migrations';

export class Migration20250613145939 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "artwork" ("id" text not null, "title" text not null, "description" text null, "image_url" text not null, "artwork_collection_id" text not null, "product_ids" text[] not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "artwork_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_artwork_deleted_at" ON "artwork" (deleted_at) WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "artwork_collection" ("id" text not null, "name" text not null, "description" text null, "topic" text null, "month_created" text null, "midjourney_version" text null, "purpose" text null, "thumbnail_url" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "artwork_collection_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_artwork_collection_deleted_at" ON "artwork_collection" (deleted_at) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "artwork" cascade;`);

    this.addSql(`drop table if exists "artwork_collection" cascade;`);
  }

}
