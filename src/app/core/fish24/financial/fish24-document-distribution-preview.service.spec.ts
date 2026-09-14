import { TestBed } from '@angular/core/testing';
import { Fish24RolePreviewService } from '../dev/fish24-role-preview.service';
import { Fish24DocumentDistributionPreviewService } from './fish24-document-distribution-preview.service';
import { Fish24DocumentPricingPreviewService } from './fish24-document-pricing-preview.service';
import { Fish24WalletPreviewService } from './fish24-wallet-preview.service';

describe('Fish24DocumentDistributionPreviewService', () => {
  let service: Fish24DocumentDistributionPreviewService;
  let wallet: Fish24WalletPreviewService;
  let pricing: Fish24DocumentPricingPreviewService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [Fish24RolePreviewService, Fish24WalletPreviewService, Fish24DocumentPricingPreviewService, Fish24DocumentDistributionPreviewService] });
    service = TestBed.inject(Fish24DocumentDistributionPreviewService);
    wallet = TestBed.inject(Fish24WalletPreviewService);
    pricing = TestBed.inject(Fish24DocumentPricingPreviewService);
  });

  it('debits once, records the send reference and distributes atomically', () => {
    const before = wallet.balance('user-1')!;
    const receipt = service.receiptFor('2006')!;
    const first = service.confirmPayment('2006');
    const second = service.confirmPayment('2006');
    expect(first.ok).toBeTrue();
    expect(first.existing).toBeFalse();
    expect(wallet.balance('user-1')).toBe(before - receipt.breakdown.totalRial);
    expect(wallet.transactions().filter(item => item.operationId === '2006').length).toBe(1);
    expect(service.findSend('2006')?.isPaid).toBeTrue();
    expect(service.findSend('2006')?.employeeAccessActive).toBeTrue();
    expect(second.ok).toBeTrue();
    expect(second.existing).toBeTrue();
    expect(wallet.transactions().filter(item => item.operationId === '2006').length).toBe(1);
  });

  it('leaves all state unchanged on insufficient funds', () => {
    wallet['walletsState'].update(wallets => wallets.map(item => item.employerId === 'user-1' ? { ...item, balanceRial: 0 } : item));
    const sendsBefore = service.sends();
    const transactionsBefore = wallet.transactions();
    const result = service.confirmPayment('2006');
    expect(result.error).toBe('insufficient-funds');
    expect(service.sends()).toBe(sendsBefore);
    expect(wallet.transactions()).toBe(transactionsBefore);
    expect(wallet.balance('user-1')).toBe(0);
  });

  it('rejects invalid distribution metadata without partial mutation', () => {
    service['sendsState'].update(sends => sends.map(send => send.id === '2006' ? { ...send, recipientMobiles: [] } : send));
    const balanceBefore = wallet.balance('user-1');
    const transactionsBefore = wallet.transactions();
    const result = service.confirmPayment('2006');
    expect(result.error).toBe('invalid-distribution');
    expect(wallet.balance('user-1')).toBe(balanceBefore);
    expect(wallet.transactions()).toBe(transactionsBefore);
    expect(service.findSend('2006')?.isPaid).toBeFalse();
  });

  it('deletes only unpaid sends and removes their receipt', () => {
    expect(service.deleteUnpaid('2001')).toBeFalse();
    expect(service.findSend('2001')).not.toBeNull();
    expect(service.deleteUnpaid('2006')).toBeTrue();
    expect(service.findSend('2006')).toBeNull();
    expect(service.receiptFor('2006')).toBeNull();
  });

  it('preserves Support financial restrictions at the service boundary', () => {
    TestBed.inject(Fish24RolePreviewService).setPreviewRole('support-expert');
    const balanceBefore = wallet.balance('user-1');
    expect(service.confirmPayment('2006').error).toBe('forbidden');
    expect(service.deleteUnpaid('2006')).toBeFalse();
    expect(service.setEmployeeAccess('2001', false)).toBeFalse();
    expect(wallet.balance('user-1')).toBe(balanceBefore);
    expect(wallet.transactions().length).toBe(0);
  });

  it('blocks and restores employee access without another charge', () => {
    const transactionsBefore = wallet.transactions().length;
    expect(service.accessibleForEmployee('09123456789', '1405/06/23').some(send => send.id === '2001')).toBeTrue();
    expect(service.setEmployeeAccess('2001', false)).toBeTrue();
    expect(service.accessibleForEmployee('09123456789', '1405/06/23').some(send => send.id === '2001')).toBeFalse();
    expect(service.setEmployeeAccess('2001', true)).toBeTrue();
    expect(service.accessibleForEmployee('09123456789', '1405/06/23').some(send => send.id === '2001')).toBeTrue();
    expect(wallet.transactions().length).toBe(transactionsBefore);
  });

  it('retains the original uploaded blob and keeps pricing recalculation separate from payment history', () => {
    const source = new Blob(['original-pdf'], { type: 'application/pdf' });
    const registered = service.registerUnpaidSend({ id: 'original-file', createdAt: '1405/06/20', employerId: 'user-1', employerName: 'کارفرما', employerMobile: '09123456789', companyId: 101, companyName: 'مجموعه نمونه سپهر', title: 'سند اصلی', expiresAt: '1405/07/20', durationMonths: 1, userType: 'حقیقی', hasFreeCredit: false, pageCount: 1, smsEnabled: true, recipientMobiles: ['09123456789'], sourceFileName: 'original.pdf', sourceFile: source });
    expect(registered.send?.sourceFile).toBe(source);
    expect(service.confirmPayment('original-file').ok).toBeTrue();
    const balanceAfterPayment = wallet.balance('user-1');
    const transaction = wallet.transactions().find(item => item.operationId === 'original-file');
    const setting = pricing.pricingSettings().find(item => item.id === 12)!;
    const result = pricing.savePricing({ startDate: setting.startDate, endDate: setting.endDate, smsUnitPriceRial: String(setting.smsUnitPriceRial + 1), postalUnitPriceRial: String(setting.postalUnitPriceRial), page1Rial: String(setting.pagePricesRial[1] + 1), page3Rial: String(setting.pagePricesRial[3]), page6Rial: String(setting.pagePricesRial[6]), page12Rial: String(setting.pagePricesRial[12]), file1Rial: '0', file3Rial: '0', file6Rial: '0', file12Rial: '0', personnel1Rial: '0', personnel3Rial: '0', personnel6Rial: '0', personnel12Rial: '0', isActive: true }, setting.id);
    expect(result.ok).toBeTrue();
    expect(wallet.balance('user-1')).toBe(balanceAfterPayment);
    expect(wallet.transactions().find(item => item.operationId === 'original-file')).toEqual(transaction);
    expect(service.findSend('original-file')?.sourceFileName).toBe('original.pdf');
  });
});
