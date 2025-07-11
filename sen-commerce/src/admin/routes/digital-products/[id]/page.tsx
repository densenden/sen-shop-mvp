import { useState, useEffect } from "react"
import { Button, Container, Heading, Input, Label, Text, Badge } from "@medusajs/ui"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, CloudArrowDown, Trash } from "@medusajs/icons"

interface DigitalProduct {
  id: string
  name: string
  description?: string
  file_url: string
  file_key: string
  file_size: number
  mime_type: string
  max_downloads: number
  expires_at?: string
  created_at: string
  updated_at: string
}


const DigitalProductDetailPage = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<DigitalProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Form fields
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [maxDownloads, setMaxDownloads] = useState(-1)
  

  useEffect(() => {
    fetchProduct()
  }, [id])

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/admin/digital-products/${id}`, {
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        const product = data.digital_product
        setProduct(product)
        // Prefill form
        setName(product.name)
        setDescription(product.description || "")
        setMaxDownloads(product.max_downloads)
      }
    } catch (error) {
      console.error("Error fetching digital product:", error)
    } finally {
      setLoading(false)
    }
  }


  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/admin/digital-products/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          max_downloads: maxDownloads,
        }),
      })

      if (response.ok) {
        await fetchProduct()
        setEditing(false)
      }
    } catch (error) {
      console.error("Error updating digital product:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this digital product? This will also remove the file from storage.")) {
      return
    }

    try {
      const response = await fetch(`/admin/digital-products/${id}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (response.ok) {
        navigate("/digital-products")
      }
    } catch (error) {
      console.error("Error deleting digital product:", error)
    }
  }


  if (loading) {
    return <Container>Loading...</Container>
  }

  if (!product) {
    return <Container>Digital product not found</Container>
  }

  return (
    <Container>
      <div className="mb-6 flex items-center justify-between">
        <Button
          variant="secondary"
          size="small"
          onClick={() => navigate("/digital-products")}
        >
          <ArrowLeft />
          Back
        </Button>
        <div className="flex gap-2">
          {!editing && (
            <Button
              variant="secondary"
              size="small"
              onClick={() => setEditing(true)}
            >
              Edit
            </Button>
          )}
          <Button
            variant="danger"
            size="small"
            onClick={handleDelete}
          >
            <Trash />
            Delete
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <Heading className="mb-2">{product.name}</Heading>
        <div className="flex gap-2 mb-4">
          <Badge>
            <CloudArrowDown className="h-3 w-3" />
            {formatFileSize(product.file_size)}
          </Badge>
          <Badge>{product.mime_type}</Badge>
          <Badge>
            {product.max_downloads === -1 ? "Unlimited" : `${product.max_downloads} downloads`}
          </Badge>
        </div>
      </div>

      {editing ? (
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4 max-w-xl">
          <div>
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
            />
          </div>

          <div>
            <Label htmlFor="max_downloads">Max Downloads</Label>
            <Input
              id="max_downloads"
              type="number"
              value={maxDownloads}
              onChange={(e) => setMaxDownloads(Number(e.target.value))}
            />
            <Text size="small" className="mt-1 text-gray-500">
              Set to -1 for unlimited downloads
            </Text>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setEditing(false)
                // Reset form
                setName(product.name)
                setDescription(product.description || "")
                setMaxDownloads(product.max_downloads)
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div>
            <Text size="small" className="text-gray-500">Description</Text>
            <Text>{product.description || "No description"}</Text>
          </div>

          <div>
            <Text size="small" className="text-gray-500">File Information</Text>
            <div className="mt-1 space-y-1">
              <Text>URL: <a href={product.file_url} target="_blank" className="text-blue-600 hover:underline">View File</a></Text>
              <Text>Size: {formatFileSize(product.file_size)}</Text>
              <Text>Type: {product.mime_type}</Text>
            </div>
          </div>

          <div>
            <Text size="small" className="text-gray-500">Settings</Text>
            <div className="mt-1">
              <Text>Max Downloads: {product.max_downloads === -1 ? "Unlimited" : product.max_downloads}</Text>
            </div>
          </div>

          <div>
            <Text size="small" className="text-gray-500">Timestamps</Text>
            <div className="mt-1 space-y-1">
              <Text>Created: {new Date(product.created_at).toLocaleString()}</Text>
              <Text>Updated: {new Date(product.updated_at).toLocaleString()}</Text>
            </div>
          </div>

        </div>
      )}
    </Container>
  )
}

// Helper to format file sizes
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B"
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
  return (bytes / (1024 * 1024)).toFixed(1) + " MB"
}

export default DigitalProductDetailPage 