import { useEffect, useState } from "react"
import { Select } from "@medusajs/ui"

interface Artwork {
  id: string
  title: string
}

interface ArtworkSelectorProps {
  artworkId: string
  onArtworkSelected: (artworkId: string) => void
}

const ArtworkSelector: React.FC<ArtworkSelectorProps> = ({
  artworkId,
  onArtworkSelected,
}) => {
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchArtworks = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/admin/artworks")
        const data = await response.json()
        setArtworks(data.artworks)
      } catch (error) {
        console.error("Error fetching artworks:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchArtworks()
  }, [])

  if (isLoading) {
    return <div>Loading artworks...</div>
  }

  return (
    <Select
      value={artworkId}
      onValueChange={onArtworkSelected}
    >
      <Select.Trigger>
        <Select.Value placeholder="Select an artwork" />
      </Select.Trigger>
      <Select.Content>
        {artworks.map((artwork) => (
          <Select.Item key={artwork.id} value={artwork.id}>
            {artwork.title}
          </Select.Item>
        ))}
      </Select.Content>
    </Select>
  )
}

export default ArtworkSelector
