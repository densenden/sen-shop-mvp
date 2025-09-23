import { useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Badge, Button, Checkbox, Container, Heading, Switch, Table, Tabs } from "@medusajs/ui"
import { AlertCircle, Activity, BookOpen, Database, GitBranch, Layers, RefreshCw, Settings as SettingsIcon } from "lucide-react"
import { marked } from "marked"
import studioGuide from "../../../../docs/PRINTFUL_STUDIO.md?raw"
import studioAddendum from "../../../../docs/Studio_ADDENDUM.md?raw"

marked.use({
  gfm: true,
  breaks: false,
  mangle: false,
  headerIds: false,
})

type StudioVersion = "v1" | "v2"
type StudioSection = "dashboard" | "catalog" | "artworks" | "importer" | "settings" | "guide"
type EndpointKey = "dashboard" | "catalog" | "artworks" | "settings"

type StudioHealthStatus = {
  status: "ok" | "warning" | "error"
  message?: string
  timestamp: string
  version: StudioVersion
}

type StudioDashboard = {
  version: StudioVersion
  fetched_at: string
  health: StudioHealthStatus
  capabilities: string[]
  metrics: {
    version: StudioVersion
    total_products: number
    linked_products: number
    total_variants: number
    artworks: number
    artworks_without_products: number
  }
}

type StudioCatalogVariant = {
  id: string
  name: string
  price?: number
  currency?: string
  size?: string
  color?: string
  availability?: string
  image?: string
}

type StudioArtworkLink = {
  artwork_id: string
  artwork_title: string
  artwork_image?: string | null
  product_id: string
  product_type: string
  is_primary?: boolean
  source: "relation" | "legacy"
  api_version?: StudioVersion | "unknown"
}

type StudioCatalogProduct = {
  id: string
  external_id?: string | null
  version: StudioVersion
  source: "catalog" | "store"
  provider: string
  name: string
  description?: string | null
  thumbnail_url?: string | null
  variant_count: number
  variants: StudioCatalogVariant[]
  linked_artworks: StudioArtworkLink[]
  last_synced_at?: string | null
}

type StudioArtwork = {
  id: string
  title: string
  description?: string | null
  image_url?: string | null
  collection_id?: string | null
  linked_products: StudioArtworkLink[]
}

type StudioSettings = {
  version: StudioVersion
  has_api_token: boolean
  environment: string
  store_id?: string | null
  region?: string | null
  currency?: string | null
  capabilities: string[]
  health: StudioHealthStatus
}

interface QueryState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

type ImportFeedback = {
  status: "success" | "error"
  message: string
  details?: any
} | null

const endpointMap: Record<EndpointKey, string> = {
  dashboard: "dashboard",
  catalog: "catalog",
  artworks: "artworks",
  settings: "settings",
}

function usePrintfulStudioQuery<T>(
  version: StudioVersion,
  key: EndpointKey,
  enabled: boolean,
  deps: unknown[]
): QueryState<T> {
  const [state, setState] = useState<QueryState<T>>({
    data: null,
    loading: enabled,
    error: null,
  })

  useEffect(() => {
    const controller = new AbortController()

    if (!enabled) {
      setState((prev) => ({ ...prev, loading: false }))
      return () => controller.abort()
    }

    setState((prev) => ({ ...prev, loading: true, error: null }))

    const fetchData = async () => {
      try {
        const response = await fetch(`/admin/printful-studio/${version}/${endpointMap[key]}`, {
          method: "GET",
          credentials: "include",
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`${response.status} ${response.statusText}`)
        }

        const json = await response.json()
        let payload: any = json

        if (key === "catalog") {
          payload = json.catalog
        }

        if (key === "artworks") {
          payload = json.artworks
        }

        setState({
          data: payload as T,
          loading: false,
          error: null,
        })
      } catch (error: any) {
        if (error?.name === "AbortError") {
          return
        }
        setState({ data: null, loading: false, error: error?.message ?? "Request failed" })
      }
    }

    fetchData()

    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, key, enabled, ...deps])

  return state
}

const markdownGuideHtml = marked.parse(studioGuide)
const markdownAddendumHtml = marked.parse(studioAddendum)

const VERSION_OPTIONS: { value: StudioVersion; label: string; description: string }[] = [
  {
    value: "v2",
    label: "Printful Studio v2 (beta)",
    description: "Full catalog explorer with beta APIs",
  },
  {
    value: "v1",
    label: "Printful v1 (stable)",
    description: "Legacy sync & template workflow",
  },
]

const SECTION_OPTIONS: { key: StudioSection; label: string; icon: ReactNode; helper?: string }[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: <Activity className="w-4 h-4" />,
  },
  {
    key: "catalog",
    label: "Catalog",
    icon: <Layers className="w-4 h-4" />,
    helper: "Browse Printful catalog data",
  },
  {
    key: "artworks",
    label: "Artworks",
    icon: <GitBranch className="w-4 h-4" />,
  },
  {
    key: "importer",
    label: "Importer",
    icon: <Database className="w-4 h-4" />,
  },
  {
    key: "settings",
    label: "Settings",
    icon: <SettingsIcon className="w-4 h-4" />,
  },
  {
    key: "guide",
    label: "Guide",
    icon: <BookOpen className="w-4 h-4" />,
  },
]

const MarkdownStyles = () => (
  <style>
    {`
      .printful-studio-markdown {
        color: var(--fg-base, #111827);
        line-height: 1.65;
      }
      .printful-studio-markdown h1,
      .printful-studio-markdown h2,
      .printful-studio-markdown h3,
      .printful-studio-markdown h4 {
        margin-top: 2rem;
      }
      .printful-studio-markdown h1:first-child {
        margin-top: 0;
      }
      .printful-studio-markdown p,
      .printful-studio-markdown ul,
      .printful-studio-markdown ol {
        margin-top: 0.75rem;
        margin-bottom: 0.75rem;
      }
      .printful-studio-markdown ul,
      .printful-studio-markdown ol {
        padding-left: 1.75rem;
      }
      .printful-studio-markdown code {
        background-color: rgba(15, 23, 42, 0.08);
        border-radius: 4px;
        padding: 0.15rem 0.35rem;
        font-family: ui-monospace, SFMono-Regular, SFMono, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        font-size: 0.9em;
      }
      .printful-studio-markdown pre {
        background-color: rgba(15, 23, 42, 0.85);
        color: #f8fafc;
        padding: 1rem;
        border-radius: 6px;
        overflow-x: auto;
      }
      .printful-studio-markdown hr {
        border: 0;
        border-top: 1px solid rgba(148, 163, 184, 0.4);
        margin: 2rem 0;
      }
      .printful-studio-markdown table {
        width: 100%;
        border-collapse: collapse;
        margin: 1.5rem 0;
      }
      .printful-studio-markdown th,
      .printful-studio-markdown td {
        border: 1px solid rgba(148, 163, 184, 0.6);
        padding: 0.75rem;
        text-align: left;
      }
      .printful-studio-markdown thead {
        background-color: rgba(226, 232, 240, 0.5);
        font-weight: 600;
      }
      .printful-studio-markdown blockquote {
        border-left: 4px solid rgba(148, 163, 184, 0.8);
        padding-left: 1rem;
        color: rgba(15, 23, 42, 0.8);
        background-color: rgba(226, 232, 240, 0.3);
        border-radius: 4px;
      }
      .printful-studio-markdown a {
        color: #2563eb;
      }
    `}
  </style>
)

const ErrorBanner = ({ message }: { message: string }) => (
  <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
    <AlertCircle className="h-4 w-4" />
    <span>{message}</span>
  </div>
)

const MetricCard = ({
  label,
  value,
  helper,
}: {
  label: string
  value: number | string
  helper?: string
}) => (
  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
    <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
    <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
    {helper && <p className="mt-1 text-xs text-gray-500">{helper}</p>}
  </div>
)

const CatalogTable = ({
  data,
  loading,
  version,
  emptyHelper,
}: {
  data: StudioCatalogProduct[] | null
  loading: boolean
  version: StudioVersion
  emptyHelper: string
}) => {
  if (loading) {
    return <div className="rounded-md border border-gray-200 p-6 text-sm text-gray-600">Loading catalog…</div>
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-gray-200 p-6 text-sm text-gray-600">
        No catalog entries yet for {version.toUpperCase()}.
        <br />
        <span className="text-xs text-gray-500">{emptyHelper}</span>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <Table>
        <Table.Header>
          <Table.Row className="bg-gray-50">
            <Table.HeaderCell>Product</Table.HeaderCell>
            <Table.HeaderCell className="w-32">Variants</Table.HeaderCell>
            <Table.HeaderCell className="w-40">Linked Artworks</Table.HeaderCell>
            <Table.HeaderCell className="w-32">Source</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {data.map((product) => (
            <Table.Row key={`${version}-${product.id}`}>
              <Table.Cell>
                <div className="flex items-start gap-3">
                  {product.thumbnail_url ? (
                    <img
                      src={product.thumbnail_url}
                      alt={product.name}
                      className="h-14 w-14 rounded object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded bg-gray-100 text-xs text-gray-400">
                      No Image
                    </div>
                  )}
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-gray-900">{product.name}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <Badge className="bg-blue-100 text-blue-800">{product.version.toUpperCase()}</Badge>
                      <Badge className="bg-gray-100 text-gray-700">ID: {product.id}</Badge>
                      {product.description && (
                        <span className="max-w-[280px] truncate">{product.description}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Table.Cell>
              <Table.Cell>
                <div className="flex flex-col text-sm text-gray-700">
                  <span className="font-medium">{product.variant_count}</span>
                  {product.variants.slice(0, 2).map((variant) => (
                    <span key={variant.id} className="truncate text-xs text-gray-500">
                      {variant.name}
                    </span>
                  ))}
                  {product.variant_count > 2 && (
                    <span className="text-xs text-gray-400">+{product.variant_count - 2} more</span>
                  )}
                </div>
              </Table.Cell>
              <Table.Cell>
                <div className="space-y-1">
                  {product.linked_artworks.length === 0 && (
                    <span className="flex items-center gap-1 text-xs text-red-500">
                      <AlertCircle className="h-3 w-3" />
                      None linked
                    </span>
                  )}
                  {product.linked_artworks.slice(0, 3).map((link) => (
                    <div key={`${product.id}-${link.artwork_id}`} className="flex items-center justify-between text-xs">
                      <span className="truncate text-gray-700">{link.artwork_title}</span>
                      <Badge className="ml-2 bg-gray-100 text-gray-600">{link.source}</Badge>
                    </div>
                  ))}
                  {product.linked_artworks.length > 3 && (
                    <span className="text-xs text-gray-400">+{product.linked_artworks.length - 3} more</span>
                  )}
                </div>
              </Table.Cell>
              <Table.Cell>
                <Badge className="bg-purple-100 text-purple-800 capitalize">{product.source}</Badge>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </div>
  )
}

const ArtworksPanel = ({ data, loading, error }: { data: StudioArtwork[] | null; loading: boolean; error: string | null }) => {
  if (loading) {
    return <div className="rounded-md border border-gray-200 p-6 text-sm text-gray-600">Loading artworks…</div>
  }

  if (error) {
    return <ErrorBanner message={error} />
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-gray-200 p-6 text-sm text-gray-600">
        No artworks found. Create an artwork in the Artworks module to start mapping Printful assets.
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {data.map((artwork) => (
        <div key={artwork.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            {artwork.image_url ? (
              <img src={artwork.image_url} alt={artwork.title} className="h-16 w-16 rounded object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded bg-gray-100 text-xs text-gray-400">
                No Image
              </div>
            )}
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-900">{artwork.title}</p>
              <Badge className="bg-gray-100 text-gray-600">{artwork.linked_products.length} product links</Badge>
            </div>
          </div>
          {artwork.linked_products.length > 0 ? (
            <div className="mt-4 space-y-1 text-xs text-gray-600">
              {artwork.linked_products.slice(0, 4).map((link) => (
                <div key={`${artwork.id}-${link.product_id}`} className="flex items-center justify-between">
                  <span className="truncate font-mono text-[11px] text-gray-500">{link.product_id}</span>
                  <Badge className="ml-2 bg-blue-100 text-blue-800">{link.api_version?.toString().toUpperCase() ?? "POD"}</Badge>
                </div>
              ))}
              {artwork.linked_products.length > 4 && (
                <span className="text-[11px] text-gray-400">+{artwork.linked_products.length - 4} additional relations</span>
              )}
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-2 text-xs text-red-500">
              <AlertCircle className="h-3 w-3" />
              Not linked to any Printful product yet.
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

const SettingsPanel = ({ data, loading, error }: { data: StudioSettings | null; loading: boolean; error: string | null }) => {
  if (loading) {
    return <div className="rounded-md border border-gray-200 p-6 text-sm text-gray-600">Loading settings…</div>
  }

  if (error) {
    return <ErrorBanner message={error} />
  }

  if (!data) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <Heading level="h3" className="text-base font-semibold text-gray-900">
          API Credentials & Health
        </Heading>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-2 text-sm text-gray-600">
            <p className="flex items-center gap-2 text-gray-700">
              Environment
              <Badge className="bg-gray-100 text-gray-700">{data.environment}</Badge>
            </p>
            <p className="flex items-center gap-2">
              Store ID
              <Badge className="bg-blue-100 text-blue-800">{data.store_id ?? "not set"}</Badge>
            </p>
            <p className="flex items-center gap-2">
              Region
              <Badge className="bg-gray-100 text-gray-700">{data.region ?? "default"}</Badge>
            </p>
            <p className="flex items-center gap-2">
              Currency
              <Badge className="bg-gray-100 text-gray-700">{data.currency ?? "default"}</Badge>
            </p>
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            <p className="flex items-center gap-2">
              API Token
              <Badge className={data.has_api_token ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"}>
                {data.has_api_token ? "configured" : "missing"}
              </Badge>
            </p>
            <div className="flex items-center gap-2">
              <span className="text-gray-700">Health</span>
              <Badge
                className={
                  data.health.status === "ok"
                    ? "bg-green-100 text-green-800"
                    : data.health.status === "warning"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-700"
                }
              >
                {data.health.status.toUpperCase()}
              </Badge>
            </div>
            {data.health.message && <p className="text-xs text-gray-500">{data.health.message}</p>}
            <p className="text-xs text-gray-400">Last checked: {new Date(data.health.timestamp).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <Heading level="h3" className="text-base font-semibold text-gray-900">
          Capabilities
        </Heading>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-600">
          {data.capabilities.map((capability) => (
            <li key={capability}>{capability}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

const GuidePanel = () => {
  const combinedHtml = useMemo(
    () => `${markdownGuideHtml}\n<hr/>${markdownAddendumHtml}`,
    []
  )

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <MarkdownStyles />
      <div className="printful-studio-markdown" dangerouslySetInnerHTML={{ __html: combinedHtml }} />
    </div>
  )
}

const ImporterPanel = ({
  version,
  data,
  loading,
  error,
  selection,
  onToggle,
  onToggleAll,
  onImportSelected,
  onImportSingle,
  importing,
  feedback,
  details,
}: {
  version: StudioVersion
  data: StudioCatalogProduct[] | null
  loading: boolean
  error: string | null
  selection: Set<string>
  onToggle: (id: string) => void
  onToggleAll: () => void
  onImportSelected: () => void
  onImportSingle: (id: string) => void
  importing: boolean
  feedback: ImportFeedback
  details: {
    imported: any[]
    errors: any[]
    skipped: any[]
  } | null
}) => {
  if (version === "v2") {
    return (
      <div className="rounded-lg border border-dashed border-blue-200 bg-white p-6 text-sm text-blue-800">
        <Heading level="h3" className="text-base font-semibold text-blue-900">
          Import from v2 (beta)
        </Heading>
        <p className="mt-3">
          Printful v2 exposes the global catalog. Importing directly from catalog products requires generating new store
          items first. Use the v1 tab to pull existing store products, or convert catalog entries to store templates in
          Printful before importing.
        </p>
      </div>
    )
  }

  if (loading) {
    return <div className="rounded-md border border-gray-200 p-6 text-sm text-gray-600">Loading importer data…</div>
  }

  if (error) {
    return <ErrorBanner message={error} />
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-white p-6 text-sm text-gray-600">
        No Printful templates found. Create products in Printful Studio (v1) first, then return here to import them into
        Medusa.
      </div>
    )
  }

  const selectionCount = selection.size
  const allIds = data.map((product) => product.id)
  const allSelected = allIds.length > 0 && allIds.every((id) => selection.has(id))

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Heading level="h2" className="text-xl font-semibold text-gray-900">
            Import Printful templates
          </Heading>
          <p className="text-sm text-gray-600">
            Select one or more Printful store products and import them into Medusa with all variant media. The importer
            writes metadata <code className="rounded bg-gray-100 px-1">printful_api_version=v1</code> to flag the
            origin.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-600">
            Selected <span className="font-medium text-gray-900">{selectionCount}</span>
          </div>
          <Button
            variant="primary"
            size="small"
            disabled={selectionCount === 0 || importing}
            onClick={onImportSelected}
            className="flex items-center gap-2"
          >
            {importing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Import selected
          </Button>
        </div>
      </div>

      {feedback && (
        <div
          className={`rounded-md border px-3 py-2 text-sm ${
            feedback.status === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {feedback.message}
        </div>
      )}

      {details?.imported?.length ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-900">
          <Heading level="h3" className="text-sm font-semibold text-green-900">
            Imported products
          </Heading>
          <ul className="mt-2 space-y-1">
            {details.imported.map((item: any) => (
              <li key={item.medusaProductId || item.medusa_product_id || item.productId} className="flex items-center justify-between">
                <span className="truncate">
                  {item.medusaProduct?.title || item.medusa_product_title || item.productId}
                </span>
                {item.medusaProductId || item.medusa_product_id ? (
                  <Button
                    size="small"
                    variant="secondary"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        window.open(`/products/${item.medusaProductId || item.medusa_product_id}/edit`, "_blank")
                      }
                    }}
                  >
                    Edit in Medusa
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {details?.skipped?.length ? (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
          <Heading level="h3" className="text-sm font-semibold text-yellow-900">
            Skipped templates
          </Heading>
          <ul className="mt-2 space-y-1">
            {details.skipped.map((item: any) => (
              <li key={`${item.productId}-skipped`}>
                {item.productId} – {item.reason === "already_imported" ? "Already imported" : "Missing price"}
                {item.medusa_product_id ? ` (Medusa product ${item.medusa_product_id})` : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {details?.errors?.length ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <Heading level="h3" className="text-sm font-semibold text-red-900">
            Errors
          </Heading>
          <ul className="mt-2 space-y-1">
            {details.errors.map((item: any) => (
              <li key={`${item.productId}-error`}>
                {item.productId}: {item.error}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-gray-200">
        <Table>
          <Table.Header>
            <Table.Row className="bg-gray-50">
              <Table.HeaderCell className="w-10">
                <Checkbox checked={allSelected} onCheckedChange={() => onToggleAll()} disabled={importing} />
              </Table.HeaderCell>
              <Table.HeaderCell>Template</Table.HeaderCell>
              <Table.HeaderCell className="w-32">Variants</Table.HeaderCell>
              <Table.HeaderCell className="w-32">Artworks</Table.HeaderCell>
              <Table.HeaderCell className="w-32 text-right">Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {data.map((product) => {
              const isSelected = selection.has(product.id)
              const wasJustImported = Boolean(details?.imported?.some((item: any) => (item.productId || item.printful_product_id) === product.id))
              return (
                <Table.Row key={product.id} className={isSelected ? "bg-blue-50" : wasJustImported ? "bg-green-50" : undefined}>
                  <Table.Cell>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onToggle(product.id)}
                      disabled={importing}
                    />
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex items-start gap-3">
                      {product.thumbnail_url ? (
                        <img src={product.thumbnail_url} alt={product.name} className="h-12 w-12 rounded object-cover" />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded bg-gray-100 text-xs text-gray-400">
                          No image
                        </div>
                      )}
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-gray-900">{product.name}</p>
                        {product.description && (
                          <p className="text-xs text-gray-500 line-clamp-2">{product.description}</p>
                        )}
                        <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                          <Badge className="bg-gray-100 text-gray-700">ID: {product.id}</Badge>
                          <Badge className="bg-blue-100 text-blue-800">Source: {product.source}</Badge>
                          {wasJustImported && <Badge className="bg-green-100 text-green-800">Imported</Badge>}
                        </div>
                      </div>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="space-y-1 text-xs text-gray-600">
                      <span className="text-sm font-medium text-gray-900">{product.variant_count}</span>
                      {product.variants.slice(0, 2).map((variant) => (
                        <span key={`${product.id}-${variant.id}`} className="block truncate">
                          {variant.name}
                        </span>
                      ))}
                      {product.variant_count > 2 && (
                        <span className="text-[11px] text-gray-400">+{product.variant_count - 2} more</span>
                      )}
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    {product.linked_artworks.length > 0 ? (
                      <div className="space-y-1 text-xs text-gray-600">
                        {product.linked_artworks.slice(0, 2).map((link) => (
                          <div key={`${product.id}-${link.artwork_id}`} className="flex items-center justify-between">
                            <span className="truncate text-gray-700">{link.artwork_title}</span>
                            <Badge className="bg-gray-100 text-gray-600">{link.api_version?.toUpperCase() || "POD"}</Badge>
                          </div>
                        ))}
                        {product.linked_artworks.length > 2 && (
                          <span className="text-[11px] text-gray-400">+{product.linked_artworks.length - 2} more</span>
                        )}
                      </div>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-red-500">
                        <AlertCircle className="h-3 w-3" /> Not linked
                      </span>
                    )}
                  </Table.Cell>
                  <Table.Cell className="text-right">
                    <Button
                      size="small"
                      variant="secondary"
                      onClick={() => onImportSingle(product.id)}
                      disabled={importing}
                    >
                      Import
                    </Button>
                  </Table.Cell>
                </Table.Row>
              )
            })}
          </Table.Body>
        </Table>
      </div>
    </div>
  )
}

const DashboardPanel = ({ data, loading, error }: { data: StudioDashboard | null; loading: boolean; error: string | null }) => {
  if (loading) {
    return <div className="rounded-md border border-gray-200 p-6 text-sm text-gray-600">Loading dashboard…</div>
  }

  if (error) {
    return <ErrorBanner message={error} />
  }

  if (!data) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Catalog products" value={data.metrics.total_products} helper="Across selected Printful version" />
        <MetricCard label="Variants" value={data.metrics.total_variants} helper="Sum of enabled variants" />
        <MetricCard label="Linked artworks" value={data.metrics.linked_products} helper="Products mapped to artworks" />
        <MetricCard label="Unlinked artworks" value={data.metrics.artworks_without_products} helper="Artworks missing Printful mapping" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <Heading level="h3" className="text-base font-semibold text-gray-900">
            Health & Status
          </Heading>
          <div className="mt-4 flex items-center gap-2">
            <Badge
              className={
                data.health.status === "ok"
                  ? "bg-green-100 text-green-800"
                  : data.health.status === "warning"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-700"
              }
            >
              {data.health.status.toUpperCase()}
            </Badge>
            {data.health.message && <span className="text-sm text-gray-600">{data.health.message}</span>}
          </div>
          <p className="mt-2 text-xs text-gray-400">Last updated {new Date(data.fetched_at).toLocaleString()}</p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <Heading level="h3" className="text-base font-semibold text-gray-900">
            Capabilities
          </Heading>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-600">
            {data.capabilities.map((capability) => (
              <li key={capability}>{capability}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

const PrintfulStudioPage = () => {
  const [activeVersion, setActiveVersion] = useState<StudioVersion>("v2")
  const [activeSection, setActiveSection] = useState<StudioSection>("dashboard")
  const [compareMode, setCompareMode] = useState(false)
  const [refreshCounters, setRefreshCounters] = useState({
    dashboard: 0,
    catalog: 0,
    artworks: 0,
    settings: 0,
  })
  const [importSelection, setImportSelection] = useState<Set<string>>(new Set())
  const [importing, setImporting] = useState(false)
  const [importFeedback, setImportFeedback] = useState<ImportFeedback>(null)
  const [importDetails, setImportDetails] = useState<{
    imported: any[]
    errors: any[]
    skipped: any[]
  } | null>(null)

  const otherVersion: StudioVersion = activeVersion === "v2" ? "v1" : "v2"

  const dashboardQuery = usePrintfulStudioQuery<StudioDashboard>(activeVersion, "dashboard", true, [
    refreshCounters.dashboard,
    activeVersion,
  ])

  const shouldFetchCatalog = activeSection === "catalog" || compareMode || activeSection === "importer"

  const catalogQuery = usePrintfulStudioQuery<StudioCatalogProduct[]>(
    activeVersion,
    "catalog",
    shouldFetchCatalog,
    [refreshCounters.catalog, activeVersion]
  )

  const compareCatalogQuery = usePrintfulStudioQuery<StudioCatalogProduct[]>(
    otherVersion,
    "catalog",
    compareMode,
    [refreshCounters.catalog, activeVersion]
  )

  const artworksQuery = usePrintfulStudioQuery<StudioArtwork[]>(
    activeVersion,
    "artworks",
    activeSection === "artworks",
    [refreshCounters.artworks, activeVersion]
  )

  const settingsQuery = usePrintfulStudioQuery<StudioSettings>(
    activeVersion,
    "settings",
    activeSection === "settings",
    [refreshCounters.settings, activeVersion]
  )

  const triggerRefresh = (key: EndpointKey) => {
    setRefreshCounters((prev) => ({ ...prev, [key]: prev[key] + 1 }))
  }

  useEffect(() => {
    if (activeSection !== "catalog") {
      setCompareMode(false)
    }
  }, [activeSection])

  useEffect(() => {
    setImportSelection(new Set())
    setImportFeedback(null)
    setImportDetails(null)
  }, [activeVersion])

  const toggleProductSelection = (productId: string) => {
    setImportSelection((prev) => {
      const next = new Set(prev)
      if (next.has(productId)) {
        next.delete(productId)
      } else {
        next.add(productId)
      }
      return next
    })
  }

  const toggleSelectAll = (products: StudioCatalogProduct[] | null | undefined) => {
    if (!products || products.length === 0) {
      return
    }

    const currentIds = new Set(importSelection)
    const allIds = products.map((product) => product.id)
    const allSelected = allIds.every((id) => currentIds.has(id))

    if (allSelected) {
      setImportSelection(new Set())
    } else {
      setImportSelection(new Set(allIds))
    }
  }

  const handleImport = async (productIds: string[]) => {
    if (!productIds.length) {
      return
    }

    setImporting(true)
    setImportFeedback(null)

    try {
      const response = await fetch(`/admin/printful-studio/${activeVersion}/importer`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider: "printful",
          product_ids: productIds,
        }),
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || `Import failed with status ${response.status}`)
      }

      const result = await response.json()
      setImportDetails({
        imported: result.imported_products || [],
        errors: result.errors || [],
        skipped: result.skipped || [],
      })
      setImportFeedback({
        status: result.failed > 0 ? "error" : "success",
        message: `Imported ${result.imported || 0} product(s).${
          result.skipped_count ? ` Skipped ${result.skipped_count}.` : ""
        }${result.failed ? ` Failed ${result.failed}.` : ""}`.trim(),
        details: result,
      })

      setImportSelection(new Set())
      // refresh product data to sync metadata views
      triggerRefresh("catalog")
      triggerRefresh("dashboard")
    } catch (error: any) {
      setImportFeedback({
        status: "error",
        message: error?.message || "Import failed",
      })
      setImportDetails(null)
    } finally {
      setImporting(false)
    }
  }

  return (
    <Container className="space-y-8">
      <div className="space-y-3">
        <Heading level="h1">Printful Studio Control Center</Heading>
        <p className="text-sm text-gray-600">
          Operate Printful Studio v1 and v2 side-by-side. Switch versions to browse catalog data, map artworks, and
          prepare importer payloads.
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <Tabs value={activeVersion} onValueChange={(value) => setActiveVersion(value as StudioVersion)}>
          <Tabs.List className="grid w-full grid-cols-2">
            {VERSION_OPTIONS.map((option) => (
              <Tabs.Trigger key={option.value} value={option.value} className="flex flex-col gap-1 p-3 text-left">
                <span className="text-sm font-semibold">{option.label}</span>
                <span className="text-xs text-gray-500">{option.description}</span>
              </Tabs.Trigger>
            ))}
          </Tabs.List>
        </Tabs>
      </div>

      <div className="flex flex-wrap gap-2">
        {SECTION_OPTIONS.map((section) => (
          <button
            key={section.key}
            onClick={() => setActiveSection(section.key)}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
              activeSection === section.key
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-gray-200 bg-white text-gray-600 hover:border-blue-200 hover:text-blue-600"
            }`}
            type="button"
          >
            {section.icon}
            {section.label}
          </button>
        ))}
      </div>

      {activeSection === "dashboard" && (
        <DashboardPanel
          data={dashboardQuery.data}
          loading={dashboardQuery.loading}
          error={dashboardQuery.error}
        />
      )}

      {activeSection === "catalog" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Heading level="h2" className="text-xl font-semibold text-gray-900">
                Catalog Overview — {activeVersion.toUpperCase()}
              </Heading>
              <p className="text-sm text-gray-600">
                Pulls live data from Printful {activeVersion.toUpperCase()} endpoints. Use compare mode to view both
                stacks at once.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Switch id="compare-mode" checked={compareMode} onCheckedChange={setCompareMode} />
                <label htmlFor="compare-mode">Compare v1 vs v2</label>
              </div>
              <Button
                variant="secondary"
                size="small"
                className="flex items-center gap-2"
                onClick={() => triggerRefresh("catalog")}
                disabled={catalogQuery.loading || (compareMode && compareCatalogQuery.loading)}
              >
                <RefreshCw className="h-4 w-4" /> Refresh
              </Button>
            </div>
          </div>

          {catalogQuery.error && <ErrorBanner message={catalogQuery.error} />}
          {compareMode && compareCatalogQuery.error && <ErrorBanner message={`Compare data: ${compareCatalogQuery.error}`} />}

          {compareMode ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-3">
                <Heading level="h3" className="text-base font-semibold text-gray-900">
                  {activeVersion.toUpperCase()} Catalog
                </Heading>
                <CatalogTable
                  data={catalogQuery.data}
                  loading={catalogQuery.loading}
                  version={activeVersion}
                  emptyHelper="Trigger a sync from Printful Studio to populate catalog entries."
                />
              </div>
              <div className="space-y-3">
                <Heading level="h3" className="text-base font-semibold text-gray-900">
                  {otherVersion.toUpperCase()} Catalog
                </Heading>
                <CatalogTable
                  data={compareCatalogQuery.data}
                  loading={compareCatalogQuery.loading}
                  version={otherVersion}
                  emptyHelper="Enable compare mode after at least one catalog sync for this version."
                />
              </div>
            </div>
          ) : (
            <CatalogTable
              data={catalogQuery.data}
              loading={catalogQuery.loading}
              version={activeVersion}
              emptyHelper="Trigger a sync from Printful Studio to populate catalog entries."
            />
          )}
        </div>
      )}

      {activeSection === "artworks" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Heading level="h2" className="text-xl font-semibold text-gray-900">
                Artwork linkage — {activeVersion.toUpperCase()}
              </Heading>
              <p className="text-sm text-gray-600">
                Every product in SenCommerce must resolve to an artwork. Use this overview to identify gaps before
                running importer tasks.
              </p>
            </div>
            <Button
              variant="secondary"
              size="small"
              className="flex items-center gap-2"
              onClick={() => triggerRefresh("artworks")}
              disabled={artworksQuery.loading}
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
          </div>
          <ArtworksPanel data={artworksQuery.data} loading={artworksQuery.loading} error={artworksQuery.error} />
        </div>
      )}

      {activeSection === "importer" && (
        <ImporterPanel
          version={activeVersion}
          data={catalogQuery.data}
          loading={catalogQuery.loading}
          error={catalogQuery.error}
          selection={importSelection}
          onToggle={toggleProductSelection}
          onToggleAll={() => toggleSelectAll(catalogQuery.data)}
          onImportSelected={() => handleImport(Array.from(importSelection))}
          onImportSingle={(id) => handleImport([id])}
          importing={importing}
          feedback={importFeedback}
          details={importDetails}
        />
      )}

      {activeSection === "settings" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Heading level="h2" className="text-xl font-semibold text-gray-900">
                Settings — {activeVersion.toUpperCase()}
              </Heading>
              <p className="text-sm text-gray-600">
                Verify credentials, region defaults, and health checks per version.
              </p>
            </div>
            <Button
              variant="secondary"
              size="small"
              className="flex items-center gap-2"
              onClick={() => triggerRefresh("settings")}
              disabled={settingsQuery.loading}
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
          </div>
          <SettingsPanel data={settingsQuery.data} loading={settingsQuery.loading} error={settingsQuery.error} />
        </div>
      )}

      {activeSection === "guide" && <GuidePanel />}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Printful Studio",
  icon: BookOpen,
})

export default PrintfulStudioPage
