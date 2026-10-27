export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'DocuParse JSON — Enterprise REST API',
    version: '1.0.0',
    description:
      'Production-grade REST API for PDF-to-JSON conversions, document extraction, schema validation, batch processing, and webhook events.',
    contact: {
      name: 'DocuParse API Support',
      email: 'support@docuparse.io',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000/api/v1',
      description: 'Local Development Server',
    },
    {
      url: 'https://api.yourdomain.com/api/v1',
      description: 'AWS Production API Gateway',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT access token retrieved from /auth/login',
      },
      apiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'Developer personal API key generated from User Dashboard',
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['System Health'],
        summary: 'Platform Health Probe',
        description: 'Returns operational status of the backend API and database connection.',
        responses: {
          200: {
            description: 'API is healthy and running',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    service: { type: 'string', example: 'pdf-json-backend' },
                    timestamp: { type: 'string', example: '2026-10-27T10:00:00.000Z' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Create New User Account',
        description: 'Registers a new user and automatically allocates the Free tier (10 pages/month).',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'developer@example.com' },
                  password: { type: 'string', format: 'password', example: 'Pass@12345' },
                  name: { type: 'string', example: 'Alex Developer' },
                  company: { type: 'string', example: 'Acme Corp' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Account created successfully with JWT token' },
          409: { description: 'Email already registered' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Authenticate User or Administrator',
        description: 'Validates user credentials against dedicated portal (user or admin) and returns JWT.',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'user@pdfjson.com' },
                  password: { type: 'string', format: 'password', example: 'User@12345' },
                  portal: { type: 'string', enum: ['user', 'admin'], example: 'user' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Login successful' },
          401: { description: 'Invalid credentials' },
          403: { description: 'Portal segregation access denied' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get Current Authenticated Profile',
        description: 'Returns profile details, role, and active subscription quota.',
        responses: {
          200: { description: 'Current profile data' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/billing/plans': {
      get: {
        tags: ['Billing & Plans'],
        summary: 'List Available Pricing Plans',
        description: 'Returns all active pricing tiers (Free, Starter, Pro, Business) and page quotas.',
        security: [],
        responses: {
          200: { description: 'List of active plans' },
        },
      },
    },
    '/billing/subscription': {
      get: {
        tags: ['Billing & Plans'],
        summary: 'Get User Active Subscription',
        description: 'Returns active plan details, expiration date, and page quota status.',
        responses: {
          200: { description: 'Active subscription status' },
        },
      },
    },
    '/billing/checkout': {
      post: {
        tags: ['Billing & Plans'],
        summary: 'Initiate Razorpay Checkout Order',
        description: 'Generates a secure order ID and amount for Razorpay payment processing.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['planId'],
                properties: {
                  planId: { type: 'string', example: 'pro' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Razorpay order generated' },
        },
      },
    },
    '/billing/verify': {
      post: {
        tags: ['Billing & Plans'],
        summary: 'Verify Razorpay Payment Signature',
        description: 'Validates payment confirmation and activates subscription quotas.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['planId', 'orderId', 'paymentId'],
                properties: {
                  planId: { type: 'string', example: 'pro' },
                  orderId: { type: 'string', example: 'order_12345' },
                  paymentId: { type: 'string', example: 'pay_67890' },
                  signature: { type: 'string', example: 'razorpay_sig_hash' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Payment verified and subscription activated' },
        },
      },
    },
    '/documents': {
      get: {
        tags: ['Documents'],
        summary: 'List User Documents',
        description: 'Returns paginated document history with conversion statuses, page counts, and extraction results.',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'] } },
        ],
        responses: {
          200: { description: 'List of documents' },
        },
      },
    },
    '/documents/upload': {
      post: {
        tags: ['Documents'],
        summary: 'Upload PDF and Convert to JSON',
        description: 'Uploads a PDF document to AWS S3, validates user subscription quota, and triggers parsing.',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: {
                  file: { type: 'string', format: 'binary', description: 'PDF file to convert' },
                  mode: { type: 'string', enum: ['AUTO', 'FAST_TEXT', 'OCR_SCANNED', 'TABLE_FORM'], default: 'AUTO' },
                  templateId: { type: 'string', description: 'Optional custom schema template ID' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'PDF uploaded and queued for processing' },
          403: { description: 'Quota exceeded or subscription expired' },
        },
      },
    },
    '/documents/{id}': {
      get: {
        tags: ['Documents'],
        summary: 'Get Document Conversion Result',
        description: 'Fetches raw extracted JSON, confidence scores, metadata, and signed preview URL.',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Document record and parsed JSON' },
          404: { description: 'Document not found' },
        },
      },
      delete: {
        tags: ['Documents'],
        summary: 'Delete Document',
        description: 'Removes document record and associated file from S3 storage.',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Document deleted successfully' },
        },
      },
    },
    '/documents/{id}/retry': {
      post: {
        tags: ['Documents'],
        summary: 'Retry Failed Conversion',
        description: 'Re-queues a failed document job for coordinate or OCR re-extraction.',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Conversion restarted' },
        },
      },
    },
    '/templates': {
      get: {
        tags: ['Custom Schemas'],
        summary: 'List Custom Extraction Templates',
        description: 'Returns organization-defined JSON schemas for Ajv enforcement.',
        responses: {
          200: { description: 'List of templates' },
        },
      },
      post: {
        tags: ['Custom Schemas'],
        summary: 'Create New Extraction Template',
        description: 'Registers a new JSON Schema draft-07 specification for strict payload validation.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'schema'],
                properties: {
                  name: { type: 'string', example: 'Standard Invoice Schema' },
                  description: { type: 'string', example: 'Strict extraction for tax invoices' },
                  schema: { type: 'object', description: 'Valid JSON Schema object' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Template created' },
        },
      },
    },
    '/api-keys': {
      get: {
        tags: ['API Keys'],
        summary: 'List Developer API Keys',
        description: 'Lists all active and revoked API keys for programmatic automation.',
        responses: {
          200: { description: 'List of API keys' },
        },
      },
      post: {
        tags: ['API Keys'],
        summary: 'Generate New API Key',
        description: 'Generates a secure Bearer token with optional rate-limiting tiers.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', example: 'Production Backend Worker' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'API Key generated' },
        },
      },
    },
    '/webhooks': {
      get: {
        tags: ['Webhooks'],
        summary: 'List Registered Webhook Endpoints',
        description: 'Returns webhook receivers for document.completed and document.failed events.',
        responses: {
          200: { description: 'List of webhooks' },
        },
      },
      post: {
        tags: ['Webhooks'],
        summary: 'Register Webhook Endpoint',
        description: 'Registers an HTTPS destination for real-time conversion payloads.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['url', 'events'],
                properties: {
                  url: { type: 'string', format: 'uri', example: 'https://api.yourdomain.com/webhooks/pdf' },
                  events: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['document.completed', 'document.failed'],
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Webhook registered' },
        },
      },
    },
    '/admin/overview': {
      get: {
        tags: ['Admin Console'],
        summary: 'Platform Operational KPIs',
        description: 'Returns MRR, total users, page throughput, error rates, and queue metrics.',
        responses: {
          200: { description: 'Platform metrics' },
          403: { description: 'Forbidden: Requires ADMIN or SUPER_ADMIN role' },
        },
      },
    },
  },
};
