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
  readonly title: 'فاکتور شارژ کیف پول';
  readonly invoiceNumber: string;
  readonly issuedAt: string;
  readonly amountRial: number;
  readonly line: EmployerInvoiceLinePreview;
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
    title: 'فاکتور شارژ کیف پول',
    invoiceNumber: '22561',
    issuedAt: '1405/06/17',
    amountRial: 267_000,
    line: { code: '10001', description: 'سامانه فیش حقوق', quantity: '۱', unit: 'خدمت', unitAmountRial: 250_000, totalAmountRial: 250_000, discountAmountRial: 0, afterDiscountAmountRial: 250_000, taxAmountRial: 17_000, finalAmountRial: 267_000 }
  },
  {
    id: 2,
    title: 'فاکتور شارژ کیف پول',
    invoiceNumber: '22562',
    issuedAt: '1405/05/29',
    amountRial: 534_000,
    line: { code: '10002', description: 'سامانه فیش حقوق', quantity: '۱', unit: 'خدمت', unitAmountRial: 500_000, totalAmountRial: 500_000, discountAmountRial: 0, afterDiscountAmountRial: 500_000, taxAmountRial: 34_000, finalAmountRial: 534_000 }
  },
  {
    id: 3,
    title: 'فاکتور شارژ کیف پول',
    invoiceNumber: '22563',
    issuedAt: '1405/04/11',
    amountRial: 712_000,
    line: { code: '10003', description: 'سامانه فیش حقوق', quantity: '۱', unit: 'خدمت', unitAmountRial: 680_000, totalAmountRial: 680_000, discountAmountRial: 0, afterDiscountAmountRial: 680_000, taxAmountRial: 32_000, finalAmountRial: 712_000 }
  },
  {
    id: 4,
    title: 'فاکتور شارژ کیف پول',
    invoiceNumber: '22564',
    issuedAt: '1405/03/23',
    amountRial: 389_000,
    line: { code: '10004', description: 'سامانه فیش حقوق', quantity: '۱', unit: 'خدمت', unitAmountRial: 370_000, totalAmountRial: 370_000, discountAmountRial: 0, afterDiscountAmountRial: 370_000, taxAmountRial: 19_000, finalAmountRial: 389_000 }
  },
  {
    id: 5,
    title: 'فاکتور شارژ کیف پول',
    invoiceNumber: '22565',
    issuedAt: '1405/02/08',
    amountRial: 845_000,
    line: { code: '10005', description: 'سامانه فیش حقوق', quantity: '۱', unit: 'خدمت', unitAmountRial: 800_000, totalAmountRial: 800_000, discountAmountRial: 0, afterDiscountAmountRial: 800_000, taxAmountRial: 45_000, finalAmountRial: 845_000 }
  }
];
