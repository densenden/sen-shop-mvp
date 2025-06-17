import { useState, useEffect } from "react"
import { Button, Container, Heading, Table } from "@medusajs/ui"
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

      <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded">
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
                  <Link to={`/artworks/${artwork.id}`} className="flex-1">
                    <Button variant="secondary" size="small" className="w-full">
                      <PencilSquare />
                    </Button>
                  </Link>
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
    </Container>
  )
}

export default ArtworkCollectionOverview 