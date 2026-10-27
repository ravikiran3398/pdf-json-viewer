export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

export type ProcessingStatus =
  | 'UPLOADED'
  | 'QUEUED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'COMPLETED_WITH_WARNINGS'
  | 'FAILED'
  | 'CANCELLED';

export type ExtractionMode = 'AUTO' | 'FAST_TEXT' | 'OCR_SCANNED' | 'TABLE_FORM';

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  isActive: boolean;
  company?: string | null;
  avatarUrl?: string | null;
  activePlan?: Plan | null;
  isSubscriptionExpired?: boolean;
  subscriptionStatus?: string;
  usage?: {
    pagesUsed: number;
    pageQuota: number;
    remainingPages: number;
  };
}

export interface Plan {
  id: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  billingPeriod: string;
  pageQuota: number;
  ocrQuota: number;
  maxFileSizeMb: number;
  features: string[];
  isActive?: boolean;
}

export interface Subscription {
  id: string;
  planId: string;
  status: 'ACTIVE' | 'TRIAL' | 'CANCELLED' | 'PAST_DUE' | 'EXPIRED';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  plan?: Plan;
}

export interface ExtractionResult {
  id: string;
  documentId: string;
  version: number;
  data: Record<string, any>;
  schemaValid: boolean;
  warnings?: string[] | null;
  confidenceScore: number;
  createdAt?: string;
  validationErrors?: Array<{
    instancePath: string;
    message: string;
  }>;
}

export interface DocumentItem {
  id: string;
  userId: string;
  sourceType: 'MANUAL_UPLOAD' | 'GOOGLE_DRIVE';
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  pageCount?: number;
  storageKey: string;
  downloadUrl?: string;
  status: ProcessingStatus;
  extractionMode: ExtractionMode;
  processingDurationMs?: number;
  errorMessage?: string;
  createdAt: string;
  latestResult?: ExtractionResult | null;
  results?: ExtractionResult[];
}

export interface ProcessingBatch {
  id: string;
  name: string;
  totalDocuments: number;
  completedCount: number;
  failedCount: number;
  status: ProcessingStatus;
  createdAt: string;
  documents?: DocumentItem[];
}

export interface ExtractionTemplate {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean;
  schema: Record<string, any>;
  sampleFields?: Record<string, any>;
}

export interface ApiKeyItem {
  id: string;
  label: string;
  keyPrefix: string;
  plainKey?: string;
  scopes: string[];
  lastUsedAt?: string | null;
  isRevoked: boolean;
  createdAt: string;
}

export interface WebhookItem {
  id: string;
  url: string;
  secret: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
  deliveries?: Array<{
    id: string;
    eventType: string;
    statusCode?: number;
    isSuccess: boolean;
    createdAt: string;
  }>;
}

export interface SupportTicketItem {
  id: string;
  ticketId: string;
  subject: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  messages: Array<{
    sender: 'USER' | 'ADMIN';
    senderEmail: string;
    message: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
  user?: { email: string; name?: string };
}
