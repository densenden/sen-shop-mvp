import React, { useEffect, useState, ChangeEvent } from "react"
import { Button, Table, Input } from "@medusajs/ui"
import { defineRouteConfig } from "@medusajs/admin-sdk"
import { CloudArrowDown } from "@medusajs/icons"

// Simple modal implementation
const Modal: React.FC<{ open: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ open, onClose, title, children }) => {
  if (!open) return null
  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "#fff", padding: 24, borderRadius: 8, minWidth: 400, maxWidth: 600 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3>{title}</h3>
          <Button onClick={onClose}>X</Button>
        </div>
        {children}
      </div>
    </div>
  )
}

// Edit modal for a single POD product
interface PodProductEditModalProps {
  product: any
  onClose: () => void
  onSave: () => void
}
const PodProductEditModal: React.FC<PodProductEditModalProps> = ({ product, onClose, onSave }) => {
  const [form, setForm] = useState({ ...product })
  const [isLoading, setIsLoading] = useState(false)

  // Reset to Printful original
  const resetToPrintful = async () => {
    setIsLoading(true)
    await fetch(`/admin/pod-products/${product.id}/reset`, { method: "POST", credentials: "include" })
    // Optionally refetch product details here
    setIsLoading(false)
  }

  // Save changes
  const save = async () => {
    setIsLoading(true)
    await fetch(`/admin/pod-products/${product.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form),
    })
    setIsLoading(false)
    onSave()
    onClose()
  }

  return (
    <Modal open onClose={onClose} title="Edit POD Product">
      <div>
        <img src={form.thumbnail_url} width={96} height={96} alt="thumbnail" />
        <Input value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: (e as ChangeEvent<HTMLInputElement>).target.value }))} placeholder="Name" />
        {/* Add more fields as needed */}
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <Button onClick={resetToPrintful} isLoading={isLoading}>Reset to Printful Original</Button>
          <Button onClick={save} isLoading={isLoading} variant="primary">Save</Button>
        </div>
      </div>
    </Modal>
  )
}

// Modal for artwork selection during sync
const ArtworkSelectorModal: React.FC<{
  products: any[]
  artworks: any[]
  onConfirm: (mappings: { printfulProductId: string, artworkId: string }[]) => void
  onClose: () => void
}> = ({ products, artworks, onConfirm, onClose }) => {
  const [mappings, setMappings] = useState<{ printfulProductId: string, artworkId: string }[]>(
    products.map(p => ({ printfulProductId: p.id, artworkId: artworks[0]?.id || "" }))
  )

  const setArtwork = (idx: number, artworkId: string) => {
    setMappings(m => m.map((map, i) => i === idx ? { ...map, artworkId } : map))
  }

  return (
    <Modal open onClose={onClose} title="Assign Artworks to New POD Products">
      <div>
        {products.map((prod, idx) => (
          <div key={prod.id} style={{ marginBottom: 16, borderBottom: "1px solid #eee", paddingBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <img src={prod.thumbnail_url} width={48} height={48} alt="thumbnail" />
              <div style={{ flex: 1 }}>
                <div><b>{prod.name}</b></div>
                <div style={{ fontSize: 12, color: '#888' }}>{prod.id}</div>
              </div>
              <select value={mappings[idx].artworkId} onChange={e => setArtwork(idx, e.target.value)}>
                {artworks.map(a => (
                  <option key={a.id} value={a.id}>{a.title}</option>
                ))}
              </select>
            </div>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => onConfirm(mappings)}>Sync</Button>
        </div>
      </div>
    </Modal>
  )
}

// Main POD products list page
const PodProductsList = () => {
  const [products, setProducts] = useState<any[]>([])
  const [selected, setSelected] = useState<any | null>(null)
  const [isListLoading, setIsListLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [showArtworkSelector, setShowArtworkSelector] = useState(false)
  const [newProducts, setNewProducts] = useState<any[]>([])
  const [artworks, setArtworks] = useState<any[]>([])

  // Fetch all POD products
  const fetchProducts = async () => {
    setIsListLoading(true)
    const res = await fetch("/admin/pod-products", { credentials: "include" })
    const data = await res.json()
    setProducts(data.products || [])
    setIsListLoading(false)
  }

  // Fetch all artworks
  const fetchArtworks = async () => {
    const res = await fetch("/admin/artworks", { credentials: "include" })
    const data = await res.json()
    setArtworks(data.artworks || [])
  }

  // Fetch new Printful products (not yet in DB)
  const fetchNewPrintfulProducts = async () => {
    // For demo, just call the backend to get all Printful products and filter out those already in DB
    const res = await fetch("/admin/pod-products", { credentials: "include" })
    const data = await res.json()
    const existingIds = new Set((data.products || []).map((p: any) => p.printful_product_id))
    // Simulate fetching from Printful directly (in real app, backend should expose this)
    const pfRes = await fetch("/api/printful/catalog-products", { credentials: "include" })
    const pfData = await pfRes.json()
    return (pfData.products || []).filter((p: any) => !existingIds.has(p.id))
  }

  // Sync with Printful
  const syncNow = async () => {
    setIsSyncing(true)
    await fetchArtworks()
    const newPfProducts = await fetchNewPrintfulProducts()
    setNewProducts(newPfProducts)
    setShowArtworkSelector(true)
    setIsSyncing(false)
  }

  const handleSyncConfirm = async (mappings: { printfulProductId: string, artworkId: string }[]) => {
    setIsSyncing(true)
    setShowArtworkSelector(false)
    await fetch("/admin/pod-products/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ mappings }),
    })
    await fetchProducts()
    setIsSyncing(false)
  }

  useEffect(() => { fetchProducts() }, [])

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>Printful Products</h2>
        <Button onClick={syncNow} isLoading={isSyncing}>Sync Now</Button>
      </div>
      <Table>
        <thead>
          <tr>
            <th>Thumbnail</th>
            <th>Name</th>
            <th>Artwork</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map(prod => (
            <tr key={prod.id}>
              <td><img src={prod.thumbnail_url} width={48} height={48} alt="thumbnail" /></td>
              <td>{prod.name}</td>
              <td>{prod.artwork_title || "Not linked"}</td>
              <td>
                <Button onClick={() => setSelected(prod)}>Edit</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      {selected && (
        <PodProductEditModal
          product={selected}
          onClose={() => setSelected(null)}
          onSave={fetchProducts}
        />
      )}
      {showArtworkSelector && (
        <ArtworkSelectorModal
          products={newProducts}
          artworks={artworks}
          onConfirm={handleSyncConfirm}
          onClose={() => setShowArtworkSelector(false)}
        />
      )}
    </div>
  )
}

export default PodProductsList

// Add route config for menu integration
export const config = defineRouteConfig({
  label: "Printful Products",
  icon: CloudArrowDown,
}) 