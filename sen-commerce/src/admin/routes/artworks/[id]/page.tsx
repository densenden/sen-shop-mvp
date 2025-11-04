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

  // For bulk upload
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadedImages, setUploadedImages] = useState<Array<{file: File, url: string, title: string}>>([])
  const [bulkTitlePrefix, setBulkTitlePrefix] = useState("")
  const [bulkDescription, setBulkDescription] = useState("")

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

      // Auto-analyze the image and generate description
      await analyzeImage(imageUrl)
    } catch (error) {
      console.error("Error uploading image:", error)
      alert("Failed to upload image. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  const analyzeImage = async (imageUrl: string) => {
    try {
      console.log("[Artwork Upload] Analyzing image with AI...")
      const response = await fetch("/admin/artworks/analyze-image", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image_url: imageUrl }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.description) {
          console.log("[Artwork Upload] AI description received:", data.description)
          setArtwork(prev => ({ ...prev, description: data.description }))
        }
      }
    } catch (error) {
      console.error("[Artwork Upload] Error analyzing image:", error)
      // Don't show error to user - just skip the AI description
    }
  }

  const handleMultipleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setSelectedFiles(files)
    // Generate default titles from filenames
    const imagesWithTitles = files.map(file => ({
      file,
      url: URL.createObjectURL(file),
      title: file.name.replace(/\.[^/.]+$/, "") // Remove extension
    }))
    setUploadedImages(imagesWithTitles)
  }

  const handleBulkUpload = async () => {
    if (uploadedImages.length === 0) {
      alert("Please select at least one image")
      return
    }

    if (!artwork.artwork_collection_id) {
      alert("Please select a collection")
      return
    }

    setSaving(true)
    setUploading(true)

    try {
      const createdArtworks = []

      for (let i = 0; i < uploadedImages.length; i++) {
        const image = uploadedImages[i]

        // Upload to Supabase
        const imageUrl = await uploadImageToSupabase(image.file)

        // AI analyze image to get description (if bulk description is empty)
        let description = bulkDescription
        if (!description) {
          try {
            console.log(`[Bulk Upload] Analyzing image ${i + 1}/${uploadedImages.length} with AI...`)
            const analysisResponse = await fetch("/admin/artworks/analyze-image", {
              method: "POST",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ image_url: imageUrl }),
            })

            if (analysisResponse.ok) {
              const analysisData = await analysisResponse.json()
              if (analysisData.description) {
                description = analysisData.description
                console.log(`[Bulk Upload] AI description generated for image ${i + 1}`)
              }
            }
          } catch (error) {
            console.error(`[Bulk Upload] Failed to analyze image ${i + 1}:`, error)
            // Continue without AI description
          }
        }

        // Create artwork
        const title = bulkTitlePrefix
          ? `${bulkTitlePrefix} ${image.title}`
          : image.title

        const artworkData = {
          title,
          description,
          image_url: imageUrl,
          artwork_collection_id: artwork.artwork_collection_id,
          product_ids: artwork.product_ids
        }

        const response = await fetch("/admin/artworks", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(artworkData),
        })

        if (response.ok) {
          createdArtworks.push(title)
        } else {
          console.error(`Failed to create artwork: ${title}`)
        }
      }

      alert(`Successfully created ${createdArtworks.length} artworks${!bulkDescription ? ' with AI-generated descriptions' : ''}!`)
      navigate("/artworks")
    } catch (error) {
      console.error("Error during bulk upload:", error)
      alert("Failed to upload some artworks. Please check the console.")
    } finally {
      setSaving(false)
      setUploading(false)
    }
  }

  const updateImageTitle = (index: number, newTitle: string) => {
    const updated = [...uploadedImages]
    updated[index].title = newTitle
    setUploadedImages(updated)
  }

  const removeImage = (index: number) => {
    const updated = uploadedImages.filter((_, i) => i !== index)
    setUploadedImages(updated)
    const updatedFiles = selectedFiles.filter((_, i) => i !== index)
    setSelectedFiles(updatedFiles)
  }

  if (loading) return <div>Loading...</div>

  return (
    <Container>
      <div className="mb-6">
        <Heading>{isNew ? "Create Artwork(s)" : "Edit Artwork"}</Heading>
        {isNew && (
          <p className="text-sm text-gray-600 mt-2">
            Upload multiple images at once to create several artworks in the same collection.
          </p>
        )}
      </div>

      {isNew ? (
        /* Bulk Upload Mode */
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <Label className="text-lg font-semibold mb-2">Multiple Image Upload</Label>
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={handleMultipleFilesSelect}
              disabled={uploading}
              className="mt-2"
            />
            <p className="text-sm text-gray-600 mt-1">
              Select multiple images to upload at once. Each will become a separate artwork.
            </p>
          </div>

          {uploadedImages.length > 0 && (
            <>
              <div>
                <Label>Collection (required)</Label>
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
                <Label>Title Prefix (optional)</Label>
                <Input
                  value={bulkTitlePrefix}
                  onChange={(e) => setBulkTitlePrefix(e.target.value)}
                  placeholder="e.g., 'Abstract Art' - will be prepended to each title"
                />
              </div>

              <div>
                <Label>Description (optional - AI will generate if empty)</Label>
                <Textarea
                  value={bulkDescription}
                  onChange={(e) => setBulkDescription(e.target.value)}
                  rows={3}
                  placeholder="Leave empty to automatically generate AI descriptions for each artwork"
                />
              </div>

              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-semibold mb-3">
                  Selected Images ({uploadedImages.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {uploadedImages.map((image, index) => (
                    <div key={index} className="border rounded-lg overflow-hidden">
                      <img
                        src={image.url}
                        alt={image.title}
                        className="w-full h-32 object-cover"
                      />
                      <div className="p-2">
                        <Input
                          value={image.title}
                          onChange={(e) => updateImageTitle(index, e.target.value)}
                          placeholder="Artwork title"
                          className="text-sm"
                        />
                        <Button
                          type="button"
                          variant="danger"
                          size="small"
                          onClick={() => removeImage(index)}
                          className="mt-2 w-full"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleBulkUpload}
                  disabled={saving || uploading}
                >
                  {uploading
                    ? "Uploading..."
                    : saving
                    ? "Creating Artworks..."
                    : `Create ${uploadedImages.length} Artwork${uploadedImages.length > 1 ? "s" : ""}`}
                </Button>
                <Button type="button" variant="secondary" onClick={() => navigate("/artworks")}>
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      ) : (
        /* Single Artwork Edit Mode */
        <form onSubmit={handleSubmit}>
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
              <Label>Description {uploading && "(AI analyzing image...)"}</Label>
              <Textarea
                value={artwork.description}
                onChange={(e) => setArtwork({ ...artwork, description: e.target.value })}
                rows={4}
                placeholder="Upload an image to automatically generate an AI description, or write your own"
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
      )}
    </Container>
  )
}

export default ArtworkDetail 