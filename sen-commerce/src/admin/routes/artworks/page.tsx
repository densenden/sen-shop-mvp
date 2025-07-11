import { useEffect, useState } from "react"
import { Button, Container, Heading, Table, Text } from "@medusajs/ui"
import { Link } from "react-router-dom"
import { PencilSquare, Trash, Photo } from "@medusajs/icons"
import { defineRouteConfig } from "@medusajs/admin-sdk"

const ArtworksList = () => {
  const [artworks, setArtworks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchArtworks()
  }, [])

  const fetchArtworks = async () => {
    try {
      const response = await fetch("/admin/artworks", {
        credentials: "include",
      })
      const data = await response.json()
      setArtworks(data.artworks || [])
    } catch (error) {
      console.error("Error fetching artworks:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this artwork?")) return

    try {
      await fetch(`/admin/artworks/${id}`, {
        method: "DELETE",
        credentials: "include",
      })
      await fetchArtworks()
    } catch (error) {
      console.error("Error deleting artwork:", error)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <Container>
      <div className="flex items-center justify-between mb-6">
        <Heading>Artworks</Heading>
        <Link to="/artworks/new">
          <Button>Create Artwork</Button>
        </Link>
      </div>

      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Image</Table.HeaderCell>
            <Table.HeaderCell>Title</Table.HeaderCell>
            <Table.HeaderCell>Collection</Table.HeaderCell>
            <Table.HeaderCell>Products</Table.HeaderCell>
            <Table.HeaderCell>Actions</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {artworks.map((artwork: any) => (
            <Table.Row key={artwork.id}>
              <Table.Cell>
                {artwork.image_url && (
                  <img
                    src={artwork.image_url}
                    alt={artwork.title}
                    className="w-16 h-16 object-cover rounded"
                  />
                )}
              </Table.Cell>
              <Table.Cell>{artwork.title}</Table.Cell>
              <Table.Cell>
                {artwork.artwork_collection?.name || "-"}
              </Table.Cell>
              <Table.Cell>
                {artwork.product_ids?.length || 0} products
              </Table.Cell>
              <Table.Cell>
                <div className="flex gap-2">
                  <Link to={`/artworks/${artwork.id}`}>
                    <Button variant="secondary" size="small">
                      <PencilSquare />
                    </Button>
                  </Link>
                  <Button
                    variant="danger"
                    size="small"
                    onClick={() => handleDelete(artwork.id)}
                  >
                    <Trash />
                  </Button>
                </div>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Artworks",
  icon: Photo,
})

export default ArtworksList 