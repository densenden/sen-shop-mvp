import { useEffect, useState } from "react"
import { Container, Heading, Button, Table } from "@medusajs/ui"
import { CloudArrowDown, PencilSquare } from "@medusajs/icons"
import { useNavigate } from "react-router-dom"
import { defineRouteConfig } from "@medusajs/admin-sdk"

const PrintfulProductsPage = () => {
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const navigate = useNavigate()

  const fetchProducts = async () => {
    setIsLoading(true)
    const res = await fetch("/api/admin/printful-catalog-products", { credentials: "include" })
    const data = await res.json()
    setProducts(data.products || [])
    setIsLoading(false)
  }

  const syncNow = async () => {
    setIsSyncing(true)
    await fetch("/api/admin/printful-sync", { method: "POST", credentials: "include" })
    await fetchProducts()
    setIsSyncing(false)
  }

  useEffect(() => { fetchProducts() }, [])

  return (
    <Container className="flex flex-col gap-4 p-8">
      <div className="flex items-center justify-between">
        <Heading>Printful Products</Heading>
        <Button variant="primary" size="small" onClick={syncNow} isLoading={isSyncing}>
          <CloudArrowDown />
          Sync
        </Button>
      </div>
      {isLoading ? (
        <div>Loading Printful products...</div>
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Thumbnail</Table.HeaderCell>
              <Table.HeaderCell>Name</Table.HeaderCell>
              <Table.HeaderCell>Artwork</Table.HeaderCell>
              <Table.HeaderCell>Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {products.length === 0 ? (
              <Table.Row>
                <td colSpan={4} className="text-center text-gray-500">
                  No Printful products yet. Click "Sync" to import.
                </td>
              </Table.Row>
            ) : (
              products.map((prod: any) => (
                <Table.Row key={prod.id}>
                  <Table.Cell><img src={prod.thumbnail_url} width={48} height={48} alt="thumbnail" /></Table.Cell>
                  <Table.Cell>{prod.name}</Table.Cell>
                  <Table.Cell>{prod.artwork_title || "Not linked"}</Table.Cell>
                  <Table.Cell>
                    <Button variant="secondary" size="small" onClick={() => navigate(`/admin/printful-products/${prod.id}`)}>
                      <PencilSquare />
                    </Button>
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

export const config = defineRouteConfig({
  label: "Printful Products",
  icon: CloudArrowDown,
})

export default PrintfulProductsPage 