export interface CreateArtworkDTO {
  title: string
  description?: string
  image_url: string
  artwork_collection_id: string
  product_ids?: string[] | null
}

export interface UpdateArtworkDTO {
  title?: string
  description?: string
  image_url?: string
  artwork_collection_id?: string
  product_ids?: Record<string, unknown> | null
}

export interface CreateArtworkCollectionDTO {
  title: string
  slug: string
  description?: string
  topic?: string
  month_created?: string
  midjourney_version?: string
  purpose?: string
  thumbnail_url?: string
}

export interface UpdateArtworkCollectionDTO {
  title?: string
  slug?: string
  description?: string
  topic?: string
  month_created?: string
  midjourney_version?: string
  purpose?: string
  thumbnail_url?: string
} 