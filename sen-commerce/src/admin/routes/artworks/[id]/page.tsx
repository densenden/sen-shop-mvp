import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button, Container, Heading, Input, Label, Select, Textarea } from "@medusajs/ui"
import { uploadImageToSupabase } from "../../../lib/supabase-uploader"

const ArtworkDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === "new"
  
  const [artwork, setArtwork] = useState<{
    title: string
    description: string
    image_url: string
    artwork_collection_id: string
    product_ids: string[]
  }>({
    title: "",
    description: "",
    image_url: "",
    artwork_collection_id: "",
    product_ids: []
  })
  const [collections, setCollections] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchCollections()
    fetchProducts()
    if (!isNew) {
      fetchArtwork()
    }
  }, [id])

  const fetchArtwork = async () => {
    try {
      console.log("Fetching artwork with ID:", id)
      const response = await fetch(`/admin/artworks/${id}`, {
        credentials: "include",
      })
      
      console.log("Response status:", response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error response:", errorText)
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
      }
      
      const data = await response.json()
      console.log("Received data:", data)
      
      if (!data.artwork) {
        throw new Error("No artwork data in response")
      }
      
      // Ensure all fields have default values
      setArtwork({
        title: data.artwork.title || "",
        description: data.artwork.description || "",
        image_url: data.artwork.image_url || "",
        artwork_collection_id: data.artwork.artwork_collection_id || "",
        product_ids: data.artwork.product_ids || []
      })
    } catch (error) {
      console.error("Error fetching artwork:", error)
      console.error("Error details:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id: id,
        url: `/admin/artworks/${id}`
      })
      alert(`Failed to load artwork: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setLoading(false)
    }
  }

  const fetchCollections = async () => {
    try {
      const response = await fetch("/admin/artwork-collections", {
        credentials: "include",
      })
      const data = await response.json()
      console.log("Collections data:", data)
      setCollections(Array.isArray(data) ? data : data.collections || [])
    } catch (error) {
      console.error("Error fetching collections:", error)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch("/admin/products", {
        credentials: "include",
      })
      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error("Error fetching products:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = isNew ? "/admin/artworks" : `/admin/artworks/${id}`
      const method = isNew ? "POST" : "PUT"
      
      const response = await fetch(url, {
        method,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(artwork),
      })

      if (response.ok) {
        navigate("/artworks")
      }
    } catch (error) {
      console.error("Error saving artwork:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const imageUrl = await uploadImageToSupabase(file)
      setArtwork({ ...artwork, image_url: imageUrl })
    } catch (error) {
      console.error("Error uploading image:", error)
      alert("Failed to upload image. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <Container>
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <Heading>{isNew ? "Create Artwork" : "Edit Artwork"}</Heading>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input
              value={artwork.title}
              onChange={(e) => setArtwork({ ...artwork, title: e.target.value })}
              required
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={artwork.description}
              onChange={(e) => setArtwork({ ...artwork, description: e.target.value })}
              rows={4}
            />
          </div>

          <div>
            <Label>Image</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
            />
            {uploading && <p className="text-sm text-gray-500 mt-1">Uploading to Supabase...</p>}
            {artwork.image_url && (
              <img
                src={artwork.image_url}
                alt="Preview"
                className="mt-2 w-32 h-32 object-cover rounded"
              />
            )}
          </div>

          <div>
            <Label>Collection</Label>
            <Select
              value={artwork.artwork_collection_id}
              onValueChange={(value) => setArtwork({ ...artwork, artwork_collection_id: value })}
            >
              <Select.Trigger>
                <Select.Value placeholder="Select a collection" />
              </Select.Trigger>
              <Select.Content>
                {collections.map((collection: any) => (
                  <Select.Item key={collection.id} value={collection.id}>
                    {collection.name}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
          </div>

          <div>
            <Label>Products</Label>
            <div className="space-y-2">
              {products.map((product: any) => (
                <label key={product.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={artwork.product_ids.includes(product.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setArtwork({ ...artwork, product_ids: [...artwork.product_ids, product.id] })
                      } else {
                        setArtwork({ ...artwork, product_ids: artwork.product_ids.filter(pid => pid !== product.id) })
                      }
                    }}
                  />
                  {product.title}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <Button type="submit" disabled={saving || uploading}>
            {saving ? "Saving..." : "Save"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate("/artworks")}>
            Cancel
          </Button>
        </div>
      </form>
    </Container>
  )
}

export default ArtworkDetail 