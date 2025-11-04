/**
 * POD Template Tests
 * Tests for template CRUD operations, application, pricing calculations, and versioning
 */

import { PODTemplateModuleService } from "../services/pod-template-service"

describe("PODTemplateModuleService", () => {
  let service: PODTemplateModuleService

  beforeEach(() => {
    // Mock container for testing
    const mockContainer = {
      logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
      },
    }
    service = new PODTemplateModuleService(mockContainer)

    // Mock all database methods
    service.createPODTemplates = jest.fn()
    service.createPODTemplateVersions = jest.fn()
    service.listPODTemplates = jest.fn()
    service.listPODTemplateVersions = jest.fn()
    service.updatePODTemplates = jest.fn()
    service.createPODTemplateProductLinks = jest.fn()
    service.listPODTemplateProductLinks = jest.fn()
  })

  describe("Template CRUD Operations", () => {
    it("should create a POD template with required fields", async () => {
      const templateData = {
        name: "Basic T-Shirt Template",
        description: "Standard t-shirt template with common variants",
        provider: "printful" as const,
        variant_configs: {
          sizes: ["S", "M", "L", "XL"],
          colors: ["black", "white", "navy"],
          options: {
            default_size: "M",
            default_color: "black"
          }
        },
        pricing_rules: {
          base_cost: 15.99,
          markup_percentage: 100,
          minimum_price: 25.00
        },
        metadata: {
          category: "apparel",
          tags: ["tshirt", "basic"]
        }
      }

      // Mock the createPODTemplates method
      ;(service.createPODTemplates as jest.Mock).mockResolvedValue({
        id: "template_123",
        version: 1,
        status: "draft",
        created_at: new Date(),
        updated_at: new Date(),
        ...templateData
      })

      // Mock the createPODTemplateVersions method
      ;(service.createPODTemplateVersions as jest.Mock).mockResolvedValue({
        id: "version_456",
        template_id: "template_123",
        version_number: 1
      })

      const template = await service.createTemplate(templateData)

      expect(template).toBeDefined()
      expect(template.name).toBe("Basic T-Shirt Template")
      expect(template.provider).toBe("printful")
      expect(template.version).toBe(1)
      expect(template.status).toBe("draft")
      expect(service.createPODTemplates).toHaveBeenCalledWith({
        ...templateData,
        version: 1,
        status: "draft"
      })
      expect(service.createPODTemplateVersions).toHaveBeenCalled()
    })

    it("should update a template and increment version", async () => {
      const templateId = "template_123"
      const updates = {
        name: "Updated T-Shirt Template",
        pricing_rules: {
          base_cost: 16.99,
          markup_percentage: 120,
          minimum_price: 30.00
        }
      }

      // Mock the existing template
      ;(service.listPODTemplates as jest.Mock).mockResolvedValue([{
        id: templateId,
        version: 1,
        name: "Basic T-Shirt Template",
        provider: "printful",
        status: "active",
        description: "Original description",
        variant_configs: { sizes: ["S", "M"] },
        pricing_rules: { base_cost: 15.99 },
        metadata: { category: "apparel" }
      }])

      ;(service.createPODTemplateVersions as jest.Mock).mockResolvedValue({
        id: "version_456",
        template_id: templateId,
        version_number: 1
      })

      ;(service.updatePODTemplates as jest.Mock).mockResolvedValue({
        id: templateId,
        version: 2,
        ...updates,
        status: "active",
        updated_at: new Date()
      })

      const updatedTemplate = await service.updateTemplateWithVersioning(templateId, updates)

      expect(updatedTemplate.version).toBe(2)
      expect(updatedTemplate.name).toBe("Updated T-Shirt Template")
      expect(service.createPODTemplateVersions).toHaveBeenCalled()
      expect(service.updatePODTemplates).toHaveBeenCalledWith({
        id: templateId,
        ...updates,
        version: 2
      })
    })
  })

  describe("Template Application to Products", () => {
    it("should apply template configuration to a product", async () => {
      const template = {
        id: "template_123",
        name: "Basic T-Shirt Template",
        provider: "printful",
        version: 1,
        variant_configs: {
          sizes: ["S", "M", "L", "XL"],
          colors: ["black", "white", "navy"],
          options: {
            default_size: "M",
            default_color: "black"
          }
        },
        pricing_rules: {
          base_cost: 15.99,
          markup_percentage: 100,
          minimum_price: 25.00
        }
      }

      const productData = {
        name: "Cool Graphics Tee",
        artwork_url: "https://example.com/artwork.png"
      }

      const appliedProduct = await service.applyTemplateToProduct(template, productData)

      expect(appliedProduct.variants).toHaveLength(12) // 4 sizes × 3 colors
      expect(appliedProduct.variants[0]).toMatchObject({
        size: expect.any(String),
        color: expect.any(String),
        price: expect.any(Number)
      })

      // Verify pricing calculation
      const blackMediumVariant = appliedProduct.variants.find(
        v => v.size === "M" && v.color === "black"
      )
      expect(blackMediumVariant?.price).toBe(31.98) // 15.99 * 2.0 markup
    })

    it("should handle template application with custom overrides", async () => {
      const template = {
        id: "template_123",
        provider: "printful",
        version: 1,
        variant_configs: {
          sizes: ["S", "M", "L"],
          colors: ["black", "white"]
        },
        pricing_rules: {
          base_cost: 15.99,
          markup_percentage: 100,
          minimum_price: 25.00
        }
      }

      const productData = {
        name: "Premium Tee",
        overrides: {
          pricing_rules: {
            markup_percentage: 150 // Custom markup
          },
          variant_configs: {
            sizes: ["M", "L", "XL"] // Custom sizes
          }
        }
      }

      const appliedProduct = await service.applyTemplateToProduct(template, productData)

      // Should use override values
      expect(appliedProduct.variants).toHaveLength(6) // 3 sizes × 2 colors
      const mediumBlackVariant = appliedProduct.variants.find(
        v => v.size === "M" && v.color === "black"
      )
      expect(mediumBlackVariant?.price).toBe(39.98) // 15.99 * 2.5 markup
    })
  })

  describe("Pricing Formula Calculations", () => {
    it("should calculate correct pricing with percentage markup", async () => {
      const pricingRules = {
        base_cost: 20.00,
        markup_percentage: 150, // 150% markup
        minimum_price: 30.00
      }

      const calculatedPrice = service.calculatePrice(pricingRules)

      expect(calculatedPrice).toBe(50.00) // 20.00 * 2.5
    })

    it("should enforce minimum price when calculated price is too low", async () => {
      const pricingRules = {
        base_cost: 10.00,
        markup_percentage: 50, // 50% markup = 15.00
        minimum_price: 25.00
      }

      const calculatedPrice = service.calculatePrice(pricingRules)

      expect(calculatedPrice).toBe(25.00) // Minimum price enforced
    })

    it("should handle complex pricing with additional fees", async () => {
      const pricingRules = {
        base_cost: 15.99,
        markup_percentage: 100,
        minimum_price: 20.00,
        additional_fees: {
          processing_fee: 2.50,
          platform_fee_percentage: 5 // 5% of final price
        }
      }

      const calculatedPrice = service.calculatePriceWithFees(pricingRules)

      // Base calculation: 15.99 * 2 = 31.98
      // Add processing fee: 31.98 + 2.50 = 34.48
      // Add platform fee: 34.48 + (34.48 * 0.05) = 36.20
      expect(calculatedPrice).toBeCloseTo(36.20, 2)
    })
  })

  describe("Template Versioning", () => {
    it("should create a new version when template is updated", async () => {
      const templateId = "template_123"

      // Mock existing template
      ;(service.listPODTemplates as jest.Mock).mockResolvedValue([{
        id: templateId,
        version: 1,
        name: "Original Template",
        status: "active",
        description: "Original description",
        variant_configs: { sizes: ["S", "M"] },
        pricing_rules: { base_cost: 15.99 },
        metadata: { category: "apparel" }
      }])

      // Mock version creation
      ;(service.createPODTemplateVersions as jest.Mock).mockResolvedValue({
        id: "version_456",
        template_id: templateId,
        version_number: 1,
        changes: { name: "Original Template" },
        created_at: new Date()
      })

      ;(service.updatePODTemplates as jest.Mock).mockResolvedValue({
        id: templateId,
        version: 2,
        name: "Updated Template",
        status: "active"
      })

      const updatedTemplate = await service.updateTemplateWithVersioning(templateId, {
        name: "Updated Template"
      })

      expect(service.createPODTemplateVersions).toHaveBeenCalledWith({
        template_id: templateId,
        version_number: 1,
        changes: expect.objectContaining({
          name: "Original Template"
        }),
        change_summary: "Template update"
      })
      expect(updatedTemplate.version).toBe(2)
    })

    it("should retrieve template version history", async () => {
      const templateId = "template_123"

      ;(service.listPODTemplateVersions as jest.Mock).mockResolvedValue([
        {
          id: "version_1",
          template_id: templateId,
          version_number: 1,
          changes: { name: "Original Name" },
          created_at: new Date("2024-01-01")
        },
        {
          id: "version_2",
          template_id: templateId,
          version_number: 2,
          changes: { pricing_rules: { markup_percentage: 120 } },
          created_at: new Date("2024-01-02")
        }
      ])

      const versions = await service.getTemplateVersionHistory(templateId)

      expect(versions).toHaveLength(2)
      expect(versions[0].version_number).toBe(1)
      expect(versions[1].version_number).toBe(2)
      expect(service.listPODTemplateVersions).toHaveBeenCalledWith(
        { template_id: templateId },
        { order: { version_number: "ASC" } }
      )
    })
  })

  describe("Template Cloning", () => {
    it("should clone a template with new name and reset version", async () => {
      const sourceTemplate = {
        id: "template_123",
        name: "Source Template",
        provider: "printful",
        variant_configs: { sizes: ["S", "M", "L"] },
        pricing_rules: { base_cost: 15.99, markup_percentage: 100 },
        version: 3,
        status: "active",
        description: "Source description",
        metadata: { category: "apparel" }
      }

      ;(service.listPODTemplates as jest.Mock).mockResolvedValue([sourceTemplate])

      // Mock the createTemplate method internally
      ;(service.createPODTemplates as jest.Mock).mockResolvedValue({
        id: "template_456",
        name: "Cloned Template",
        provider: "printful",
        variant_configs: { sizes: ["S", "M", "L"] },
        pricing_rules: { base_cost: 15.99, markup_percentage: 100 },
        version: 1, // Reset to version 1
        status: "draft"
      })

      ;(service.createPODTemplateVersions as jest.Mock).mockResolvedValue({
        id: "version_789",
        template_id: "template_456",
        version_number: 1
      })

      ;(service.updatePODTemplates as jest.Mock).mockResolvedValue({
        id: "template_456",
        cloned_from: "template_123"
      })

      const clonedTemplate = await service.cloneTemplate("template_123", "Cloned Template")

      expect(clonedTemplate.name).toBe("Cloned Template")
      expect(clonedTemplate.version).toBe(1)
      expect(clonedTemplate.status).toBe("draft")
      expect(service.updatePODTemplates).toHaveBeenCalledWith({
        id: clonedTemplate.id,
        cloned_from: "template_123"
      })
    })
  })
})