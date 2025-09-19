import { defineRouteConfig } from "@medusajs/admin-sdk";
import { 
  Container, 
  Heading, 
  Text, 
  Button, 
  Input,
  Badge,
  Table,
  IconButton,
} from "@medusajs/ui";
import { Palette, Plus, Eye, ExternalLink, Download, Trash, Settings, RefreshCw, Upload, Search, Filter, Grid, List } from "lucide-react";
import { useState, useEffect } from "react";

const PrintfulStudioPage = () => {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [designs, setDesigns] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [products, setProducts] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [printfulProducts, setPrintfulProducts] = useState([]);
  const [viewMode, setViewMode] = useState("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [selectedItems, setSelectedItems] = useState([]);
  
  // Modal states
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [sessionForm, setSessionForm] = useState({
    artistId: "",
    templateId: "",
    productType: "",
    customization: {}
  });

  // Simple notification system
  const [notification, setNotification] = useState(null);
  
  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Fetch data functions
  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchDesigns(),
        fetchTemplates(), 
        fetchProducts(),
        fetchSessions(),
        fetchPrintfulProducts()
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
      showNotification("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchDesigns = async () => {
    try {
      const response = await fetch("/admin/studio/designs");
      const data = await response.json();
      if (data.success) {
        setDesigns(data.designs || []);
      }
    } catch (error) {
      console.error("Failed to fetch designs:", error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/admin/studio/templates");
      const data = await response.json();
      if (data.success) {
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch("/admin/studio/products");
      const data = await response.json();
      if (data.success) {
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await fetch("/admin/studio/sessions");
      const data = await response.json();
      if (data.success) {
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    }
  };

  const fetchPrintfulProducts = async () => {
    try {
      const response = await fetch("/api/admin/printful/products");
      const data = await response.json();
      if (data.success) {
        setPrintfulProducts(data.products || []);
      }
    } catch (error) {
      console.error("Failed to fetch Printful products:", error);
    }
  };

  // Action functions
  const createStudioSession = async (templateId?: string) => {
    setLoading(true);
    try {
      const response = await fetch("/admin/studio/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artistId: sessionForm.artistId || "artist_123",
          templateId: templateId || sessionForm.templateId,
          productType: sessionForm.productType || "apparel",
          customization: sessionForm.customization
        }),
      });
      
      const data = await response.json();
      if (data.success && data.studioUrl) {
        window.open(data.studioUrl, "_blank", "width=1200,height=800");
        showNotification("Studio session created successfully!");
        setShowCreateSession(false);
        await fetchSessions();
      } else {
        showNotification(data.message || "Failed to create studio session", "error");
      }
    } catch (error) {
      console.error("Create session error:", error);
      showNotification("Failed to create studio session", "error");
    } finally {
      setLoading(false);
    }
  };

  const syncTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch("/admin/studio/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forceSync: true }),
      });
      
      const data = await response.json();
      if (data.success) {
        showNotification(`Synced ${data.count || 0} templates`);
        await fetchTemplates();
      } else {
        showNotification("Failed to sync templates", "error");
      }
    } catch (error) {
      console.error("Sync templates error:", error);
      showNotification("Failed to sync templates", "error");
    } finally {
      setLoading(false);
    }
  };

  const createProductFromDesign = async (designId: string) => {
    setLoading(true);
    try {
      const response = await fetch("/admin/studio/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          designId,
          autoCreateProduct: true,
          title: `Studio Design ${designId.slice(0, 8)}`,
          description: "Product created from Printful Studio design"
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        showNotification("Product created successfully!");
        await fetchProducts();
      } else {
        showNotification(data.message || "Failed to create product", "error");
      }
    } catch (error) {
      console.error("Create product error:", error);
      showNotification("Failed to create product", "error");
    } finally {
      setLoading(false);
    }
  };

  const syncPrintfulProduct = async (productId: string) => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/printful-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      
      const data = await response.json();
      if (data.success) {
        showNotification("Product synced successfully!");
        await fetchProducts();
      } else {
        showNotification(data.message || "Failed to sync product", "error");
      }
    } catch (error) {
      console.error("Sync product error:", error);
      showNotification("Failed to sync product", "error");
    } finally {
      setLoading(false);
    }
  };

  const bulkSyncProducts = async () => {
    if (selectedItems.length === 0) {
      showNotification("Please select products to sync", "error");
      return;
    }

    setLoading(true);
    try {
      const promises = selectedItems.map(id => syncPrintfulProduct(id));
      await Promise.all(promises);
      showNotification(`Synced ${selectedItems.length} products`);
      setSelectedItems([]);
    } catch (error) {
      showNotification("Failed to sync some products", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "success",
      completed: "default", 
      expired: "warning",
      cancelled: "danger",
      draft: "secondary",
      published: "success",
      archived: "default"
    };
    
    return (
      <Badge variant={variants[status] || "default"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredTemplates = templates.filter(template => 
    template.name?.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (filterCategory === "all" || template.category === filterCategory)
  );

  const filteredDesigns = designs.filter(design => 
    design.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProducts = products.filter(product => 
    product.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPrintfulProducts = printfulProducts.filter(product => 
    product.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Dashboard Stats
  const stats = {
    totalDesigns: designs.length,
    activeDesigns: designs.filter(d => d.status === "published").length,
    totalProducts: products.length,
    activeSessions: sessions.filter(s => s.status === "active").length
  };

  return (
    <Container className="p-6 max-w-full">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 p-4 rounded-md ${
          notification.type === "error" 
            ? "bg-red-100 text-red-800 border border-red-200" 
            : "bg-green-100 text-green-800 border border-green-200"
        } z-50`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Heading level="h1" className="flex items-center gap-2">
            <Palette className="w-6 h-6" />
            Printful Studio
          </Heading>
          <Text className="text-gray-600 mt-1">
            Create designs, manage templates, and sync products with Printful Studio
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            onClick={() => setShowCreateSession(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Design
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-1 mb-6 bg-gray-50 p-1 rounded-lg">
        {[
          { id: "dashboard", label: "Dashboard", icon: Grid },
          { id: "designs", label: "Designs", icon: Palette },
          { id: "templates", label: "Templates", icon: List },
          { id: "products", label: "Studio Products", icon: Upload },
          { id: "printful", label: "Printful Catalog", icon: ExternalLink },
          { id: "sessions", label: "Sessions", icon: Settings }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveSection(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeSection === id
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Dashboard Section */}
      {activeSection === "dashboard" && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <Text className="text-sm text-gray-600">Total Designs</Text>
              <Text className="text-2xl font-bold">{stats.totalDesigns}</Text>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <Text className="text-sm text-gray-600">Active Designs</Text>
              <Text className="text-2xl font-bold">{stats.activeDesigns}</Text>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <Text className="text-sm text-gray-600">Studio Products</Text>
              <Text className="text-2xl font-bold">{stats.totalProducts}</Text>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <Text className="text-sm text-gray-600">Active Sessions</Text>
              <Text className="text-2xl font-bold">{stats.activeSessions}</Text>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-lg border">
            <Heading level="h3" className="mb-4">Quick Actions</Heading>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="secondary"
                onClick={() => setShowCreateSession(true)}
                className="flex items-center gap-2 h-20 flex-col justify-center"
              >
                <Plus className="w-6 h-6" />
                Create New Design
              </Button>
              <Button
                variant="secondary"
                onClick={syncTemplates}
                disabled={loading}
                className="flex items-center gap-2 h-20 flex-col justify-center"
              >
                <RefreshCw className="w-6 h-6" />
                Sync Templates
              </Button>
              <Button
                variant="secondary"
                onClick={() => setActiveSection("printful")}
                className="flex items-center gap-2 h-20 flex-col justify-center"
              >
                <ExternalLink className="w-6 h-6" />
                Browse Catalog
              </Button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white p-6 rounded-lg border">
            <Heading level="h3" className="mb-4">Recent Designs</Heading>
            {designs.slice(0, 5).length > 0 ? (
              <div className="space-y-3">
                {designs.slice(0, 5).map((design) => (
                  <div key={design.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <Text className="font-medium">{design.name}</Text>
                      <Text className="text-sm text-gray-600">{design.description}</Text>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(design.status)}
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => createProductFromDesign(design.design_id)}
                      >
                        Create Product
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Text className="text-gray-500">No designs created yet</Text>
            )}
          </div>
        </div>
      )}

      {/* Printful Catalog Section */}
      {activeSection === "printful" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Heading level="h2">Printful Product Catalog</Heading>
              <Text className="text-gray-600">Sync products directly from Printful to create new designs</Text>
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search Printful products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              {selectedItems.length > 0 && (
                <Button
                  onClick={bulkSyncProducts}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Sync {selectedItems.length} Products
                </Button>
              )}
            </div>
          </div>

          {filteredPrintfulProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPrintfulProducts.map((product) => (
                <div key={product.id} className="bg-white p-4 rounded-lg border">
                  <div className="relative">
                    <img
                      src={product.image || "/placeholder-product.jpg"}
                      alt={product.name}
                      className="w-full h-48 object-cover rounded-lg mb-3"
                    />
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(product.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems([...selectedItems, product.id]);
                        } else {
                          setSelectedItems(selectedItems.filter(id => id !== product.id));
                        }
                      }}
                      className="absolute top-2 right-2 w-4 h-4"
                    />
                  </div>
                  <div className="space-y-2">
                    <Text className="font-medium">{product.name}</Text>
                    <Text className="text-sm text-gray-600">{product.description}</Text>
                    <div className="flex items-center justify-between">
                      <Text className="text-sm font-medium">${product.price}</Text>
                      <Badge variant="secondary">{product.category}</Badge>
                    </div>
                    <Button
                      className="w-full"
                      variant="secondary"
                      onClick={() => syncPrintfulProduct(product.id)}
                      disabled={loading}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Sync Product
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-lg border text-center">
              <ExternalLink className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <Text className="text-gray-500 mb-4">No Printful products available</Text>
              <Text className="text-sm text-gray-400">
                Check your Printful API connection or sync your product catalog
              </Text>
            </div>
          )}
        </div>
      )}

      {/* Other sections would follow similar pattern with simplified components */}

      {/* Create Session Modal */}
      {showCreateSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <Heading level="h2">Create New Design Session</Heading>
              <Button
                variant="secondary"
                size="small"
                onClick={() => setShowCreateSession(false)}
              >
                ×
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Text className="mb-2 font-medium">Artist ID</Text>
                <Input
                  value={sessionForm.artistId}
                  onChange={(e) => setSessionForm({...sessionForm, artistId: e.target.value})}
                  placeholder="Enter artist identifier"
                />
              </div>
              <div>
                <Text className="mb-2 font-medium">Product Type</Text>
                <select
                  value={sessionForm.productType}
                  onChange={(e) => setSessionForm({...sessionForm, productType: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select product type</option>
                  <option value="apparel">Apparel</option>
                  <option value="accessories">Accessories</option>
                  <option value="home">Home & Living</option>
                  <option value="stationery">Stationery</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button
                variant="secondary"
                onClick={() => setShowCreateSession(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => createStudioSession()}
                disabled={loading}
              >
                {loading ? "Creating..." : "Open Studio"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Printful Studio",
  icon: Palette,
});

export default PrintfulStudioPage;