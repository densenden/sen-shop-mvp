import { BaseEntity } from "@medusajs/medusa";
import { Entity, Column, Index, ManyToOne, JoinColumn } from "typeorm";

@Entity("printful_studio_products")
export class PrintfulStudioProduct extends BaseEntity {
  @Column({ type: "varchar" })
  @Index()
  medusa_product_id: string;

  @Column({ type: "varchar" })
  printful_product_id: string;

  @Column({ type: "varchar" })
  printful_variant_id: string;

  @Column({ type: "varchar", nullable: true })
  @Index()
  design_id: string | null;

  @Column({ type: "varchar", nullable: true })
  @Index()
  template_id: string | null;

  @Column({ type: "jsonb", default: [] })
  mockup_urls: any[];

  @Column({ type: "jsonb", default: {} })
  print_areas: Record<string, any>;

  @Column({ type: "jsonb", default: [] })
  print_files: any[];
}

@Entity("printful_studio_sessions")
export class PrintfulStudioSession extends BaseEntity {
  @Column({ type: "varchar" })
  @Index()
  artist_id: string;

  @Column({ type: "varchar", unique: true })
  @Index()
  session_token: string;

  @Column({ type: "jsonb", default: {} })
  design_data: Record<string, any>;

  @Column({ type: "jsonb", default: {} })
  template_data: Record<string, any>;

  @Column({ type: "jsonb", default: {} })
  product_data: Record<string, any>;

  @Column({ 
    type: "varchar", 
    default: "active",
    enum: ["active", "completed", "expired", "cancelled"]
  })
  @Index()
  status: "active" | "completed" | "expired" | "cancelled";

  @Column({ type: "timestamptz", nullable: true })
  @Index()
  expires_at: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  completed_at: Date | null;
}

@Entity("printful_studio_templates")
export class PrintfulStudioTemplate extends BaseEntity {
  @Column({ type: "varchar", unique: true })
  @Index()
  template_id: string;

  @Column({ type: "varchar" })
  @Index()
  category: string;

  @Column({ type: "varchar" })
  @Index()
  product_type: string;

  @Column({ type: "varchar" })
  name: string;

  @Column({ type: "text", nullable: true })
  description: string | null;

  @Column({ type: "varchar", nullable: true })
  preview_url: string | null;

  @Column({ type: "jsonb", default: [] })
  print_areas: any[];

  @Column({ type: "jsonb", default: {} })
  options: Record<string, any>;

  @Column({ type: "jsonb", default: {} })
  constraints: Record<string, any>;

  @Column({ type: "boolean", default: true })
  @Index()
  is_active: boolean;
}

@Entity("printful_studio_designs")
export class PrintfulStudioDesign extends BaseEntity {
  @Column({ type: "varchar", unique: true })
  design_id: string;

  @Column({ type: "varchar" })
  @Index()
  artist_id: string;

  @Column({ type: "uuid", nullable: true })
  @Index()
  session_id: string | null;

  @ManyToOne(() => PrintfulStudioSession, { nullable: true })
  @JoinColumn({ name: "session_id" })
  session?: PrintfulStudioSession;

  @Column({ type: "varchar" })
  name: string;

  @Column({ type: "text", nullable: true })
  description: string | null;

  @Column({ type: "jsonb" })
  design_data: Record<string, any>;

  @Column({ type: "jsonb", default: [] })
  preview_urls: any[];

  @Column({ type: "jsonb", default: [] })
  print_files: any[];

  @Column({ type: "varchar", nullable: true })
  @Index()
  template_id: string | null;

  @ManyToOne(() => PrintfulStudioTemplate, { nullable: true })
  @JoinColumn({ name: "template_id", referencedColumnName: "template_id" })
  template?: PrintfulStudioTemplate;

  @Column({ 
    type: "varchar", 
    default: "draft",
    enum: ["draft", "published", "archived"]
  })
  @Index()
  status: "draft" | "published" | "archived";
}

// Type definitions for Studio API responses
export interface PrintfulStudioConfig {
  templateCategories: string[];
  defaultTemplates: string[];
  profitMargin: number;
  currency: string;
  locale: string;
}

export interface StudioSessionRequest {
  artistId: string;
  templateId?: string;
  productData?: Record<string, any>;
  returnUrl?: string;
  cancelUrl?: string;
}

export interface StudioSessionResponse {
  sessionId: string;
  sessionToken: string;
  embedUrl: string;
  expiresAt: Date;
}

export interface StudioDesignCompleteData {
  sessionToken: string;
  designId: string;
  designData: {
    layers: any[];
    dimensions: {
      width: number;
      height: number;
    };
    printAreas: Record<string, any>;
  };
  mockupUrls: string[];
  printFiles: {
    url: string;
    type: string;
    printArea: string;
  }[];
  productInfo: {
    templateId: string;
    variants: any[];
    pricing: {
      basePrice: number;
      printPrice: number;
      currency: string;
    };
  };
}

export interface StudioProductCreationData {
  designId: string;
  artistId: string;
  title: string;
  description?: string;
  variants: {
    size: string;
    color: string;
    printfulVariantId: string;
    basePrice: number;
    printPrice: number;
  }[];
  images: string[];
  profitMargin: number;
}