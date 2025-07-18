import { useEffect, useState } from "react"
import { Container, Heading, Button, Table } from "@medusajs/ui"
import { Plus, CloudArrowDown, PencilSquare, Trash } from "@medusajs/icons"
import { Link } from "react-router-dom"
import { defineRouteConfig } from "@medusajs/admin-sdk"

type DigitalProduct = {
  id: string
  name: string
  mime_type: string
  file_size: number
  created_at: string
}

// Main page for listing digital products
const DigitalProductsPage = () => {
  const [digitalProducts, setDigitalProducts] = useState<DigitalProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDigitalProducts()
  }, [])

  const fetchDigitalProducts = async () => {
    try {
      const response = await fetch("/admin/digital-products", {
        credentials: "include",
      })
      const data = await response.json()
      setDigitalProducts(data.digital_products || [])
    } catch (error) {
      console.error("Error fetching digital products:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this digital product?")) return

    try {
      await fetch(`/admin/digital-products/${id}`, {
        method: "DELETE",
        credentials: "include",
      })
      await fetchDigitalProducts()
    } catch (error) {
      console.error("Error deleting digital product:", error)
    }
  }

  return (
    <Container className="flex flex-col gap-4 p-8">
      <div className="flex items-center justify-between">
        <Heading>Digital Products</Heading>
        <Link to="/digital-products/new">
          <Button variant="primary" size="small">
            <Plus />
            Add Digital Product
          </Button>
        </Link>
      </div>

      {loading ? (
        <div>Loading digital products...</div>
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Name</Table.HeaderCell>
              <Table.HeaderCell>File Type</Table.HeaderCell>
              <Table.HeaderCell>Size</Table.HeaderCell>
              <Table.HeaderCell>Created</Table.HeaderCell>
              <Table.HeaderCell>Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {digitalProducts.length === 0 ? (
              <Table.Row>
                <td colSpan={5} className="text-center text-gray-500">
                  No digital products yet. Click "Add Digital Product" to create one.
                </td>
              </Table.Row>
            ) : (
              digitalProducts.map((product: DigitalProduct) => (
                <Table.Row key={product.id}>
                  <Table.Cell>{product.name}</Table.Cell>
                  <Table.Cell>{product.mime_type}</Table.Cell>
                  <Table.Cell>{formatFileSize(product.file_size)}</Table.Cell>
                  <Table.Cell>
                    {new Date(product.created_at).toLocaleDateString()}
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex gap-2">
                      <Link to={`/digital-products/${product.id}`}>
                        <Button variant="secondary" size="small">
                          <PencilSquare />
                        </Button>
                      </Link>
                      <Button
                        variant="danger"
                        size="small"
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash />
                      </Button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table>
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

export const config = defineRouteConfig({
  label: "Digital Products",
  icon: CloudArrowDown,
})

export default DigitalProductsPage 