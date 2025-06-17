import { useState, useEffect } from "react"
import { Button, Container, Heading, Input, Label, Select, Textarea } from "@medusajs/ui"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft } from "@medusajs/icons"
import { uploadImageToSupabase } from "../../../lib/supabase-uploader"

const PURPOSE_OPTIONS = [
  { value: "artwork", label: "Artwork" },
  { value: "merchandise", label: "Merchandise" },
  { value: "present", label: "Present" },
  { value: "wallart", label: "Wall Art" },
  { value: "other", label: "Other" }
]

const EditArtworkCollection = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [form, setForm] = useState({
    name: "",
    description: "",
    topic: "",
    month_created: "",
    midjourney_version: "",
    purpose: "",
    thumbnail_url: ""
  })
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchCollection()
  }, [id])

  const fetchCollection = async () => {
    try {
      const response = await fetch(`/admin/artwork-collections/${id}`, {
        credentials: "include",
      })
      const data = await response.json()
      setForm(data)
      if (data.thumbnail_url) {
        setThumbnailPreview(data.thumbnail_url)
      }
    } catch (error) {
      console.error("Error fetching collection:", error)
      alert("Failed to load collection")
      navigate("/artwork-collections")
    } finally {
      setLoading(false)
    }
  }

  const handleThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setThumbnailFile(file)
    setThumbnailPreview(URL.createObjectURL(file))
    
    // Upload immediately
    setUploading(true)
    try {
      const imageUrl = await uploadImageToSupabase(file)
      setForm({ ...form, thumbnail_url: imageUrl })
      setThumbnailPreview(imageUrl)
    } catch (error) {
      console.error("Error uploading image:", error)
      alert("Failed to upload image. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  const handleFormChange = (field: string, value: string) => {
    setForm({ ...form, [field]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      await fetch(`/admin/artwork-collections/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      })
      navigate("/artwork-collections")
    } catch (err) {
      alert("Failed to update collection. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <Container>
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="secondary"
          size="small"
          onClick={() => navigate("/artwork-collections")}
        >
          <ArrowLeft />
        </Button>
        <Heading>Edit Artwork Collection</Heading>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={form.name}
            onChange={e => handleFormChange("name", e.target.value)}
            required
            placeholder="Collection name"
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={form.description || ""}
            onChange={e => handleFormChange("description", e.target.value)}
            rows={3}
            placeholder="Collection description"
          />
        </div>

        <div>
          <Label htmlFor="topic">Topic</Label>
          <Input
            id="topic"
            value={form.topic || ""}
            onChange={e => handleFormChange("topic", e.target.value)}
            placeholder="Collection topic"
          />
        </div>

        <div>
          <Label htmlFor="month_created">Month Created</Label>
          <Input
            id="month_created"
            value={form.month_created || ""}
            onChange={e => handleFormChange("month_created", e.target.value)}
            placeholder="YYYY-MM"
          />
        </div>

        <div>
          <Label htmlFor="midjourney_version">Midjourney Version</Label>
          <Input
            id="midjourney_version"
            value={form.midjourney_version || ""}
            onChange={e => handleFormChange("midjourney_version", e.target.value)}
            placeholder="e.g., v5.2"
          />
        </div>

        <div>
          <Label htmlFor="purpose">Purpose</Label>
          <Select value={form.purpose || ""} onValueChange={v => handleFormChange("purpose", v)}>
            <Select.Trigger>
              <Select.Value placeholder="Select purpose" />
            </Select.Trigger>
            <Select.Content>
              {PURPOSE_OPTIONS.map(opt => (
                <Select.Item key={opt.value} value={opt.value}>
                  {opt.label}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </div>

        <div>
          <Label htmlFor="thumbnail">Thumbnail</Label>
          <Input
            id="thumbnail"
            type="file"
            accept="image/*"
            onChange={handleThumbnailChange}
            disabled={uploading}
          />
          {uploading && <p className="text-sm text-gray-500 mt-1">Uploading to Supabase...</p>}
          {thumbnailPreview && (
            <img
              src={thumbnailPreview}
              alt="Preview"
              className="mt-2 w-32 h-32 object-cover rounded"
            />
          )}
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={saving || uploading}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate("/artwork-collections")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Container>
  )
}

export default EditArtworkCollection 