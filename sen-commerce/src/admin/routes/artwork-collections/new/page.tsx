import { useState } from "react"
import { Button, Container, Heading, Input, Label, Select, Textarea, Badge, Text } from "@medusajs/ui"
import { useNavigate } from "react-router-dom"
import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ArrowLeft, Plus, X } from "@medusajs/icons"
import { uploadImageToSupabase } from "../../../lib/supabase-uploader"

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
    thumbnail_url: "",
    // New fields
    brand_story: "",
    genesis_story: "",
    design_philosophy: "",
    core_values: [] as string[],
    visual_themes: [] as string[],
    lifestyle_concepts: [] as string[],
    campaign_ideas: [] as { title: string; description: string }[],
    target_audience_messaging: "",
    brand_tagline: "",
    brand_colors: [] as string[],
    brand_fonts: [] as string[],
    social_media_tags: [] as string[]
  })
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  // Input states for array fields
  const [currentValue, setCurrentValue] = useState({
    core_value: "",
    visual_theme: "",
    lifestyle_concept: "",
    campaign_title: "",
    campaign_description: "",
    brand_color: "",
    brand_font: "",
    social_media_tag: ""
  })

  const handleThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setThumbnailFile(file)
    setThumbnailPreview(URL.createObjectURL(file))
    
    // Upload immediately to Supabase
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

  const addToArray = (field: keyof typeof form, value: string) => {
    if (value.trim() && Array.isArray(form[field])) {
      setForm({ ...form, [field]: [...(form[field] as string[]), value.trim()] })
    }
  }

  const removeFromArray = (field: keyof typeof form, index: number) => {
    if (Array.isArray(form[field])) {
      const newArray = [...(form[field] as any[])]
      newArray.splice(index, 1)
      setForm({ ...form, [field]: newArray })
    }
  }

  const addCampaignIdea = () => {
    if (currentValue.campaign_title.trim()) {
      setForm({
        ...form,
        campaign_ideas: [...form.campaign_ideas, {
          title: currentValue.campaign_title.trim(),
          description: currentValue.campaign_description.trim()
        }]
      })
      setCurrentValue({ ...currentValue, campaign_title: "", campaign_description: "" })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      const response = await fetch("/admin/artwork-collections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(form)
      })
      
      if (!response.ok) {
        throw new Error("Failed to create collection")
      }
      
      navigate("/artwork-collections")
    } catch (error) {
      console.error("Error:", error)
      alert("Failed to create collection. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Container>
      <div className="mb-8">
        <Button variant="secondary" onClick={() => navigate("/artwork-collections")}>
          <ArrowLeft className="mr-2" />
          Back to Collections
        </Button>
      </div>
      
      <Heading level="h1" className="mb-6">Create Artwork Collection</Heading>
      
      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        {/* Basic Information */}
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <Heading level="h2" className="text-xl">Basic Information</Heading>
          
          <div>
            <Label htmlFor="name">Collection Name *</Label>
            <Input
              id="name"
              type="text"
              value={form.name}
              onChange={(e) => handleFormChange("name", e.target.value)}
              required
              placeholder="e.g., Brobrella"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => handleFormChange("description", e.target.value)}
              placeholder="Brief description of the collection"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="topic">Topic</Label>
              <Input
                id="topic"
                type="text"
                value={form.topic}
                onChange={(e) => handleFormChange("topic", e.target.value)}
                placeholder="e.g., Urban Streetwear"
              />
            </div>
            
            <div>
              <Label htmlFor="purpose">Purpose</Label>
              <Select value={form.purpose} onValueChange={(value) => handleFormChange("purpose", value)}>
                <Select.Trigger>
                  <Select.Value placeholder="Select purpose" />
                </Select.Trigger>
                <Select.Content>
                  {PURPOSE_OPTIONS.map(option => (
                    <Select.Item key={option.value} value={option.value}>
                      {option.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="month_created">Month Created</Label>
              <Input
                id="month_created"
                type="text"
                value={form.month_created}
                onChange={(e) => handleFormChange("month_created", e.target.value)}
                placeholder="e.g., May 2023"
              />
            </div>
            
            <div>
              <Label htmlFor="midjourney_version">Midjourney Version</Label>
              <Input
                id="midjourney_version"
                type="text"
                value={form.midjourney_version}
                onChange={(e) => handleFormChange("midjourney_version", e.target.value)}
                placeholder="e.g., v5.2"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="thumbnail">Thumbnail</Label>
            <input
              id="thumbnail"
              type="file"
              accept="image/*"
              onChange={handleThumbnailChange}
              className="hidden"
            />
            <label
              htmlFor="thumbnail"
              className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400"
            >
              {thumbnailPreview ? (
                <img src={thumbnailPreview} alt="Thumbnail" className="h-full object-contain" />
              ) : (
                <span className="text-gray-500">
                  {uploading ? "Uploading..." : "Click to upload thumbnail"}
                </span>
              )}
            </label>
          </div>
        </div>

        {/* Brand Story & Identity */}
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <Heading level="h2" className="text-xl">Brand Story & Identity</Heading>
          
          <div>
            <Label htmlFor="brand_story">Brand Story</Label>
            <Textarea
              id="brand_story"
              value={form.brand_story}
              onChange={(e) => handleFormChange("brand_story", e.target.value)}
              placeholder="Tell the complete brand story..."
              rows={5}
            />
          </div>
          
          <div>
            <Label htmlFor="genesis_story">Genesis Story</Label>
            <Textarea
              id="genesis_story"
              value={form.genesis_story}
              onChange={(e) => handleFormChange("genesis_story", e.target.value)}
              placeholder="How did this brand/collection come to be?"
              rows={4}
            />
          </div>
          
          <div>
            <Label htmlFor="design_philosophy">Design Philosophy</Label>
            <Textarea
              id="design_philosophy"
              value={form.design_philosophy}
              onChange={(e) => handleFormChange("design_philosophy", e.target.value)}
              placeholder="What drives the design decisions?"
              rows={4}
            />
          </div>
          
          <div>
            <Label htmlFor="brand_tagline">Brand Tagline</Label>
            <Input
              id="brand_tagline"
              type="text"
              value={form.brand_tagline}
              onChange={(e) => handleFormChange("brand_tagline", e.target.value)}
              placeholder="e.g., 'We don't just wear the brand—we live the brotherhood.'"
            />
          </div>
        </div>

        {/* Marketing Keywords & Topics */}
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <Heading level="h2" className="text-xl">Marketing Keywords & Topics</Heading>
          
          {/* Core Values */}
          <div>
            <Label>Core Values</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={currentValue.core_value}
                onChange={(e) => setCurrentValue({ ...currentValue, core_value: e.target.value })}
                placeholder="Add a core value"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addToArray('core_values', currentValue.core_value)
                    setCurrentValue({ ...currentValue, core_value: "" })
                  }
                }}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  addToArray('core_values', currentValue.core_value)
                  setCurrentValue({ ...currentValue, core_value: "" })
                }}
              >
                <Plus />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.core_values.map((value, index) => (
                <Badge key={index} className="flex items-center gap-1">
                  {value}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => removeFromArray('core_values', index)}
                  />
                </Badge>
              ))}
            </div>
          </div>
          
          {/* Visual Themes */}
          <div>
            <Label>Visual Themes</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={currentValue.visual_theme}
                onChange={(e) => setCurrentValue({ ...currentValue, visual_theme: e.target.value })}
                placeholder="Add a visual theme"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addToArray('visual_themes', currentValue.visual_theme)
                    setCurrentValue({ ...currentValue, visual_theme: "" })
                  }
                }}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  addToArray('visual_themes', currentValue.visual_theme)
                  setCurrentValue({ ...currentValue, visual_theme: "" })
                }}
              >
                <Plus />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.visual_themes.map((theme, index) => (
                <Badge key={index} className="flex items-center gap-1">
                  {theme}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => removeFromArray('visual_themes', index)}
                  />
                </Badge>
              ))}
            </div>
          </div>
          
          {/* Lifestyle Concepts */}
          <div>
            <Label>Lifestyle Concepts</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={currentValue.lifestyle_concept}
                onChange={(e) => setCurrentValue({ ...currentValue, lifestyle_concept: e.target.value })}
                placeholder="Add a lifestyle concept"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addToArray('lifestyle_concepts', currentValue.lifestyle_concept)
                    setCurrentValue({ ...currentValue, lifestyle_concept: "" })
                  }
                }}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  addToArray('lifestyle_concepts', currentValue.lifestyle_concept)
                  setCurrentValue({ ...currentValue, lifestyle_concept: "" })
                }}
              >
                <Plus />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.lifestyle_concepts.map((concept, index) => (
                <Badge key={index} className="flex items-center gap-1">
                  {concept}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => removeFromArray('lifestyle_concepts', index)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Campaign Ideas */}
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <Heading level="h2" className="text-xl">Campaign Ideas</Heading>
          
          <div className="space-y-2">
            <Input
              value={currentValue.campaign_title}
              onChange={(e) => setCurrentValue({ ...currentValue, campaign_title: e.target.value })}
              placeholder="Campaign title"
            />
            <Input
              value={currentValue.campaign_description}
              onChange={(e) => setCurrentValue({ ...currentValue, campaign_description: e.target.value })}
              placeholder="Campaign description"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={addCampaignIdea}
              disabled={!currentValue.campaign_title.trim()}
            >
              Add Campaign Idea
            </Button>
          </div>
          
          <div className="space-y-2">
            {form.campaign_ideas.map((campaign, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg flex justify-between items-start">
                <div className="flex-1">
                  <Text className="font-semibold">{campaign.title}</Text>
                  <Text className="text-sm text-gray-600">{campaign.description}</Text>
                </div>
                <X
                  className="w-4 h-4 cursor-pointer text-gray-500 hover:text-gray-700"
                  onClick={() => removeFromArray('campaign_ideas', index)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Target Audience */}
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <Heading level="h2" className="text-xl">Target Audience</Heading>
          
          <div>
            <Label htmlFor="target_audience_messaging">Target Audience Messaging</Label>
            <Textarea
              id="target_audience_messaging"
              value={form.target_audience_messaging}
              onChange={(e) => handleFormChange("target_audience_messaging", e.target.value)}
              placeholder="Who is this for and what message resonates with them?"
              rows={4}
            />
          </div>
        </div>

        {/* Additional Branding */}
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <Heading level="h2" className="text-xl">Additional Branding</Heading>
          
          {/* Brand Colors */}
          <div>
            <Label>Brand Colors</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={currentValue.brand_color}
                onChange={(e) => setCurrentValue({ ...currentValue, brand_color: e.target.value })}
                placeholder="Add hex color (e.g., #FF0000)"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addToArray('brand_colors', currentValue.brand_color)
                    setCurrentValue({ ...currentValue, brand_color: "" })
                  }
                }}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  addToArray('brand_colors', currentValue.brand_color)
                  setCurrentValue({ ...currentValue, brand_color: "" })
                }}
              >
                <Plus />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.brand_colors.map((color, index) => (
                <Badge
                  key={index}
                  className="flex items-center gap-1"
                  style={{ backgroundColor: color.startsWith('#') ? color : '#000' }}
                >
                  <span className="text-white">{color}</span>
                  <X
                    className="w-3 h-3 cursor-pointer text-white"
                    onClick={() => removeFromArray('brand_colors', index)}
                  />
                </Badge>
              ))}
            </div>
          </div>
          
          {/* Social Media Tags */}
          <div>
            <Label>Social Media Tags</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={currentValue.social_media_tag}
                onChange={(e) => setCurrentValue({ ...currentValue, social_media_tag: e.target.value })}
                placeholder="Add hashtag (e.g., #brotherhood)"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addToArray('social_media_tags', currentValue.social_media_tag)
                    setCurrentValue({ ...currentValue, social_media_tag: "" })
                  }
                }}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  addToArray('social_media_tags', currentValue.social_media_tag)
                  setCurrentValue({ ...currentValue, social_media_tag: "" })
                }}
              >
                <Plus />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.social_media_tags.map((tag, index) => (
                <Badge key={index} className="flex items-center gap-1">
                  {tag}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => removeFromArray('social_media_tags', index)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex gap-4">
          <Button type="submit" disabled={saving || !form.name}>
            {saving ? "Creating..." : "Create Collection"}
          </Button>
          <Button variant="secondary" onClick={() => navigate("/artwork-collections")}>
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