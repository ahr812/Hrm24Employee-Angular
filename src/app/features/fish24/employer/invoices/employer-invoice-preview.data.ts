export interface EmployerInvoicePartyPreview {
  readonly name: string;
  readonly economicNumber: string;
  readonly registrationNumber: string;
  readonly province: string;
  readonly county: string;
  readonly city: string;
  readonly postalCode: string;
  readonly nationalId: string;
  readonly address: string;
  readonly phone: string;
}

export interface EmployerInvoiceLinePreview {
  readonly code: string;
  readonly description: string;
  readonly quantity: string;
  readonly unit: string;
  readonly unitAmountRial: number;
  readonly totalAmountRial: number;
  readonly discountAmountRial: number;
  readonly afterDiscountAmountRial: number;
  readonly taxAmountRial: number;
  readonly finalAmountRial: number;
}

export interface EmployerInvoicePreview {
  readonly id: number;
  readonly employerId: string;
  readonly title: 'فاکتور شارژ کیف پول' | 'فاکتور تراکنش دستی';
  readonly invoiceNumber: string;
  readonly issuedAt: string;
  readonly amountRial: number;
  /** Issuance-time VAT snapshot. Historical preview fixtures predate this metadata. */
  readonly vatRatePercent: number | null;
  readonly vatSettingId: number | null;
  readonly line: EmployerInvoiceLinePreview;
  readonly sourceTransactionId?: string;
}

export interface LegacyFormalInvoicePreview {
  readonly legacyId: string;
  readonly employerId: string;
  readonly formalInvoiceNumber: string | null;
  readonly issueDate: string | null;
  readonly mobile: string | null;
  readonly name: string | null;
  readonly companyName: string | null;
  readonly userType: 'حقیقی' | 'حقوقی' | null;
  readonly title: string | null;
  readonly amountRial: number;
  readonly baseAmountRial: number;
  readonly taxAmountRial: number;
  readonly accountingVoucherProvenance: 'credit' | 'unknown';
  readonly trackingNumber: string | null;
  readonly originalSource: Readonly<Record<string, unknown>>;
}

export type Fish24FormalInvoiceSource = EmployerInvoicePreview | LegacyFormalInvoicePreview;

export function isLegacyFormalInvoice(source: Fish24FormalInvoiceSource): source is LegacyFormalInvoicePreview {
  return 'legacyId' in source;
}

export const EMPLOYER_INVOICE_SELLER_PREVIEW: EmployerInvoicePartyPreview = {
  name: 'شرکت نمونه پردازش سپهر',
  economicNumber: '411111111111',
  registrationNumber: '123456',
  province: 'استان نمونه',
  county: 'شهرستان نمونه',
  city: 'شهر نمونه',
  postalCode: '1111111111',
  nationalId: '14001111111',
  address: 'استان نمونه، شهر نمونه، خیابان آزمایشی، پلاک ۱',
  phone: '02100000000'
};

export const EMPLOYER_INVOICE_BUYER_PREVIEW: EmployerInvoicePartyPreview = {
  name: 'شرکت آزمایشی باران',
  economicNumber: '422222222222',
  registrationNumber: '234567',
  province: 'استان نمونه',
  county: 'شهرستان نمونه',
  city: 'شهر نمونه',
  postalCode: '2222222222',
  nationalId: '14002222222',
  address: 'استان نمونه، شهر نمونه، بلوار آزمایشی، پلاک ۲',
  phone: '02100000001'
};

export const EMPLOYER_INVOICE_PREVIEWS: readonly EmployerInvoicePreview[] = [
  {
    id: 1,
    employerId: '1001',
    title: 'فاکتور شارژ کیف پول',
    invoiceNumber: '22561',
    issuedAt: '1405/06/17',
    amountRial: 267_000,
    vatRatePercent: null,
    vatSettingId: null,
    line: { code: '10001', description: 'سامانه فیش حقوق', quantity: '۱', unit: 'خدمت', unitAmountRial: 250_000, totalAmountRial: 250_000, discountAmountRial: 0, afterDiscountAmountRial: 250_000, taxAmountRial: 17_000, finalAmountRial: 267_000 }
  },
  {
    id: 2,
    employerId: '1002',
    title: 'فاکتور شارژ کیف پول',
    invoiceNumber: '22562',
    issuedAt: '1405/05/29',
    amountRial: 534_000,
    vatRatePercent: null,
    vatSettingId: null,
    line: { code: '10002', description: 'سامانه فیش حقوق', quantity: '۱', unit: 'خدمت', unitAmountRial: 500_000, totalAmountRial: 500_000, discountAmountRial: 0, afterDiscountAmountRial: 500_000, taxAmountRial: 34_000, finalAmountRial: 534_000 }
  },
  {
    id: 3,
    // Authorized deterministic demo association; not verified historical ownership.
    employerId: '1007',
    title: 'فاکتور شارژ کیف پول',
    invoiceNumber: '22563',
    issuedAt: '1405/04/11',
    amountRial: 712_000,
    vatRatePercent: null,
    vatSettingId: null,
    line: { code: '10003', description: 'سامانه فیش حقوق', quantity: '۱', unit: 'خدمت', unitAmountRial: 680_000, totalAmountRial: 680_000, discountAmountRial: 0, afterDiscountAmountRial: 680_000, taxAmountRial: 32_000, finalAmountRial: 712_000 }
  },
  {
    id: 4,
    // Authorized deterministic demo association; not verified historical ownership.
    employerId: '1001',
    title: 'فاکتور شارژ کیف پول',
    invoiceNumber: '22564',
    issuedAt: '1405/03/23',
    amountRial: 389_000,
    vatRatePercent: null,
    vatSettingId: null,
    line: { code: '10004', description: 'سامانه فیش حقوق', quantity: '۱', unit: 'خدمت', unitAmountRial: 370_000, totalAmountRial: 370_000, discountAmountRial: 0, afterDiscountAmountRial: 370_000, taxAmountRial: 19_000, finalAmountRial: 389_000 }
  },
  {
    id: 5,
    // Authorized deterministic demo association; not verified historical ownership.
    employerId: '1002',
    title: 'فاکتور شارژ کیف پول',
    invoiceNumber: '22565',
    issuedAt: '1405/02/08',
    amountRial: 845_000,
    vatRatePercent: null,
    vatSettingId: null,
    line: { code: '10005', description: 'سامانه فیش حقوق', quantity: '۱', unit: 'خدمت', unitAmountRial: 800_000, totalAmountRial: 800_000, discountAmountRial: 0, afterDiscountAmountRial: 800_000, taxAmountRial: 45_000, finalAmountRial: 845_000 }
  }
];

/**
 * Historical preview records remain structurally separate from the current
 * printable invoice contract. The original payload is retained unchanged.
 */
export const LEGACY_FORMAL_INVOICE_PREVIEWS: readonly LegacyFormalInvoicePreview[] = [
  {
    legacyId: 'legacy-00022343',
    // Authorized deterministic demo association; historical customer fields remain in originalSource.
    employerId: '1007',
    formalInvoiceNumber: '00022343',
    issueDate: '1405/06/21',
    mobile: '09359684611',
    name: 'صمد روحی',
    companyName: 'شرکت پستی اطمینان آذری',
    userType: 'حقوقی',
    title: 'فاکتور شارژ کیف پول',
    amountRial: 550_000_000,
    baseAmountRial: 500_000_000,
    taxAmountRial: 50_000_000,
    accountingVoucherProvenance: 'credit',
    trackingNumber: null,
    originalSource: {
      legacyId: 'legacy-00022343', formalInvoiceNumber: '00022343', issueDate: '1405/06/21',
      mobile: '09359684611', name: 'صمد روحی', companyName: 'شرکت پستی اطمینان آذری',
      userType: 'حقوقی', title: 'فاکتور شارژ کیف پول', amountRial: 550_000_000
    }
  },
];
