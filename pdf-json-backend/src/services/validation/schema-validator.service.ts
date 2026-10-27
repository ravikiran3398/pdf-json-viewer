import _Ajv from 'ajv';
import _addFormats from 'ajv-formats';

const AjvClass: any = (_Ajv as any).default || _Ajv;
const addFormatsFn: any = (_addFormats as any).default || _addFormats;

const ajv = new AjvClass({ allErrors: true, strict: false });
addFormatsFn(ajv);

export interface ValidationOutput {
  isValid: boolean;
  errors: Array<{
    instancePath: string;
    schemaPath: string;
    keyword: string;
    message: string;
  }>;
}

export const defaultInvoiceSchema = {
  type: 'object',
  required: ['documentType'],
  properties: {
    documentType: { type: 'string' },
    invoiceNumber: { type: 'string' },
    invoiceDate: { type: 'string' },
    dueDate: { type: ['string', 'null'] },
    currency: { type: 'string' },
    vendor: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        taxId: { type: ['string', 'null'] },
      },
    },
    customer: {
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
    },
    lineItems: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          description: { type: 'string' },
          quantity: { type: 'number' },
          unitPrice: { type: 'number' },
          amount: { type: 'number' },
        },
      },
    },
    financialSummary: {
      type: 'object',
      properties: {
        subtotal: { type: 'number' },
        taxAmount: { type: 'number' },
        totalAmount: { type: 'number' },
      },
    },
    paymentStatus: { type: 'string' },
  },
};

export const defaultMedicalSchema = {
  type: 'object',
  required: ['documentType'],
  properties: {
    documentType: { type: 'string' },
    documentTitle: { type: 'string' },
    reportMetadata: {
      type: 'object',
      properties: {
        caseNumber: { type: ['string', 'null'] },
        reportDate: { type: ['string', 'null'] },
        department: { type: ['string', 'null'] },
        physician: { type: ['string', 'null'] },
        medicalConsultant: { type: ['string', 'null'] },
        facility: { type: ['string', 'null'] },
      },
    },
    patientInformation: {
      type: 'object',
      properties: {
        name: { type: ['string', 'null'] },
        age: { type: ['number', 'null'] },
        gender: { type: ['string', 'null'] },
        demographics: { type: ['string', 'null'] },
        chiefComplaint: { type: ['string', 'null'] },
        pastMedicalHistory: { type: ['string', 'null'] },
      },
    },
    clinicalChronology: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          date: { type: 'string' },
          time: { type: 'string' },
          event: { type: 'string' },
        },
      },
    },
    diagnoses: {
      type: 'array',
      items: { type: 'string' },
    },
    medications: {
      type: 'object',
      properties: {
        prior: { type: 'array', items: { type: 'string' } },
        administered: { type: 'array', items: { type: 'string' } },
        dischargePrescriptions: { type: 'array', items: { type: 'string' } },
        instructions: { type: 'array', items: { type: 'string' } },
      },
    },
    dischargeSummary: {
      type: 'object',
      properties: {
        dischargeDiagnosis: { type: ['string', 'null'] },
        dischargeTime: { type: ['string', 'null'] },
        prescriptions: { type: 'array', items: { type: 'string' } },
      },
    },
    extractedKeyValues: { type: 'object' },
  },
};

export const defaultReceiptSchema = {
  type: 'object',
  required: ['documentType'],
  properties: {
    documentType: { type: 'string' },
    merchantName: { type: 'string' },
    date: { type: 'string' },
    totalAmount: { type: 'number' },
    currency: { type: 'string' },
    paymentMethod: { type: 'string' },
  },
};

export const defaultBankStatementSchema = {
  type: 'object',
  required: ['documentType'],
  properties: {
    documentType: { type: 'string' },
    bankName: { type: 'string' },
    accountNumber: { type: 'string' },
    statementPeriod: { type: 'object' },
    openingBalance: { type: 'number' },
    closingBalance: { type: 'number' },
    currency: { type: 'string' },
  },
};

export const defaultGenericSchema = {
  type: 'object',
  required: ['documentType'],
  properties: {
    documentType: { type: 'string' },
    documentTitle: { type: 'string' },
    extractedKeyValues: { type: 'object' },
  },
};

export class SchemaValidatorService {
  validate(data: Record<string, any>, customSchema?: Record<string, any>): ValidationOutput {
    let schemaToUse = customSchema;
    if (!schemaToUse) {
      const docType = String(data?.documentType || '').toUpperCase();
      if (docType.includes('MEDICAL') || docType.includes('HEALTH') || docType.includes('CLINICAL')) {
        schemaToUse = defaultMedicalSchema;
      } else if (docType === 'RECEIPT') {
        schemaToUse = defaultReceiptSchema;
      } else if (docType === 'BANK_STATEMENT') {
        schemaToUse = defaultBankStatementSchema;
      } else if (docType === 'INVOICE') {
        schemaToUse = defaultInvoiceSchema;
      } else {
        schemaToUse = defaultGenericSchema;
      }
    }

    try {
      const validateFn = ajv.compile(schemaToUse);
      const isValid = validateFn(data);

      if (!isValid && validateFn.errors) {
        return {
          isValid: false,
          errors: validateFn.errors.map((err: any) => ({
            instancePath: err.instancePath || '/',
            schemaPath: err.schemaPath,
            keyword: err.keyword,
            message: err.message || 'Validation error',
          })),
        };
      }

      return {
        isValid: true,
        errors: [],
      };
    } catch (err: any) {
      return {
        isValid: false,
        errors: [
          {
            instancePath: '/',
            schemaPath: '#',
            keyword: 'compilation',
            message: `Schema compilation failed: ${err.message}`,
          },
        ],
      };
    }
  }
}

export const schemaValidatorService = new SchemaValidatorService();
