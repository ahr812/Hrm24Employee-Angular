import { Injectable, signal, effect } from '@angular/core';

export interface Organization {
    id: string;
    name: string;
    personnelCode: string; // شماره پرسنلی مختص هر شرکت
    role: string;
    contractStatus: 'active' | 'expired' | 'pending';
    logoColor: string;
}

@Injectable({ providedIn: 'root' })
export class OrganizationService {
    private organizations: Organization[] = [
        {
            id: 'org1',
            name: 'شرکت فناوری اطلاعات پیشرو',
            personnelCode: '90215',
            role: 'کارشناس ارشد نرم‌افزار',
            contractStatus: 'active',
            logoColor: 'bg-blue-600'
        },
        {
            id: 'org2',
            name: 'هلدینگ سرمایه‌گذاری امید',
            personnelCode: '44102',
            role: 'مشاور پروژه',
            contractStatus: 'active',
            logoColor: 'bg-emerald-600'
        },
        {
            id: 'org3',
            name: 'استارتاپ نوآوران',
            personnelCode: '001',
            role: 'هم‌بنیان‌گذار',
            contractStatus: 'pending',
            logoColor: 'bg-purple-600'
        }
    ];

    // بارگذاری شرکت آخر از حافظه مرورگر
    private savedOrgId = localStorage.getItem('active_org_id');
    private defaultOrg = this.organizations.find(o => o.id === this.savedOrgId) || this.organizations[0];

    private _activeOrg = signal<Organization>(this.defaultOrg);

    get activeOrg() {
        return this._activeOrg.asReadonly();
    }

    get allOrgs() {
        return this.organizations;
    }

    switchOrg(orgId: string): void {
        const org = this.organizations.find(o => o.id === orgId);
        if (org) {
            this._activeOrg.set(org);
            localStorage.setItem('active_org_id', org.id);
            // اینجا می‌توان ایونت emitter گذاشت تا داشبورد دیتاها را رفرش کند
        }
    }
}