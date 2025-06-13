import { useState } from "react"
import { Button, Container, Heading, Input, Label, Select, Textarea } from "@medusajs/ui"
import { useNavigate } from "react-router-dom"
import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ArrowLeft } from "@medusajs/icons"

const PURPOSE_OPTIONS = [
  { value: "artwork", label: "Artwork" },
  { value: "merchandise", label: "Merchandise" },
  { value: "present", label: "Present" },
  { value: "wallart", label: "Wall Art" },
  { value: "other", label: "Other" }
]

const CreateArtworkCollection = () => {
  const navigate = useNavigate()
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

  const handleThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setThumbnailFile(file)
    setThumbnailPreview(URL.createObjectURL(file))
  }

  const handleFormChange = (field: string, value: string) => {
    setForm({ ...form, [field]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    let thumbnail_url = form.thumbnail_url

    // If thumbnail file selected, upload it first
    if (thumbnailFile) {
      try {
        const formData = new FormData()
        formData.append("file", thumbnailFile)
        const res = await fetch("/admin/uploads", {
          method: "POST",
          credentials: "include",
          body: formData
        })
        const data = await res.json()
        console.log('[artwork-collections] Upload response:', data)
        if (data.files && data.files[0]) {
          thumbnail_url = data.files[0].url
          console.log('[artwork-collections] Thumbnail URL:', thumbnail_url)
        }
      } catch (err) {
        alert("Failed to upload thumbnail. Please try again.")
        setSaving(false)
        return
      }
    }

    try {
      await fetch("/admin/artwork-collections", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, thumbnail_url })
      })
      navigate("/artwork-collections")
    } catch (err) {
      alert("Failed to create collection. Please try again.")
    } finally {
      setSaving(false)
    }
  }

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
        <Heading>Create Artwork Collection</Heading>
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
            value={form.description}
            onChange={e => handleFormChange("description", e.target.value)}
            rows={3}
            placeholder="Collection description"
          />
        </div>

        <div>
          <Label htmlFor="topic">Topic</Label>
          <Input
            id="topic"
            value={form.topic}
            onChange={e => handleFormChange("topic", e.target.value)}
            placeholder="Collection topic"
          />
        </div>

        <div>
          <Label htmlFor="month_created">Month Created</Label>
          <Input
            id="month_created"
            value={form.month_created}
            onChange={e => handleFormChange("month_created", e.target.value)}
            placeholder="YYYY-MM"
          />
        </div>

        <div>
          <Label htmlFor="midjourney_version">Midjourney Version</Label>
          <Input
            id="midjourney_version"
            value={form.midjourney_version}
            onChange={e => handleFormChange("midjourney_version", e.target.value)}
            placeholder="e.g., v5.2"
          />
        </div>

        <div>
          <Label htmlFor="purpose">Purpose</Label>
          <Select value={form.purpose} onValueChange={v => handleFormChange("purpose", v)}>
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
          />
          {thumbnailFile && (
            <p className="text-sm text-gray-600 mt-1">{thumbnailFile.name}</p>
          )}
          {thumbnailPreview && (
            <img
              src={thumbnailPreview}
              alt="Preview"
              className="mt-2 w-32 h-32 object-cover rounded"
            />
          )}
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Creating..." : "Create Collection"}
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

export const config = defineRouteConfig({
  label: "Create Collection",
})

export default CreateArtworkCollection 