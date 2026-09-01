import { Injectable } from '@angular/core';

/**
 * سرویس بومی‌سازی ایران
 * متمرکز بر: تقویم شمسی + فرمت اعداد فارسی
 */
@Injectable({ providedIn: 'root' })
export class IranLocalizationService {

    // ═══════════════════════════════════════
    // فرمت اعداد فارسی
    // ═══════════════════════════════════════

    /**
     * تبدیل اعداد انگلیسی به فارسی
     */
    toPersianNum(num: number | string): string {
        return num.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
    }

    /**
     * فرمت عدد با جداکننده هزارگان فارسی
     */
    formatNumber(num: number): string {
        return this.toPersianNum(new Intl.NumberFormat('fa-IR').format(Math.round(num)));
    }

    /**
     * فرمت درصد فارسی
     */
    formatPercent(value: number): string {
        return this.toPersianNum(value.toFixed(1)) + '٪';
    }

    // ═══════════════════════════════════════
    // تقویم شمسی
    // ═══════════════════════════════════════

    /**
     * نام ماه‌های شمسی
     */
    private readonly PERSIAN_MONTHS = [
        'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
        'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
    ];

    /**
     * دریافت نام ماه شمسی از شماره ماه (1-12)
     */
    getPersianMonthName(month: number): string {
        return this.PERSIAN_MONTHS[month - 1] || '';
    }

    /**
     * دریافت تاریخ شمسی فعلی به فرمت کامل
     * مثال: "۱۴ مرداد ۱۴۰۵"
     */
    getCurrentPersianDate(): string {
        return new Date().toLocaleDateString('fa-IR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * دریافت تاریخ شمسی فعلی به فرمت کوتاه
     * مثال: "1405/05/14"
     */
    getCurrentPersianDateShort(): string {
        const now = new Date();
        const dateStr = now.toLocaleDateString('fa-IR');
        const parts = dateStr.split('/').map(p =>
            p.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
        );
        return `${parts[0]}/${parts[1].padStart(2, '0')}/${parts[2].padStart(2, '0')}`;
    }

    /**
     * دریافت سال شمسی فعلی
     */
    getCurrentPersianYear(): number {
        const dateStr = new Date().toLocaleDateString('fa-IR');
        const yearPart = dateStr.split('/')[0];
        return parseInt(yearPart.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString()));
    }

    /**
     * دریافت شماره ماه شمسی فعلی (1-12)
     */
    getCurrentPersianMonth(): number {
        const dateStr = new Date().toLocaleDateString('fa-IR');
        const monthPart = dateStr.split('/')[1];
        return parseInt(monthPart.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString()));
    }

    /**
     * تبدیل تاریخ شمسی (1403/07/01) به میلادی
     */
    shamsiToGregorian(shamsiDate: string): Date | null {
        try {
            const parts = shamsiDate.split('/');
            if (parts.length !== 3) return null;

            const jy = parseInt(parts[0]);
            const jm = parseInt(parts[1]);
            const jd = parseInt(parts[2]);

            let gy = jy + 621;
            let leapJ = -14;
            const jp = jy + 621;

            if (jp < 0) leapJ = -15;

            const jump = Math.floor((jp - 1) / 33) * 8 + Math.floor(((jp - 1) % 33 + 3) / 4);
            const n = jd + (jm <= 6 ? (jm - 1) * 31 : (jm - 1) * 30 + 6);
            const m = jump + n + leapJ;
            let gd = m % 365;

            gy += Math.floor(m / 365);

            if (gd === 0) {
                gd = 365;
                gy -= 1;
            }

            let gm: number;
            if (gd <= 186) {
                gm = Math.ceil(gd / 31);
                gd = gd - (gm - 1) * 31;
            } else {
                gm = Math.ceil((gd - 186) / 30) + 6;
                gd = gd - 186 - (gm - 7) * 30;
            }

            return new Date(gy, gm - 1, gd);
        } catch {
            return null;
        }
    }

    /**
     * بررسی اینکه آیا امروز در بازه زمانی مشخص قرار دارد
     */
    isTodayInRange(startDate: string, endDate: string): boolean {
        const start = this.shamsiToGregorian(startDate);
        const end = this.shamsiToGregorian(endDate);
        const now = new Date();
        if (!start || !end) return false;
        return now >= start && now <= end;
    }

    /**
     * فرمت تاریخ شمسی برای نمایش در UI
     * ورودی: "1403/07/15" → خروجی: "۱۵ مهر ۱۴۰۳"
     */
    formatShamsiDate(shamsiDate: string): string {
        try {
            const parts = shamsiDate.split('/');
            if (parts.length !== 3) return shamsiDate;

            const year = parts[0];
            const month = parseInt(parts[1]);
            const day = parts[2];

            const monthName = this.getPersianMonthName(month);
            return `${this.toPersianNum(day)} ${monthName} ${this.toPersianNum(year)}`;
        } catch {
            return shamsiDate;
        }
    }

    /**
     * محاسبه تعداد روزهای باقیمانده تا یک تاریخ شمسی
     * @returns تعداد روزها (منفی = گذشته است)
     */
    daysUntil(shamsiDate: string): number {
        const target = this.shamsiToGregorian(shamsiDate);
        if (!target) return 0;

        const now = new Date();
        now.setHours(0, 0, 0, 0);
        target.setHours(0, 0, 0, 0);

        const diffMs = target.getTime() - now.getTime();
        return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    }

    /**
     * متن فارسی برای تعداد روزهای باقیمانده
     * مثال: "۵ روز مانده" یا "۳ روز پیش"
     */
    daysUntilText(shamsiDate: string): string {
        const days = this.daysUntil(shamsiDate);
        if (days > 0) return `${this.toPersianNum(days)} روز مانده`;
        if (days === 0) return 'امروز';
        return `${this.toPersianNum(Math.abs(days))} روز پیش`;
    }
}