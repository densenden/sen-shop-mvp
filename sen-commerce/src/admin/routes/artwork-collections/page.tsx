import { useEffect, useState } from "react"
import { Button, Container, Heading, Table } from "@medusajs/ui"
import { Link } from "react-router-dom"
import { defineRouteConfig } from "@medusajs/admin-sdk"
import { PencilSquare, Trash, Swatch } from "@medusajs/icons"

const ArtworkCollectionsPage = () => {
  const [collections, setCollections] = useState([])
  const [artworks, setArtworks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCollections()
    fetchArtworks()
  }, [])

  const fetchCollections = async () => {
    try {
      const res = await fetch("/admin/artwork-collections", { credentials: "include" })
      
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`)
      }
      
      const data = await res.json()
      console.log("artwork-collections API response:", data)
      if (Array.isArray(data)) {
        data.forEach(col => console.log('Collection:', col.name, 'Thumbnail:', col.thumbnail_url))
      }
      setCollections(Array.isArray(data) ? data : data.collections || [])
    } catch (err) {
      console.error("Error fetching collections:", err)
      setCollections([])
    } finally {
      setLoading(false)
    }
  }

  const fetchArtworks = async () => {
    try {
      const res = await fetch("/admin/artworks", { credentials: "include" })
      const data = await res.json()
      setArtworks(data.artworks || [])
    } catch (err) {
      console.error("Error fetching artworks:", err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this collection?")) return
    
    try {
      const response = await fetch(`/admin/artwork-collections/${id}`, {
        method: "DELETE",
        credentials: "include",
      })
      
      if (response.ok) {
        // Refresh the list
        fetchCollections()
        fetchArtworks()
      } else {
        alert("Failed to delete collection")
      }
    } catch (error) {
      console.error("Error deleting collection:", error)
      alert("Failed to delete collection")
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <Container>
      <div className="flex items-center justify-between mb-6">
        <Heading>Artwork Collections</Heading>
        <Link to="/artwork-collections/new">
          <Button>Create Collection</Button>
        </Link>
      </div>

      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Thumbnail</Table.HeaderCell>
            <Table.HeaderCell>Name</Table.HeaderCell>
            <Table.HeaderCell>Topic</Table.HeaderCell>
            <Table.HeaderCell>Purpose</Table.HeaderCell>
            <Table.HeaderCell>Artworks</Table.HeaderCell>
            <Table.HeaderCell>Actions</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {collections.map((col: any) => {
            const colArtworks = artworks.filter((a: any) => a.artwork_collection_id === col.id)
            return (
              <Table.Row key={col.id}>
                <Table.Cell>
                  {col.thumbnail_url && (
                    <img 
                      src={col.thumbnail_url} 
                      alt={col.name}
                      className="w-16 h-16 object-cover rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  )}
                </Table.Cell>
                <Table.Cell>
                  <Link 
                    to={`/artwork-collections/${col.id}/overview`} 
                    className="text-blue-600 hover:underline font-medium"
                  >
                    {col.name}
                  </Link>
                </Table.Cell>
                <Table.Cell>{col.topic || "-"}</Table.Cell>
                <Table.Cell>{col.purpose || "-"}</Table.Cell>
                <Table.Cell>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {colArtworks.slice(0, 3).map((a: any) => (
                        <img 
                          key={a.id} 
                          src={a.image_url} 
                          alt={a.title}
                          className="w-8 h-8 object-cover rounded-full border-2 border-white"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      {colArtworks.length} artworks
                    </span>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <div className="flex gap-2">
                    <Link to={`/artwork-collections/${col.id}`}>
                      <Button variant="secondary" size="small">
                        <PencilSquare />
                      </Button>
                    </Link>
                    <Button
                      variant="danger"
                      size="small"
                      onClick={() => handleDelete(col.id)}
                    >
                      <Trash />
                    </Button>
                  </div>
                </Table.Cell>
              </Table.Row>
            )
          })}
        </Table.Body>
      </Table>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Artwork Collections",
  icon: Swatch,
})

export default ArtworkCollectionsPage 