import { Injectable, signal } from '@angular/core';

export type BusinessUserRole = 'employer' | 'employee';
export type UserType = 'حقیقی' | 'حقوقی';
export type UserRank = 1 | 2 | 3 | 4 | 5;
export type EmployerApprovalState = 'pending' | 'approved' | 'rejected';
export type NotificationMethod = 'پیامک';

export interface BusinessUserRecord {
  readonly id: number;
  readonly mobile: string;
  readonly joinedAt: string;
  readonly fullName: string | null;
  readonly nationalId: string | null;
  readonly companyName: string;
  readonly email: string;
  readonly birthDate?: string;
  readonly description?: string;
  readonly roles: readonly BusinessUserRole[];
  readonly userType: UserType;
  readonly hasFreeCredit: boolean;
  readonly freeCreditExpiresAt: string | null;
  readonly rank: UserRank;
  readonly lastOtpAt: string | null;
  readonly otpCount: number;
  readonly hasSentDocuments: boolean;
  readonly isActive: boolean;
  readonly employerApproval?: EmployerApprovalState;
  readonly ticketAccess: boolean;
  readonly refundRequestAllowed: boolean;
  readonly invoiceDeliveryMethod: 'ارسال نشود';
  readonly invoicePostalCode: string;
  readonly invoiceRecipientName: string;
  readonly invoiceRecipientMobile: string;
  readonly invoiceAddress: string;
  readonly profileImage: string | null;
  readonly nationalCardImage: string | null;
  readonly landline: string;
  readonly province: string;
  readonly county: string;
  readonly city: string;
  readonly gender: 'مرد' | 'زن';
  readonly officialNewspaperImage: string | null;
  readonly vatCertificateImage: string | null;
  readonly registrationNumber: string;
  readonly companyNationalId: string;
  readonly economicCode: string;
  readonly registeredAddress: string;
  readonly financialContactName: string;
  readonly financialContactMobile: string;
  readonly financialContactLandline: string;
  readonly refundIban: string;
  readonly paymentGatewayDisabled: boolean;
  readonly ticketNotification: NotificationMethod;
  readonly documentNotification: NotificationMethod;
  readonly financialNotification: NotificationMethod;
  readonly shipmentNotification: NotificationMethod;
  readonly discountNotification: NotificationMethod;
  readonly newsletterEmail: boolean;
}

type BusinessUserSeed = Pick<BusinessUserRecord,
  'id' | 'mobile' | 'joinedAt' | 'fullName' | 'nationalId' | 'companyName' | 'roles' |
  'userType' | 'hasFreeCredit' | 'freeCreditExpiresAt' | 'rank' | 'lastOtpAt' |
  'otpCount' | 'hasSentDocuments' | 'isActive' | 'employerApproval'> & Partial<BusinessUserRecord>;

function createUser(seed: BusinessUserSeed): BusinessUserRecord {
  return {
    email: '',
    ticketAccess: true,
    refundRequestAllowed: false,
    invoiceDeliveryMethod: 'ارسال نشود',
    invoicePostalCode: '',
    invoiceRecipientName: '',
    invoiceRecipientMobile: '',
    invoiceAddress: '',
    profileImage: null,
    nationalCardImage: null,
    landline: '',
    province: 'تهران',
    county: 'تهران',
    city: 'تهران',
    gender: 'مرد',
    officialNewspaperImage: null,
    vatCertificateImage: null,
    registrationNumber: '',
    companyNationalId: '',
    economicCode: '',
    registeredAddress: '',
    financialContactName: '',
    financialContactMobile: '',
    financialContactLandline: '',
    refundIban: '',
    paymentGatewayDisabled: false,
    ticketNotification: 'پیامک',
    documentNotification: 'پیامک',
    financialNotification: 'پیامک',
    shipmentNotification: 'پیامک',
    discountNotification: 'پیامک',
    newsletterEmail: false,
    ...seed
  };
}

@Injectable({ providedIn: 'root' })
export class BusinessUserPreviewService {
  readonly users = signal<readonly BusinessUserRecord[]>([
    createUser({
      id: 1001, mobile: '09121234567', joinedAt: '۱۴۰۳/۰۲/۱۸', fullName: 'مریم احمدی',
      nationalId: '0012345678', email: 'maryam@example.test', companyName: 'مجموعه نمونه سپهر',
      roles: ['employer', 'employee'], userType: 'حقوقی', hasFreeCredit: false,
      freeCreditExpiresAt: null, rank: 1, lastOtpAt: '۱۴۰۵/۰۶/۱۹ - ۱۰:۳۵', otpCount: 1,
      hasSentDocuments: true, isActive: true, employerApproval: 'approved',
      registrationNumber: '۴۳۷۸۸۵', companyNationalId: '۱۴۰۱۲۷۲۸۶۵۴',
      registeredAddress: 'تهران، خیابان نمونه، پلاک ۱۲', financialContactName: 'زهرا احمدی',
      financialContactMobile: '09120123456', financialContactLandline: '02191010783',
      refundIban: 'IR120550020280007321036001'
    }),
    createUser({
      id: 1002, mobile: '09129876543', joinedAt: '۱۴۰۳/۰۵/۰۹', fullName: 'رضا کریمی',
      nationalId: '1234567890', email: 'reza@example.test', companyName: 'شرکت راهکار نوین',
      roles: ['employer'], userType: 'حقوقی', hasFreeCredit: true,
      freeCreditExpiresAt: '۱۴۰۵/۱۲/۲۹', rank: 2, lastOtpAt: '۱۴۰۵/۰۶/۱۸ - ۰۹:۲۰',
      otpCount: 4, hasSentDocuments: true, isActive: true, employerApproval: 'pending'
    }),
    createUser({
      id: 1003, mobile: '09350000001', joinedAt: '۱۴۰۳/۰۶/۲۱', fullName: null,
      nationalId: null, companyName: '', roles: ['employee'], userType: 'حقیقی',
      hasFreeCredit: false, freeCreditExpiresAt: null, rank: 3, lastOtpAt: null,
      otpCount: 0, hasSentDocuments: false, isActive: true
    }),
    createUser({
      id: 1007, mobile: '09123334455', joinedAt: '۱۴۰۳/۰۷/۱۲', fullName: 'حامد اکبری',
      nationalId: '0098765432', companyName: 'کارگاه توسعه پارس', roles: ['employer'],
      userType: 'حقوقی', hasFreeCredit: true, freeCreditExpiresAt: '۱۴۰۶/۰۱/۳۱',
      rank: 4, lastOtpAt: null, otpCount: 0, hasSentDocuments: false, isActive: false,
      employerApproval: 'rejected'
    })
  ]);

  findUser(userId: number): BusinessUserRecord | null {
    return this.users().find(user => user.id === userId) ?? null;
  }

  addEmployee(input: {
    readonly mobile: string;
    readonly joinedAt: string;
    readonly fullName: string | null;
    readonly nationalId: string | null;
    readonly email: string;
    readonly birthDate?: string;
    readonly description?: string;
  }): void {
    const nextId = Math.max(...this.users().map(user => user.id)) + 1;
    this.users.update(users => [...users, createUser({
      ...input,
      id: nextId,
      companyName: '',
      roles: ['employee'],
      userType: 'حقیقی',
      hasFreeCredit: false,
      freeCreditExpiresAt: null,
      rank: 1,
      lastOtpAt: null,
      otpCount: 0,
      hasSentDocuments: false,
      isActive: true
    })]);
  }

  updateUser(userId: number, changes: Partial<BusinessUserRecord>): boolean {
    if (!this.findUser(userId)) return false;
    this.users.update(users => users.map(user => user.id === userId ? { ...user, ...changes } : user));
    return true;
  }

  isMobileUnique(mobile: string, currentUserId: number): boolean {
    return !this.users().some(user => user.id !== currentUserId && user.mobile === mobile);
  }
}
