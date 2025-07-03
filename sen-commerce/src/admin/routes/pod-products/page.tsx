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

// Main POD products list page
const PodProductsList = () => {
  const [products, setProducts] = useState<any[]>([])
  const [selected, setSelected] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch all POD products
  const fetchProducts = async () => {
    setIsLoading(true)
    const res = await fetch("/admin/pod-products", { credentials: "include" })
    const data = await res.json()
    setProducts(data.products || [])
    setIsLoading(false)
  }

  // Sync with Printful
  const syncNow = async () => {
    setIsLoading(true)
    await fetch("/admin/pod-products/sync", { method: "POST", credentials: "include" })
    await fetchProducts()
  }

  useEffect(() => { fetchProducts() }, [])

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>POD Products</h2>
        <Button onClick={syncNow} isLoading={isLoading}>Sync Now</Button>
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
    </div>
  )
}

export default PodProductsList

// Add route config for menu integration
export const config = defineRouteConfig({
  label: "POD Products",
  icon: CloudArrowDown,
}) 