export async function uploadImage(file: File): Promise<string> {
  // For now, we'll use FormData to upload to Medusa's file upload endpoint
  const formData = new FormData()
  formData.append("files", file)

  try {
    const response = await fetch("/admin/uploads", {
      method: "POST",
      credentials: "include",
      body: formData,
    })

    if (!response.ok) {
      throw new Error("Failed to upload image")
    }

    const data = await response.json()
    
    // The uploads endpoint returns an array of uploaded files
    if (data.files && data.files.length > 0) {
      return data.files[0].url
    }
    
    throw new Error("No file URL returned from upload")
  } catch (error) {
    console.error("Error uploading image:", error)
    throw error
  }
} 