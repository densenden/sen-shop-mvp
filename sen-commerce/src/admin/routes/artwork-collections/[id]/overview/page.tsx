import { useState, useEffect } from "react"
import { Button, Container, Heading, Table, Badge, Text } from "@medusajs/ui"
import { useNavigate, useParams, Link } from "react-router-dom"
import { ArrowLeft, PencilSquare, Trash, Plus } from "@medusajs/icons"

const ArtworkCollectionOverview = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [collection, setCollection] = useState<any>(null)
  const [artworks, setArtworks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCollectionAndArtworks()
  }, [id])

  const fetchCollectionAndArtworks = async () => {
    try {
      // Fetch collection details
      const collectionRes = await fetch(`/admin/artwork-collections/${id}`, {
        credentials: "include",
      })
      const collectionData = await collectionRes.json()
      setCollection(collectionData)

      // Fetch all artworks
      const artworksRes = await fetch("/admin/artworks", {
        credentials: "include",
      })
      const artworksData = await artworksRes.json()
      
      // Filter artworks that belong to this collection
      const collectionArtworks = artworksData.artworks.filter(
        (artwork: any) => artwork.artwork_collection_id === id
      )
      setArtworks(collectionArtworks)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteArtwork = async (artworkId: string) => {
    if (!confirm("Are you sure you want to delete this artwork?")) return

    try {
      await fetch(`/admin/artworks/${artworkId}`, {
        method: "DELETE",
        credentials: "include",
      })
      await fetchCollectionAndArtworks()
    } catch (error) {
      console.error("Error deleting artwork:", error)
    }
  }

  if (loading) return <div>Loading...</div>

  if (!collection) return <div>Collection not found</div>

  return (
    <Container>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            size="small"
            onClick={() => navigate("/artwork-collections")}
          >
            <ArrowLeft />
          </Button>
          <div>
            <Heading>{collection.name}</Heading>
            {collection.description && (
              <p className="text-gray-600 mt-1">{collection.description}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/artwork-collections/${id}`}>
            <Button variant="secondary">
              <PencilSquare />
              Edit Collection
            </Button>
          </Link>
          <Link to="/artworks/new">
            <Button>
              <Plus />
              Add Artwork
            </Button>
          </Link>
        </div>
      </div>

      {/* Basic Information */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <Heading level="h2" className="text-lg mb-4">Basic Information</Heading>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Topic</p>
            <p className="font-medium">{collection.topic || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Purpose</p>
            <p className="font-medium">{collection.purpose || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Created</p>
            <p className="font-medium">{collection.month_created || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Midjourney Version</p>
            <p className="font-medium">{collection.midjourney_version || "-"}</p>
          </div>
        </div>
      </div>

      {/* Editorial Images */}
      {(collection.editorial_image_1 || collection.editorial_image_2 || collection.editorial_image_3 || collection.editorial_image_4) && (
        <div className="bg-white rounded-lg border p-6 mb-6">
          <Heading level="h2" className="text-lg mb-4">Editorial Images</Heading>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[collection.editorial_image_1, collection.editorial_image_2, collection.editorial_image_3, collection.editorial_image_4].map((image, index) => (
              image && (
                <div key={index} className="aspect-square">
                  <img
                    src={image}
                    alt={`Editorial ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {/* Brand Story & Identity */}
      {(collection.brand_story || collection.genesis_story || collection.design_philosophy || collection.brand_tagline) && (
        <div className="bg-white rounded-lg border p-6 mb-6">
          <Heading level="h2" className="text-lg mb-4">Brand Story & Identity</Heading>
          {collection.brand_story && (
            <div className="mb-4">
              <Text className="font-semibold text-sm text-gray-600 mb-1">Brand Story</Text>
              <Text className="whitespace-pre-wrap">{collection.brand_story}</Text>
            </div>
          )}
          {collection.genesis_story && (
            <div className="mb-4">
              <Text className="font-semibold text-sm text-gray-600 mb-1">Genesis Story</Text>
              <Text className="whitespace-pre-wrap">{collection.genesis_story}</Text>
            </div>
          )}
          {collection.design_philosophy && (
            <div className="mb-4">
              <Text className="font-semibold text-sm text-gray-600 mb-1">Design Philosophy</Text>
              <Text className="whitespace-pre-wrap">{collection.design_philosophy}</Text>
            </div>
          )}
          {collection.brand_tagline && (
            <div>
              <Text className="font-semibold text-sm text-gray-600 mb-1">Brand Tagline</Text>
              <Text className="text-lg italic">"{collection.brand_tagline}"</Text>
            </div>
          )}
        </div>
      )}

      {/* Marketing Keywords & Topics */}
      {(collection.core_values?.length > 0 || collection.visual_themes?.length > 0 || collection.lifestyle_concepts?.length > 0) && (
        <div className="bg-white rounded-lg border p-6 mb-6">
          <Heading level="h2" className="text-lg mb-4">Marketing Keywords & Topics</Heading>
          {collection.core_values?.length > 0 && (
            <div className="mb-4">
              <Text className="font-semibold text-sm text-gray-600 mb-2">Core Values</Text>
              <div className="flex flex-wrap gap-2">
                {collection.core_values.map((value: string, index: number) => (
                  <Badge key={index}>{value}</Badge>
                ))}
              </div>
            </div>
          )}
          {collection.visual_themes?.length > 0 && (
            <div className="mb-4">
              <Text className="font-semibold text-sm text-gray-600 mb-2">Visual Themes</Text>
              <div className="flex flex-wrap gap-2">
                {collection.visual_themes.map((theme: string, index: number) => (
                  <Badge key={index}>{theme}</Badge>
                ))}
              </div>
            </div>
          )}
          {collection.lifestyle_concepts?.length > 0 && (
            <div>
              <Text className="font-semibold text-sm text-gray-600 mb-2">Lifestyle Concepts</Text>
              <div className="flex flex-wrap gap-2">
                {collection.lifestyle_concepts.map((concept: string, index: number) => (
                  <Badge key={index}>{concept}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Campaign Ideas */}
      {collection.campaign_ideas?.length > 0 && (
        <div className="bg-white rounded-lg border p-6 mb-6">
          <Heading level="h2" className="text-lg mb-4">Campaign Ideas</Heading>
          <div className="space-y-3">
            {collection.campaign_ideas.map((idea: any, index: number) => (
              <div key={index} className="bg-gray-50 p-4 rounded">
                <Text className="font-semibold">{idea.title}</Text>
                {idea.description && <Text className="text-sm text-gray-600 mt-1">{idea.description}</Text>}
              </div>
            ))}
          </div>
          {collection.target_audience_messaging && (
            <div className="mt-4 pt-4 border-t">
              <Text className="font-semibold text-sm text-gray-600 mb-1">Target Audience Messaging</Text>
              <Text>{collection.target_audience_messaging}</Text>
            </div>
          )}
        </div>
      )}

      {/* Brand Assets */}
      {(collection.brand_colors?.length > 0 || collection.brand_fonts?.length > 0 || collection.social_media_tags?.length > 0) && (
        <div className="bg-white rounded-lg border p-6 mb-6">
          <Heading level="h2" className="text-lg mb-4">Brand Assets</Heading>
          {collection.brand_colors?.length > 0 && (
            <div className="mb-4">
              <Text className="font-semibold text-sm text-gray-600 mb-2">Brand Colors</Text>
              <div className="flex flex-wrap gap-2">
                {collection.brand_colors.map((color: string, index: number) => (
                  <div key={index} className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded">
                    <div className="w-6 h-6 rounded" style={{ backgroundColor: color }}></div>
                    <span className="text-sm">{color}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {collection.brand_fonts?.length > 0 && (
            <div className="mb-4">
              <Text className="font-semibold text-sm text-gray-600 mb-2">Brand Fonts</Text>
              <div className="flex flex-wrap gap-2">
                {collection.brand_fonts.map((font: string, index: number) => (
                  <Badge key={index}>{font}</Badge>
                ))}
              </div>
            </div>
          )}
          {collection.social_media_tags?.length > 0 && (
            <div>
              <Text className="font-semibold text-sm text-gray-600 mb-2">Social Media Tags</Text>
              <div className="flex flex-wrap gap-2">
                {collection.social_media_tags.map((tag: string, index: number) => (
                  <Badge key={index}>{tag}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Artworks Section */}
      <div className="bg-white rounded-lg border p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Artworks ({artworks.length})</h2>
        </div>

        {artworks.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded">
            <p className="text-gray-600">No artworks in this collection yet.</p>
            <Link to="/artworks/new">
              <Button className="mt-4">Add First Artwork</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {artworks.map((artwork) => (
              <div key={artwork.id} className="border rounded-lg overflow-hidden">
                <div className="aspect-square relative">
                  {artwork.image_url ? (
                    <img
                      src={artwork.image_url}
                      alt={artwork.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400">No image</span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-medium truncate">{artwork.title}</h3>
                  {artwork.description && (
                    <p className="text-sm text-gray-600 truncate">{artwork.description}</p>
                  )}
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="secondary"
                      size="small"
                      className="flex-1"
                      onClick={() => navigate(`/artworks/${artwork.id}`)}
                    >
                      <PencilSquare />
                    </Button>
                    <Button
                      variant="danger"
                      size="small"
                      onClick={() => handleDeleteArtwork(artwork.id)}
                    >
                      <Trash />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Container>
  )
}

export default ArtworkCollectionOverview 