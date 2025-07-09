import { useEffect, useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { Container, Heading, Input, Label, Textarea, Button, Select } from "@medusajs/ui"

// This page shows details for a single Printful product and allows linking to an artwork
export default function PrintfulProductDetailPage() {
  // Get the product ID from the URL
  const { id } = useParams()
  const navigate = useNavigate()
  // Use 'any' type for simplicity (for beginners)
  const [product, setProduct] = useState<any>(null)
  const [artworks, setArtworks] = useState<any[]>([])
  const [selectedArtwork, setSelectedArtwork] = useState("")
  const [linking, setLinking] = useState(false)
  const [message, setMessage] = useState("")
  // Editable fields
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  // Fetch the Printful product details
  useEffect(() => {
    async function fetchProduct() {
      const res = await fetch(`/admin/printful-catalog-products?id=${id}`)
      const data = await res.json()
      let prod = null
      if (Array.isArray(data.products)) {
        prod = data.products.find((p: any) => String(p.id) === String(id))
      } else {
        prod = data.product || null
      }
      setProduct(prod)
      if (prod) {
        setName(prod.name || "")
        setDescription(prod.description || "")
      }
    }
    fetchProduct()
  }, [id])

  // Fetch all artworks for linking (simple version)
  useEffect(() => {
    async function fetchArtworks() {
      const res = await fetch("/admin/artworks")
      const data = await res.json()
      setArtworks(data.artworks || [])
      // Log fetched artworks for debugging
      console.log("Fetched artworks for selector:", data.artworks)
    }
    fetchArtworks()
  }, [])

  // Handle linking the product to an artwork
  async function linkToArtwork() {
    if (!selectedArtwork) return
    setLinking(true)
    setMessage("")
    // Log selected artwork ID for debugging
    console.log("Linking to artwork ID:", selectedArtwork)
    // Call backend to link product to artwork (implement this API!)
    const res = await fetch(`/admin/printful-products/${id}/link-artwork`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ artwork_id: selectedArtwork })
    })
    if (res.ok) {
      setMessage("Linked successfully!")
    } else {
      setMessage("Failed to link artwork.")
    }
    setLinking(false)
  }

  if (!product) return <div>Loading product...</div>

  return (
    <Container className="max-w-2xl mx-auto p-8">
      <Button variant="secondary" onClick={() => navigate("/printful-products")}>{"<- Back to Printful Products"}</Button>
      <div className="mb-6 mt-4">
        <Heading>Printful Product Detail</Heading>
      </div>
      {/* Product Image */}
      {product.thumbnail_url && (
        <div className="flex flex-col items-center mb-4">
          <img src={product.thumbnail_url} alt={name} style={{ maxWidth: 200 }} className="rounded shadow" />
        </div>
      )}
      {/* Read-only Fields */}
      <div>
        <Label>Name</Label>
        <Input value={name} disabled readOnly />
      </div>
      <div>
        <Label>Description</Label>
        <Textarea value={description} rows={3} disabled readOnly />
      </div>
      {/* Artwork linking UI */}
      <div>
        <Label>Link to Artwork</Label>
        <div className="flex gap-2 items-center">
          <Select value={selectedArtwork} onValueChange={setSelectedArtwork} disabled={linking}>
            <Select.Trigger>
              <Select.Value placeholder="Select artwork" />
            </Select.Trigger>
            <Select.Content>
              {/* Only map artworks with non-empty id */}
              {artworks.filter((a: any) => a.id && a.id !== "").map((a: any) => (
                <Select.Item key={a.id} value={a.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {a.image_url && (
                      <img src={a.image_url} alt={a.title} style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 4 }} />
                    )}
                    <span>{a.title}</span>
                  </div>
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
          <Button onClick={linkToArtwork} disabled={linking || !selectedArtwork} type="button">
            {linking ? "Linking..." : "Link"}
          </Button>
        </div>
        {/* Show message: red for error, green for success */}
        {message && (
          message === "Failed to link artwork." ? (
            <div style={{ color: 'red', fontWeight: 'bold' }}>{message}</div>
          ) : (
            <div className="text-sm text-green-600 mt-2">{message}</div>
          )
        )}
      </div>
    </Container>
  )
} 