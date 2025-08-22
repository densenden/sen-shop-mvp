import { defineRouteConfig } from "@medusajs/admin-sdk"
import { CloudArrowUp, DocumentText } from "@medusajs/icons"
import { Container, Heading, Button, Table, Badge, Text, Input, Label, toast } from "@medusajs/ui"
import { useState, useEffect, useRef } from "react"

const DigitalProductsPage = () => {
  const [digitalProducts, setDigitalProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [productName, setProductName] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchDigitalProducts()
  }, [])

  const fetchDigitalProducts = async () => {
    try {
      const response = await fetch("/admin/digital-products", {
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setDigitalProducts(data.digital_products || [])
      }
    } catch (error) {
      console.error("Error fetching digital products:", error)
      toast.error("Error", {
        description: "Failed to fetch digital products"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const file = fileInputRef.current?.files?.[0]
    if (!file || !productName) {
      toast.error("Error", {
        description: "Please provide both a name and file"
      })
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("name", productName)

    try {
      const response = await fetch("/admin/digital-products", {
        method: "POST",
        credentials: "include",
        body: formData,
      })

      if (response.ok) {
        toast.success("Success", {
          description: "Digital product uploaded successfully"
        })
        setShowUploadForm(false)
        setProductName("")
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
        await fetchDigitalProducts()
      } else {
        const error = await response.json()
        throw new Error(error.message || "Upload failed")
      }
    } catch (error) {
      console.error("Error uploading digital product:", error)
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Failed to upload digital product"
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this digital product?")) {
      return
    }

    try {
      const response = await fetch(`/admin/digital-products/${id}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (response.ok) {
        toast.success("Success", {
          description: "Digital product deleted successfully"
        })
        await fetchDigitalProducts()
      } else {
        throw new Error("Failed to delete")
      }
    } catch (error) {
      console.error("Error deleting digital product:", error)
      toast.error("Error", {
        description: "Failed to delete digital product"
      })
    }
  }

  const handleCreateProducts = async (digitalProductId: string) => {
    try {
      const response = await fetch(`/admin/digital-products/${digitalProductId}/create-products`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        toast.success("Success", {
          description: `Created ${data.product ? '1 product' : '0 products'} successfully`
        })
        
        // Navigate to the created product if it exists
        if (data.product && data.product.id) {
          setTimeout(() => {
            window.location.href = `/app/products/${data.product.id}`
          }, 1000) // Small delay to let the user see the success message
        }
      } else {
        throw new Error("Failed to create products")
      }
    } catch (error) {
      console.error("Error creating products:", error)
      toast.error("Error", {
        description: "Failed to create products from digital file"
      })
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center py-16">
          <Text>Loading digital products...</Text>
        </div>
      </Container>
    )
  }

  return (
    <Container>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <Heading level="h1">Digital Products</Heading>
            <Text className="text-ui-fg-subtle mt-2">
              Manage digital files for downloadable products
            </Text>
          </div>
          <Button
            variant="primary"
            onClick={() => setShowUploadForm(!showUploadForm)}
          >
            <CloudArrowUp />
            Upload Digital File
          </Button>
        </div>

        {showUploadForm && (
          <div className="p-6 border border-ui-border-base rounded-lg bg-ui-bg-subtle mb-6">
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <Label htmlFor="product-name">Product Name</Label>
                <Input
                  id="product-name"
                  type="text"
                  placeholder="Enter digital product name"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="file-upload">Digital File</Label>
                <input
                  ref={fileInputRef}
                  id="file-upload"
                  type="file"
                  className="block w-full text-sm text-ui-fg-base
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-ui-bg-base file:text-ui-fg-base
                    file:cursor-pointer file:border file:border-ui-border-base
                    hover:file:bg-ui-bg-subtle"
                  accept=".pdf,.zip,.mp3,.mp4,.png,.jpg,.jpeg,.docx,.xlsx,.pptx"
                  required
                />
                <Text size="small" className="text-ui-fg-subtle mt-1">
                  Supported formats: PDF, ZIP, MP3, MP4, Images, Office documents
                </Text>
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={uploading || !productName}
                >
                  {uploading ? "Uploading..." : "Upload File"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowUploadForm(false)
                    setProductName("")
                    if (fileInputRef.current) {
                      fileInputRef.current.value = ""
                    }
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>

      {digitalProducts.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-ui-border-base rounded-lg">
          <DocumentText className="mx-auto mb-4 text-ui-fg-subtle w-12 h-12" />
          <Text className="text-ui-fg-subtle mb-4">
            No digital products uploaded yet
          </Text>
          <Button
            variant="secondary"
            onClick={() => setShowUploadForm(true)}
          >
            <CloudArrowUp />
            Upload Your First Digital File
          </Button>
        </div>
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Name</Table.HeaderCell>
              <Table.HeaderCell>File Type</Table.HeaderCell>
              <Table.HeaderCell>Size</Table.HeaderCell>
              <Table.HeaderCell>Downloads</Table.HeaderCell>
              <Table.HeaderCell>Uploaded</Table.HeaderCell>
              <Table.HeaderCell>Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {digitalProducts.map((product) => (
              <Table.Row key={product.id}>
                <Table.Cell>
                  <div className="flex items-center gap-2">
                    <DocumentText className="text-ui-fg-subtle" />
                    <Text className="font-medium">{product.name}</Text>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <Badge size="small" color="blue">
                    {product.mime_type || "Unknown"}
                  </Badge>
                </Table.Cell>
                <Table.Cell>{formatFileSize(product.file_size || 0)}</Table.Cell>
                <Table.Cell>
                  <Text>{product.download_count || 0}</Text>
                </Table.Cell>
                <Table.Cell>
                  <Text size="small" className="text-ui-fg-subtle">
                    {formatDate(product.created_at)}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => handleCreateProducts(product.id)}
                    >
                      Create Product
                    </Button>
                    <Button
                      variant="danger"
                      size="small"
                      onClick={() => handleDelete(product.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Digital Files",
  icon: CloudArrowUp,
})

export default DigitalProductsPage