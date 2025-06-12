export interface CreateArtworkDTO {
  title: string
  description?: string
  image_url: string
  artwork_collection_id: string
  product_ids?: string[]
}

export interface UpdateArtworkDTO {
  title?: string
  description?: string
  image_url?: string
  artwork_collection_id?: string
  product_ids?: string[]
}

export interface CreateArtworkCollectionDTO {
  title: string
  slug: string
  description?: string
}

export interface UpdateArtworkCollectionDTO {
  title?: string
  slug?: string
  description?: string
} 