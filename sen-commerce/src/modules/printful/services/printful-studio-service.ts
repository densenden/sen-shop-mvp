import { EntityManager } from "typeorm";
import { MedusaService } from "@medusajs/framework/utils";
import axios, { AxiosInstance } from "axios";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import {
  PrintfulStudioProduct,
  PrintfulStudioSession,
  PrintfulStudioTemplate,
  PrintfulStudioDesign,
  PrintfulStudioConfig,
  StudioSessionRequest,
  StudioSessionResponse,
  StudioDesignCompleteData,
  StudioProductCreationData,
} from "../models/printful-studio";

export class PrintfulStudioService extends MedusaService({}) {
  private axiosInstance: AxiosInstance;
  private studioConfig: PrintfulStudioConfig;
  private studioApiKey: string;
  private studioSecretKey: string;
  private baseUrl: string;

  constructor(
    container: any,
    private readonly manager: EntityManager
  ) {
    super();
    
    this.studioApiKey = process.env.PRINTFUL_STUDIO_KEY || "";
    this.studioSecretKey = process.env.PRINTFUL_STUDIO_SECRET || "";
    this.baseUrl = process.env.PRINTFUL_STUDIO_URL || "https://studio-api.printful.com";
    
    this.studioConfig = {
      templateCategories: ["apparel", "accessories", "home", "stationery"],
      defaultTemplates: ["t-shirt", "hoodie", "mug", "poster"],
      profitMargin: parseFloat(process.env.PRINTFUL_PROFIT_MARGIN || "0.30"),
      currency: "USD",
      locale: "en_US",
    };

    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      headers: {
        "Authorization": `Bearer ${this.studioApiKey}`,
        "Content-Type": "application/json",
        "X-PF-Store-Id": process.env.PRINTFUL_STORE_ID,
      },
    });
  }

  /**
   * Initialize a new studio design session
   */
  async createSession(data: StudioSessionRequest): Promise<StudioSessionResponse> {
    return await this.atomicPhase_(async (manager) => {
      const sessionRepo = manager.getRepository(PrintfulStudioSession);
      
      // Generate secure session token
      const sessionToken = this.generateSessionToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      // Create session in database
      const session = sessionRepo.create({
        artist_id: data.artistId,
        session_token: sessionToken,
        template_data: data.templateId ? { templateId: data.templateId } : {},
        product_data: data.productData || {},
        status: "active",
        expires_at: expiresAt,
      });
      
      await sessionRepo.save(session);
      
      // Generate embed URL with session parameters
      const embedUrl = this.generateEmbedUrl({
        sessionToken,
        templateId: data.templateId,
        returnUrl: data.returnUrl,
        cancelUrl: data.cancelUrl,
      });
      
      return {
        sessionId: session.id,
        sessionToken,
        embedUrl,
        expiresAt,
      };
    });
  }

  /**
   * Get session by token
   */
  async getSessionByToken(sessionToken: string): Promise<PrintfulStudioSession | null> {
    const sessionRepo = this.manager.getRepository(PrintfulStudioSession);
    
    const session = await sessionRepo.findOne({
      where: { session_token: sessionToken },
    });
    
    if (!session) {
      return null;
    }
    
    // Check if session is expired
    if (session.expires_at && new Date() > session.expires_at) {
      await this.updateSessionStatus(session.id, "expired");
      return null;
    }
    
    return session;
  }

  /**
   * Update session status
   */
  async updateSessionStatus(
    sessionId: string,
    status: "active" | "completed" | "expired" | "cancelled"
  ): Promise<void> {
    return await this.atomicPhase_(async (manager) => {
      const sessionRepo = manager.getRepository(PrintfulStudioSession);
      
      await sessionRepo.update(sessionId, {
        status,
        completed_at: status === "completed" ? new Date() : undefined,
      });
    });
  }

  /**
   * Handle design completion from Studio
   */
  async handleDesignComplete(data: StudioDesignCompleteData): Promise<PrintfulStudioDesign> {
    return await this.atomicPhase_(async (manager) => {
      const sessionRepo = manager.getRepository(PrintfulStudioSession);
      const designRepo = manager.getRepository(PrintfulStudioDesign);
      
      // Get and validate session
      const session = await sessionRepo.findOne({
        where: { session_token: data.sessionToken },
      });
      
      if (!session || session.status !== "active") {
        throw new Error("Invalid or inactive session");
      }
      
      // Create design record
      const design = designRepo.create({
        design_id: data.designId,
        artist_id: session.artist_id,
        session_id: session.id,
        name: `Design ${data.designId}`,
        design_data: data.designData,
        preview_urls: data.mockupUrls,
        print_files: data.printFiles,
        template_id: data.productInfo.templateId,
        status: "draft",
      });
      
      await designRepo.save(design);
      
      // Update session with design data
      await sessionRepo.update(session.id, {
        design_data: data.designData,
        status: "completed",
        completed_at: new Date(),
      });
      
      return design;
    });
  }

  /**
   * Get available templates
   */
  async getTemplates(category?: string): Promise<PrintfulStudioTemplate[]> {
    const templateRepo = this.manager.getRepository(PrintfulStudioTemplate);
    
    const where: any = { is_active: true };
    if (category) {
      where.category = category;
    }
    
    return await templateRepo.find({ where });
  }

  /**
   * Sync templates from Printful API
   */
  async syncTemplates(): Promise<void> {
    return await this.atomicPhase_(async (manager) => {
      const templateRepo = manager.getRepository(PrintfulStudioTemplate);
      
      try {
        // Fetch templates from Printful API
        const response = await this.axiosInstance.get("/templates");
        const templates = response.data.result;
        
        for (const template of templates) {
          const existing = await templateRepo.findOne({
            where: { template_id: template.id },
          });
          
          if (existing) {
            // Update existing template
            await templateRepo.update(existing.id, {
              category: template.category,
              product_type: template.product_type,
              name: template.name,
              description: template.description,
              preview_url: template.preview_url,
              print_areas: template.print_areas,
              options: template.options,
              constraints: template.constraints,
            });
          } else {
            // Create new template
            const newTemplate = templateRepo.create({
              template_id: template.id,
              category: template.category,
              product_type: template.product_type,
              name: template.name,
              description: template.description,
              preview_url: template.preview_url,
              print_areas: template.print_areas,
              options: template.options,
              constraints: template.constraints,
              is_active: true,
            });
            
            await templateRepo.save(newTemplate);
          }
        }
      } catch (error) {
        console.error("Failed to sync templates:", error);
        throw error;
      }
    });
  }

  /**
   * Create product from design
   */
  async createProductFromDesign(
    designId: string,
    productData: Partial<StudioProductCreationData>
  ): Promise<PrintfulStudioProduct> {
    return await this.atomicPhase_(async (manager) => {
      const designRepo = manager.getRepository(PrintfulStudioDesign);
      const productRepo = manager.getRepository(PrintfulStudioProduct);
      
      // Get design
      const design = await designRepo.findOne({
        where: { design_id: designId },
      });
      
      if (!design) {
        throw new Error("Design not found");
      }
      
      // Create product in Printful
      const printfulProduct = await this.createPrintfulProduct(design, productData);
      
      // Create local product record
      const product = productRepo.create({
        medusa_product_id: "", // Will be set after Medusa product creation
        printful_product_id: printfulProduct.id,
        printful_variant_id: printfulProduct.variants[0].id,
        design_id: designId,
        template_id: design.template_id,
        mockup_urls: design.preview_urls,
        print_areas: design.design_data.printAreas || {},
        print_files: design.print_files,
      });
      
      await productRepo.save(product);
      
      // Update design status
      await designRepo.update(design.id, { status: "published" });
      
      return product;
    });
  }

  /**
   * Generate mockups for a design
   */
  async generateMockups(designId: string, variantIds?: string[]): Promise<string[]> {
    try {
      const response = await this.axiosInstance.post("/mockup-generator", {
        design_id: designId,
        variant_ids: variantIds,
        format: "jpg",
        files: [
          {
            placement: "front",
            image_url: "", // Will be populated from design data
          },
        ],
      });
      
      return response.data.result.mockups.map((m: any) => m.mockup_url);
    } catch (error) {
      console.error("Failed to generate mockups:", error);
      throw error;
    }
  }

  /**
   * Calculate pricing for studio product
   */
  calculatePricing(basePrice: number, printPrice: number): {
    cost: number;
    retailPrice: number;
    profit: number;
  } {
    const cost = basePrice + printPrice;
    const retailPrice = cost * (1 + this.studioConfig.profitMargin);
    const profit = retailPrice - cost;
    
    return {
      cost: Math.round(cost * 100) / 100,
      retailPrice: Math.round(retailPrice * 100) / 100,
      profit: Math.round(profit * 100) / 100,
    };
  }

  /**
   * Get design by ID
   */
  async getDesignById(designId: string): Promise<PrintfulStudioDesign | null> {
    const designRepo = this.manager.getRepository(PrintfulStudioDesign);
    
    return await designRepo.findOne({
      where: { design_id: designId },
      relations: ["session", "template"],
    });
  }

  /**
   * Get designs by artist
   */
  async getDesignsByArtist(artistId: string): Promise<PrintfulStudioDesign[]> {
    const designRepo = this.manager.getRepository(PrintfulStudioDesign);
    
    return await designRepo.find({
      where: { artist_id: artistId },
      order: { created_at: "DESC" },
    });
  }

  /**
   * Archive a design
   */
  async archiveDesign(designId: string): Promise<void> {
    return await this.atomicPhase_(async (manager) => {
      const designRepo = manager.getRepository(PrintfulStudioDesign);
      
      await designRepo.update(
        { design_id: designId },
        { status: "archived" }
      );
    });
  }

  /**
   * Private helper methods
   */
  
  private generateSessionToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  private generateEmbedUrl(params: {
    sessionToken: string;
    templateId?: string;
    returnUrl?: string;
    cancelUrl?: string;
  }): string {
    const baseUrl = process.env.PRINTFUL_STUDIO_IFRAME_URL || "https://studio.printful.com";
    const queryParams = new URLSearchParams();
    
    queryParams.append("session", params.sessionToken);
    queryParams.append("store_id", process.env.PRINTFUL_STORE_ID || "");
    
    if (params.templateId) {
      queryParams.append("template", params.templateId);
    }
    
    if (params.returnUrl) {
      queryParams.append("return_url", params.returnUrl);
    }
    
    if (params.cancelUrl) {
      queryParams.append("cancel_url", params.cancelUrl);
    }
    
    return `${baseUrl}/embed?${queryParams.toString()}`;
  }

  private async createPrintfulProduct(
    design: PrintfulStudioDesign,
    productData: Partial<StudioProductCreationData>
  ): Promise<any> {
    try {
      const response = await this.axiosInstance.post("/products", {
        name: productData.title || design.name,
        description: productData.description || design.description,
        design: {
          design_id: design.design_id,
          print_files: design.print_files,
        },
        variants: productData.variants || [],
      });
      
      return response.data.result;
    } catch (error) {
      console.error("Failed to create Printful product:", error);
      throw error;
    }
  }
}