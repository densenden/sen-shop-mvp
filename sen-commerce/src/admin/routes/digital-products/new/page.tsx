import { useState } from "react"
import { Button, Container, Heading, Input, Label, Text } from "@medusajs/ui"
import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "@medusajs/icons"

const NewDigitalProductPage = () => {
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024 // 50MB in bytes
    if (file.size > maxSize) {
      alert(`File too large! Maximum size is 50MB. Your file is ${(file.size / (1024 * 1024)).toFixed(1)}MB`)
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append("name", name)
    formData.append("description", description)
    formData.append("file", file)

    try {
      // Use XMLHttpRequest to track upload progress
      const xhr = new XMLHttpRequest()
      
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          setUploadProgress(progress)
        }
      })
      
      xhr.onload = function() {
        if (xhr.status === 200) {
          navigate("/digital-products")
        } else {
          let response
          try {
            response = JSON.parse(xhr.responseText)
          } catch (e) {
            // Not JSON, probably HTML error page
            alert("Upload failed: Server error (" + xhr.status + "). Please check your backend route and try again.")
            setUploading(false)
            return
          }
          alert("Upload failed: " + (response.error || "Unknown error"))
          setUploading(false)
        }
      }
      
      xhr.onerror = function() {
        alert("Upload failed: Network error")
        setUploading(false)
      }
      
      xhr.open("POST", "/admin/digital-products")
      xhr.withCredentials = true
      xhr.send(formData)
    } catch (error) {
      console.error("Error uploading:", error)
      setUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <Container>
      <div className="mb-6">
        <Button
          variant="secondary"
          size="small"
          onClick={() => navigate("/digital-products")}
        >
          <ArrowLeft />
          Back
        </Button>
      </div>

      <Heading className="mb-6">Upload Digital Product</Heading>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
        <div>
          <Label htmlFor="name">Product Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="E.g., High Resolution Print"
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Description (optional)</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the digital product"
          />
        </div>

        <div>
          <Label htmlFor="file">File</Label>
          <input
            id="file"
            type="file"
            onChange={(e) => {
              const selectedFile = e.target.files?.[0] || null
              setFile(selectedFile)
              
              // Show file size warning if needed
              if (selectedFile) {
                const sizeMB = selectedFile.size / (1024 * 1024)
                if (sizeMB > 50) {
                  alert(`⚠️ File too large! ${sizeMB.toFixed(1)}MB exceeds the 50MB limit.`)
                  setFile(null)
                  e.target.value = '' // Clear the input
                }
              }
            }}
            required
            className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer"
          />
          <Text size="small" className="mt-1 text-gray-500">
            Supported: PDF, JPG, PNG, ZIP, MP3, MP4, Excel, Word
          </Text>
          <Text size="small" className="mt-1 text-gray-500 font-semibold">
            Maximum file size: 50MB
          </Text>
          {file && (
            <Text size="small" className="mt-1 text-gray-600">
              Selected: {file.name} ({(file.size / (1024 * 1024)).toFixed(1)}MB)
            </Text>
          )}
        </div>

        <div className="pt-4">
          <Button type="submit" disabled={!file || uploading}>
            {uploading ? `Uploading... ${uploadProgress}%` : "Upload Digital Product"}
          </Button>
          
          {uploading && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <Text size="small" className="mt-1 text-gray-600">
                {uploadProgress < 100 
                  ? `Uploading to Supabase... ${uploadProgress}%`
                  : "Processing file..."}
              </Text>
            </div>
          )}
        </div>
      </form>
    </Container>
  )
}

export default NewDigitalProductPage 