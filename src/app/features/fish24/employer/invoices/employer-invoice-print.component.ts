import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  EMPLOYER_INVOICE_BUYER_PREVIEW,
  EMPLOYER_INVOICE_PREVIEWS,
  EMPLOYER_INVOICE_SELLER_PREVIEW,
  EmployerInvoicePreview
} from './employer-invoice-preview.data';

@Component({
  selector: 'app-employer-invoice-print',
  standalone: true,
  imports: [RouterLink],
  template: `
    @if (invoice(); as currentInvoice) {
      <main class="invoice-print-shell" dir="rtl">
        <div class="invoice-print-controls">
          <a routerLink="/fish24/employer/invoices">بازگشت</a>
          <button type="button" (click)="printInvoice()">چاپ فاکتور</button>
        </div>

        <div class="invoice-document-scroll">
          <article class="official-invoice ss02" aria-label="صورتحساب فروش کالا و خدمات">
            <div class="header">
              <div class="box1"></div>
              <div class="box2">
                <p>صورتحساب فروش کالا و خدمات</p>
              </div>
              <div class="box3">
                <div>سریال: <span dir="ltr">{{ currentInvoice.invoiceNumber }}</span></div>
                <div>تاریخ: <span dir="ltr">{{ currentInvoice.issuedAt }}</span></div>
              </div>
            </div>

            <p class="trader-info-text">مشخصات فروشنده</p>

            <div class="trader-info">
              <div class="trader-info-row">
                <div class="trader-info-item">نام شخص حقیقی / حقوقی: {{ seller.name }}</div>
                <div class="trader-info-item">شماره اقتصادی: <span dir="ltr">{{ seller.economicNumber }}</span></div>
                <div class="trader-info-item">شماره ثبت: <span dir="ltr">{{ seller.registrationNumber }}</span></div>
              </div>
              <div class="trader-info-row">
                <div class="trader-info-item">نشانی کامل: استان: {{ seller.province }}</div>
                <div class="trader-info-item">شهرستان: {{ seller.county }}</div>
                <div class="trader-info-item">شهر: {{ seller.city }}</div>
                <div class="trader-info-item">کد پستی 10 رقمی: <span dir="ltr">{{ seller.postalCode }}</span></div>
                <div class="trader-info-item">شناسه ملی: <span dir="ltr">{{ seller.nationalId }}</span></div>
              </div>
              <div class="trader-info-row">
                <div class="trader-info-item">نشانی: {{ seller.address }}</div>
                <div class="trader-info-item">تلفن/نمابر: <span dir="ltr">{{ seller.phone }}</span></div>
              </div>
            </div>

            <p class="trader-info-text">مشخصات خریدار</p>

            <div class="trader-info">
              <div class="trader-info-row">
                <div class="trader-info-item">نام شخص حقیقی / حقوقی: {{ buyer.name }}</div>
                <div class="trader-info-item">شماره اقتصادی: <span dir="ltr">{{ buyer.economicNumber }}</span></div>
                <div class="trader-info-item">شماره ثبت: <span dir="ltr">{{ buyer.registrationNumber }}</span></div>
              </div>
              <div class="trader-info-row">
                <div class="trader-info-item">نشانی کامل: استان: {{ buyer.province }}</div>
                <div class="trader-info-item">شهرستان: {{ buyer.county }}</div>
                <div class="trader-info-item">شهر: {{ buyer.city }}</div>
                <div class="trader-info-item">کد پستی 10 رقمی: <span dir="ltr">{{ buyer.postalCode }}</span></div>
                <div class="trader-info-item">شناسه ملی: <span dir="ltr">{{ buyer.nationalId }}</span></div>
              </div>
              <div class="trader-info-row">
                <div class="trader-info-item">نشانی: {{ buyer.address }}</div>
                <div class="trader-info-item">تلفن/نمابر: <span dir="ltr">{{ buyer.phone }}</span></div>
              </div>
            </div>

            <p class="trader-info-text">مشخصات کالا یا خدمات مورد معامله</p>

            <div class="details">
              <table>
                <thead>
                  <tr>
                    <th>ردیف</th>
                    <th>کد کالا</th>
                    <th>شرح کالا یا خدمات</th>
                    <th>تعداد/مقدار</th>
                    <th>واحد اندازه گیری</th>
                    <th>مبلغ واحد (ریال)</th>
                    <th>مبلغ کل (ریال)</th>
                    <th>مبلغ تخفیف</th>
                    <th>مبلغ کل پس از تخفیف (ریال)</th>
                    <th>جمع مالیات و عوارض (ریال)</th>
                    <th>جمع مبلغ کل بعلاوه جمع مالیات و عوارض (ریال)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>1</td>
                    <td>{{ currentInvoice.line.code }}</td>
                    <td>{{ currentInvoice.line.description }}</td>
                    <td>{{ currentInvoice.line.quantity }}</td>
                    <td>{{ currentInvoice.line.unit }}</td>
                    <td>{{ formatAmount(currentInvoice.line.unitAmountRial) }}</td>
                    <td>{{ formatAmount(currentInvoice.line.totalAmountRial) }}</td>
                    <td>{{ formatAmount(currentInvoice.line.discountAmountRial) }}</td>
                    <td>{{ formatAmount(currentInvoice.line.afterDiscountAmountRial) }}</td>
                    <td>{{ formatAmount(currentInvoice.line.taxAmountRial) }}</td>
                    <td>{{ formatAmount(currentInvoice.line.finalAmountRial) }}</td>
                  </tr>
                  <tr>
                    <td colspan="5">جمع کل :</td>
                    <td>{{ formatAmount(currentInvoice.line.unitAmountRial) }}</td>
                    <td>{{ formatAmount(currentInvoice.line.totalAmountRial) }}</td>
                    <td>{{ formatAmount(currentInvoice.line.discountAmountRial) }}</td>
                    <td>{{ formatAmount(currentInvoice.line.afterDiscountAmountRial) }}</td>
                    <td>{{ formatAmount(currentInvoice.line.taxAmountRial) }}</td>
                    <td>{{ formatAmount(currentInvoice.line.finalAmountRial) }}</td>
                  </tr>
                  <tr class="conditions-row">
                    <td colspan="5">شرایط و نحوه فروش: </td>
                    <td colspan="6">توضیحات: </td>
                  </tr>
                  <tr class="signature-row">
                    <td colspan="5">
                      مهر و امضاء فروشنده
                      <img src="/assets/fish24/invoices/signature.jpg" alt="مهر و امضاء فروشنده">
                    </td>
                    <td colspan="6">مهر و امضاء خریدار</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p class="official-mobile" dir="ltr">mobile: 09000000000</p>
          </article>
        </div>
      </main>
    }
  `,
  styles: [`
    @font-face {
      font-family: 'Fish24OfficialInvoiceIranSans';
      src: url('/assets/fish24/invoices/iransansweb.woff2') format('woff2');
      font-style: normal;
      font-weight: 400;
      font-display: block;
    }

    :host {
      display: block;
      min-height: 100vh;
      background: #e5e7eb;
    }

    .invoice-print-shell {
      min-height: 100vh;
      padding: 1px 0 30px;
      color: #000;
      background: #e5e7eb;
    }

    .invoice-print-controls {
      display: flex;
      width: 80%;
      min-width: 1120px;
      margin: 18px auto -12px;
      gap: 10px;
      font-family: Vazirmatn, Tahoma, Arial, sans-serif;
    }

    .invoice-print-controls a,
    .invoice-print-controls button {
      display: inline-flex;
      min-height: 40px;
      align-items: center;
      justify-content: center;
      border: 1px solid #0f766e;
      border-radius: 8px;
      padding: 7px 18px;
      color: #fff;
      background: #0f766e;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
      text-decoration: none;
    }

    .invoice-print-controls a {
      color: #0f766e;
      background: #fff;
    }

    .invoice-document-scroll {
      overflow-x: auto;
    }

    .official-invoice,
    .official-invoice * {
      font-family: 'Fish24OfficialInvoiceIranSans', sans-serif !important;
    }

    .official-invoice {
      box-sizing: content-box;
      width: 80%;
      min-width: 1120px;
      min-height: calc(100vh - 102px);
      border: 1px solid #000;
      margin: 30px auto;
      padding: 20px;
      direction: rtl;
      line-height: 1.5;
      font-size: 13px;
      font-weight: bold;
      color: #000;
      background: #fff;
      font-feature-settings: "ss02";
    }

    .header {
      display: flex;
      text-align: center;
    }

    .box1 { width: 20%; }

    .box2 {
      display: flex;
      width: 60%;
      align-items: center;
      justify-content: center;
    }

    .box2 p {
      margin: 1em 0;
      font-weight: bold;
      font-size: 15px;
    }

    .box3 {
      display: flex;
      width: 20%;
      flex-direction: column;
      justify-content: center;
    }

    .trader-info-text {
      margin: 0;
      border: 1px solid #000;
      border-radius: 3px;
      padding: 5px;
      text-align: center;
      font-weight: bold;
      font-size: 15px;
    }

    .trader-info {
      border: 1px solid #000;
      border-radius: 3px;
      padding: 5px;
    }

    .trader-info-row {
      display: flex;
      justify-content: space-between;
    }

    table {
      width: 100%;
      border-spacing: 0;
      border-collapse: collapse;
      font-size: 14px;
    }

    td,
    th {
      border: 1px solid #000;
      margin: 0;
      padding: 5px;
      vertical-align: middle;
      text-align: start;
      font-weight: normal;
      font-size: 12px;
    }

    .conditions-row { height: 40px; }
    .signature-row { height: 100px; }

    .signature-row img {
      width: 164px;
      height: 109px;
      vertical-align: middle;
    }

    .official-mobile {
      margin: 1em 0;
      text-align: right;
    }

    @media (max-width: 1199px) {
      .invoice-print-controls {
        width: auto;
        min-width: 0;
        margin-inline: 16px;
      }
    }

    @media print {
      @page {
        size: A4 landscape;
        margin: 0.5cm;
      }

      :host,
      .invoice-print-shell {
        min-height: 0;
        padding: 0;
        background: #fff !important;
      }

      .invoice-print-controls {
        display: none !important;
      }

      .invoice-document-scroll {
        overflow: visible;
      }

      .official-invoice {
        box-sizing: border-box;
        width: 100%;
        min-width: 0;
        min-height: 0;
        margin: 0;
        padding: 20px;
        break-inside: avoid;
        page-break-inside: avoid;
        color: #000 !important;
        border-color: #000 !important;
        background: #fff !important;
      }

      .official-invoice,
      .official-invoice * {
        color: #000 !important;
        border-color: #000 !important;
        background: #fff !important;
        box-shadow: none !important;
      }
    }
  `]
})
export class EmployerInvoicePrintComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly amountFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

  readonly invoice = signal<EmployerInvoicePreview | null>(null);
  readonly seller = EMPLOYER_INVOICE_SELLER_PREVIEW;
  readonly buyer = EMPLOYER_INVOICE_BUYER_PREVIEW;

  ngOnInit(): void {
    const invoiceId = Number(this.route.snapshot.paramMap.get('id'));
    const invoice = EMPLOYER_INVOICE_PREVIEWS.find((candidate) => candidate.id === invoiceId);

    if (!invoice) {
      void this.router.navigate(['/fish24/employer/invoices'], { replaceUrl: true });
      return;
    }

    this.invoice.set(invoice);
  }

  async printInvoice(): Promise<void> {
    await document.fonts.load('13px "Fish24OfficialInvoiceIranSans"');
    await document.fonts.ready;
    window.print();
  }

  formatAmount(amount: number): string {
    return this.amountFormatter.format(amount);
  }
}
