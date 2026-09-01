import { Injectable, signal, computed } from '@angular/core';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'early-leave' | 'holiday' | 'leave' | 'mission' | 'remote' | 'break' | 'overtime' | 'forgot';
export type CheckInMethod = 'fingerprint' | 'face-id' | 'card' | 'gps' | 'manual' | 'web' | 'selfie' | 'qrcode';

export interface DailyAttendance {
    id: string;
    date: string;
    dayOfWeek: number;
    isWorkingDay: boolean;
    status: AttendanceStatus;
    checkInTime: string | null;
    checkOutTime: string | null;
    checkInMethod: CheckInMethod | null;
    checkOutMethod: CheckInMethod | null;
    lateMinutes: number;
    earlyLeaveMinutes: number;
    overtimeMinutes: number;
    workHours: number;
    breakMinutes: number;
    location: string | null;
    selfie: string | null;
    note: string;
}

export interface MonthlySummary {
    month: string;
    totalWorkingDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    earlyLeaveDays: number;
    leaveDays: number;
    holidayDays: number;
    missionDays: number;
    remoteDays: number;
    totalWorkHours: number;
    totalOvertimeHours: number;
    totalLateMinutes: number;
    totalEarlyLeaveMinutes: number;
    avgDailyHours: number;
    attendanceRate: number;
}

export interface AttendanceRule {
    workStartTime: string;
    workEndTime: string;
    lateThresholdMinutes: number;
    earlyLeaveThresholdMinutes: number;
    overtimeThresholdMinutes: number;
    breakDurationMinutes: number;
    workingDays: number[];
}

export interface GeofenceConfig {
    lat: number;
    lng: number;
    radiusMeters: number;
}

@Injectable({ providedIn: 'root' })
export class AttendanceService {
    private readonly STORAGE_KEY = 'hrm24_attendance_v2';
    private readonly RULES_KEY = 'hrm24_attendance_rules';
    private readonly OFFLINE_QUEUE_KEY = 'hrm24_offline_queue';

    readonly geofence = signal<GeofenceConfig>({
        lat: 35.6892, lng: 51.3890, radiusMeters: 500
    });

    records = signal<DailyAttendance[]>(this.loadRecords());
    rules = signal<AttendanceRule>(this.loadRules());
    lastAction = signal<{ time: string; label: string; type: 'success' | 'warning' } | null>(null);

    welcomeMessage = signal('');
    currentStreak = signal(0);

    constructor() {
        this.computeWelcome();
        this.computeStreak();
        this.syncOfflineQueue();
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => this.syncOfflineQueue());
        }
    }

    // ── Welcome Message ──

    private computeWelcome(): void {
        const now = new Date();
        const hour = now.getHours();
        let greeting = 'سلام';
        if (hour < 12) greeting = 'صبح بخیر';
        else if (hour < 17) greeting = 'ظهر بخیر';
        else greeting = 'عصر بخیر';

        const rec = this.todayRecord();
        const r = this.rules();

        if (!rec?.checkInTime) {
            this.welcomeMessage.set(`${greeting}! شیفت امروز: ${r.workStartTime} - ${r.workEndTime}`);
        } else if (!rec.checkOutTime) {
            this.welcomeMessage.set(`${greeting}! شما حاضر هستید.`);
        } else {
            this.welcomeMessage.set(`${greeting}! شیفت امروز تکمیل شده.`);
        }
    }

    // ── Streak Calculation ──

    private computeStreak(): void {
        const recs = this.records();
        let streak = 0;
        const today = new Date();

        for (let i = 0; i < 365; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = this.formatJalaliDate(d);
            const rec = recs.find(r => r.date === dateStr);

            if (!rec) {
                if (i === 0) continue;
                break;
            }

            const isPresent = ['present', 'late', 'early-leave', 'remote', 'overtime'].includes(rec.status);
            const isHoliday = rec.status === 'holiday';

            if (isPresent) {
                streak++;
            } else if (isHoliday) {
                continue;
            } else {
                if (i === 0) continue;
                break;
            }
        }

        this.currentStreak.set(streak);
    }

    // ── Offline Queue ──

    private getOfflineQueue(): any[] {
        try {
            const s = localStorage.getItem(this.OFFLINE_QUEUE_KEY);
            return s ? JSON.parse(s) : [];
        } catch { return []; }
    }

    private saveOfflineQueue(queue: any[]): void {
        try { localStorage.setItem(this.OFFLINE_QUEUE_KEY, JSON.stringify(queue)); } catch { }
    }

    addToOfflineQueue(action: { type: string; data: any; timestamp: number }): void {
        const queue = this.getOfflineQueue();
        queue.push(action);
        this.saveOfflineQueue(queue);
    }

    async syncOfflineQueue(): Promise<void> {
        if (typeof navigator !== 'undefined' && !navigator.onLine) return;
        const queue = this.getOfflineQueue();
        if (queue.length === 0) return;
        this.saveOfflineQueue([]);
    }

    isOffline(): boolean {
        return typeof navigator !== 'undefined' && !navigator.onLine;
    }

    // ── Anti-Passback Validation ──

    validateClockIn(): { valid: boolean; message: string } {
        const rec = this.todayRecord();
        if (rec?.checkInTime && !rec.checkOutTime) {
            return { valid: false, message: 'شما قبلاً ورود ثبت کرده‌اید. ابتدا خروج بزنید.' };
        }
        if (rec?.checkInTime && rec.checkOutTime) {
            return { valid: false, message: 'ورود و خروج امروز هر دو ثبت شده‌اند.' };
        }
        return { valid: true, message: '' };
    }

    validateClockOut(): { valid: boolean; message: string } {
        const rec = this.todayRecord();
        if (!rec?.checkInTime) {
            return { valid: false, message: 'ابتدا باید ورود ثبت شود.' };
        }
        if (rec.checkOutTime) {
            return { valid: false, message: 'خروج قبلاً ثبت شده است.' };
        }
        return { valid: true, message: '' };
    }

    // ── Duplicate Prevention ──

    validateLeave(): { valid: boolean; message: string } {
        const rec = this.todayRecord();
        if (rec?.checkInTime) {
            return { valid: false, message: 'امروز قبلاً ورود ثبت شده. نمی‌توان مرخصی اعلام کرد.' };
        }
        if (rec?.status === 'leave') {
            return { valid: false, message: 'مرخصی امروز قبلاً ثبت شده است.' };
        }
        return { valid: true, message: '' };
    }

    validateMission(): { valid: boolean; message: string } {
        const rec = this.todayRecord();
        if (rec?.checkInTime) {
            return { valid: false, message: 'امروز قبلاً ورود ثبت شده. نمی‌توان مأموریت اعلام کرد.' };
        }
        if (rec?.status === 'mission') {
            return { valid: false, message: 'مأموریت امروز قبلاً ثبت شده است.' };
        }
        return { valid: true, message: '' };
    }

    // ── Quick Note ──

    addQuickNote(note: string): { success: boolean; message: string } {
        const today = this.formatJalaliDate(new Date());
        const existing = this.records().find(r => r.date === today);
        if (!existing) return { success: false, message: 'رکورد امروز یافت نشد. ابتدا ورود ثبت کنید.' };

        const updatedNote = existing.note ? `${existing.note} | ${note}` : note;
        this.records.update(recs => recs.map(r => r.date === today ? { ...r, note: updatedNote } : r));
        this.saveRecords();
        this.setLastAction(`یادداشت: ${note.substring(0, 30)}...`, 'success');
        return { success: true, message: 'یادداشت ثبت شد.' };
    }

    getTodayNote(): string {
        return this.todayRecord()?.note || '';
    }

    // ── Weekly Comparison Stats ──

    weeklyComparison = computed(() => {
        const now = new Date();

        const currentStart = new Date(now);
        currentStart.setDate(now.getDate() - now.getDay());
        const currentEnd = new Date(currentStart);
        currentEnd.setDate(currentStart.getDate() + 6);

        const prevStart = new Date(currentStart);
        prevStart.setDate(currentStart.getDate() - 7);
        const prevEnd = new Date(prevStart);
        prevEnd.setDate(prevStart.getDate() + 6);

        const currentStr = this.formatJalaliDate(currentStart);
        const currentEndStr = this.formatJalaliDate(currentEnd);
        const prevStr = this.formatJalaliDate(prevStart);
        const prevEndStr = this.formatJalaliDate(prevEnd);

        const currentRecs = this.records().filter(r => r.date >= currentStr && r.date <= currentEndStr);
        const prevRecs = this.records().filter(r => r.date >= prevStr && r.date <= prevEndStr);

        const currentWorking = currentRecs.filter(r => r.isWorkingDay);
        const prevWorking = prevRecs.filter(r => r.isWorkingDay);

        const currentPresent = currentWorking.filter(r => ['present', 'late', 'early-leave', 'remote'].includes(r.status)).length;
        const prevPresent = prevWorking.filter(r => ['present', 'late', 'early-leave', 'remote'].includes(r.status)).length;

        const currentRate = currentWorking.length > 0 ? Math.round((currentPresent / currentWorking.length) * 100) : 0;
        const prevRate = prevWorking.length > 0 ? Math.round((prevPresent / prevWorking.length) * 100) : 0;

        const currentHours = Math.round(currentRecs.reduce((s, r) => s + r.workHours, 0) * 10) / 10;
        const prevHours = Math.round(prevRecs.reduce((s, r) => s + r.workHours, 0) * 10) / 10;

        const diff = currentRate - prevRate;

        return {
            currentRate,
            prevRate,
            currentHours,
            prevHours,
            currentPresent,
            prevPresent,
            diff,
            trend: diff > 0 ? 'up' as const : diff < 0 ? 'down' as const : 'same' as const
        };
    });

    // ── Export Helpers ──

    getCurrentMonthRecords(): DailyAttendance[] {
        const now = new Date();
        const year = this.formatJalaliDate(now).split('/')[0];
        const month = this.formatJalaliDate(now).split('/')[1];
        return this.records()
            .filter(r => { const p = r.date.split('/'); return p[0] === year && p[1] === month; })
            .sort((a, b) => a.date.localeCompare(b.date));
    }

    getCurrentMonthLabel(): string {
        const now = new Date();
        return now.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long' });
    }

    // ── Core Helpers ──

    private formatJalaliDate(date: Date): string {
        const parts = date.toLocaleDateString('fa-IR').split('/');
        const year = this.toEnglishDigits(parts[0]);
        const month = this.toEnglishDigits(parts[1]).padStart(2, '0');
        const day = this.toEnglishDigits(parts[2]).padStart(2, '0');
        return `${year}/${month}/${day}`;
    }

    private toEnglishDigits(s: string): string {
        return s.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());
    }

    private setLastAction(label: string, type: 'success' | 'warning' = 'success'): void {
        const now = new Date();
        const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        this.lastAction.set({ time, label, type });
    }

    currentMonthSummary = computed((): MonthlySummary => {
        const now = new Date();
        const currentYear = this.formatJalaliDate(now).split('/')[0];
        const currentMonth = this.formatJalaliDate(now).split('/')[1];
        const records = this.records().filter(r => {
            const parts = r.date.split('/');
            return parts[0] === currentYear && parts[1] === currentMonth;
        });
        const workingDays = records.filter(r => r.isWorkingDay);
        const presentDays = workingDays.filter(r => ['present', 'late', 'early-leave', 'remote'].includes(r.status));
        const totalWorkHours = presentDays.reduce((s, r) => s + r.workHours, 0);
        const totalOvertime = presentDays.reduce((s, r) => s + r.overtimeMinutes, 0);
        const totalLate = workingDays.reduce((s, r) => s + r.lateMinutes, 0);
        const totalEarly = workingDays.reduce((s, r) => s + r.earlyLeaveMinutes, 0);
        return {
            month: `${currentYear}/${currentMonth}`,
            totalWorkingDays: workingDays.length,
            presentDays: presentDays.length,
            absentDays: workingDays.filter(r => r.status === 'absent').length,
            lateDays: workingDays.filter(r => r.status === 'late').length,
            earlyLeaveDays: workingDays.filter(r => r.status === 'early-leave').length,
            leaveDays: records.filter(r => r.status === 'leave').length,
            holidayDays: records.filter(r => r.status === 'holiday').length,
            missionDays: records.filter(r => r.status === 'mission').length,
            remoteDays: workingDays.filter(r => r.status === 'remote').length,
            totalWorkHours: Math.round(totalWorkHours * 10) / 10,
            totalOvertimeHours: Math.round((totalOvertime / 60) * 10) / 10,
            totalLateMinutes: totalLate,
            totalEarlyLeaveMinutes: totalEarly,
            avgDailyHours: presentDays.length > 0 ? Math.round((totalWorkHours / presentDays.length) * 10) / 10 : 0,
            attendanceRate: workingDays.length > 0 ? Math.round((presentDays.length / workingDays.length) * 100) : 0
        };
    });

    todayRecord = computed(() => {
        const today = this.formatJalaliDate(new Date());
        return this.records().find(r => r.date === today) || null;
    });

    weeklyStats = computed(() => {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        const startStr = this.formatJalaliDate(startOfWeek);
        const endStr = this.formatJalaliDate(now);
        const records = this.records().filter(r => r.date >= startStr && r.date <= endStr);
        const workingDays = records.filter(r => r.isWorkingDay);
        const present = workingDays.filter(r => ['present', 'late', 'early-leave', 'remote'].includes(r.status)).length;
        return {
            totalDays: workingDays.length,
            presentDays: present,
            rate: workingDays.length > 0 ? Math.round((present / workingDays.length) * 100) : 0,
            totalHours: Math.round(records.reduce((s, r) => s + r.workHours, 0) * 10) / 10
        };
    });

    async verifyLocation(): Promise<{ lat: number; lng: number; accuracy: number }> {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) { reject(new Error('مرورگر از موقعیت‌یابی پشتیبانی نمی‌کند')); return; }
            navigator.geolocation.getCurrentPosition(
                (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
                (err) => { const msgs: Record<number, string> = { 1: 'دسترسی به موقعیت رد شد.', 2: 'موقعیت در دسترس نیست.', 3: 'زمان دریافت موقعیت تمام شد.' }; reject(new Error(msgs[err.code] || 'خطای نامشخص')); },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
            );
        });
    }

    getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
        return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 100) / 100;
    }

    isWithinGeofence(lat: number, lng: number): { inside: boolean; distanceKm: number } {
        const gf = this.geofence();
        const distanceKm = this.getDistanceKm(lat, lng, gf.lat, gf.lng);
        return { inside: distanceKm * 1000 <= gf.radiusMeters, distanceKm };
    }

    validateQrCode(data: string): { valid: boolean; message: string; locationId?: string } {
        try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'entry' || parsed.type === 'exit') return { valid: true, message: 'QR معتبر', locationId: parsed.id };
            return { valid: false, message: 'QR نامعتبر' };
        } catch {
            if (data.startsWith('hrm24-')) return { valid: true, message: 'QR معتبر', locationId: data };
            return { valid: false, message: 'QR قابل خواندن نیست' };
        }
    }

    checkInVerified(method: CheckInMethod, location?: string, selfie?: string): { success: boolean; message: string } {
        const validation = this.validateClockIn();
        if (!validation.valid) return { success: false, message: validation.message };

        const today = this.formatJalaliDate(new Date());
        const existing = this.records().find(r => r.date === today);
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const rule = this.rules();
        const [wh, wm] = rule.workStartTime.split(':').map(Number);
        const startMin = wh * 60 + wm;
        const nowMin = now.getHours() * 60 + now.getMinutes();
        const lateMin = nowMin > startMin + rule.lateThresholdMinutes ? nowMin - startMin : 0;
        const status: AttendanceStatus = lateMin > 0 ? 'late' : 'present';

        if (existing) {
            this.records.update(recs => recs.map(r => r.date === today ? { ...r, checkInTime: timeStr, checkInMethod: method, lateMinutes: lateMin, status, location: location || null, selfie: selfie || null } : r));
        } else {
            const newRec: DailyAttendance = {
                id: `att-${Date.now()}`, date: today, dayOfWeek: now.getDay(),
                isWorkingDay: rule.workingDays.includes(now.getDay()),
                status, checkInTime: timeStr, checkOutTime: null, checkInMethod: method, checkOutMethod: null,
                lateMinutes: lateMin, earlyLeaveMinutes: 0, overtimeMinutes: 0, workHours: 0, breakMinutes: 0,
                location: location || null, selfie: selfie || null, note: ''
            };
            this.records.update(recs => [newRec, ...recs]);
        }
        this.saveRecords();
        this.setLastAction(`ورود ${timeStr}${lateMin > 0 ? ` (${lateMin} دقیقه تأخیر)` : ''}`, lateMin > 0 ? 'warning' : 'success');
        this.computeWelcome();
        this.computeStreak();
        return { success: true, message: lateMin > 0 ? `ورود ثبت شد. ${lateMin} دقیقه تأخیر.` : 'ورود با موفقیت ثبت شد.' };
    }

    checkOutVerified(method: CheckInMethod, location?: string, selfie?: string): { success: boolean; message: string } {
        const validation = this.validateClockOut();
        if (!validation.valid) return { success: false, message: validation.message };

        const today = this.formatJalaliDate(new Date());
        const existing = this.records().find(r => r.date === today);
        if (!existing) return { success: false, message: 'رکورد امروز یافت نشد.' };

        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const rule = this.rules();
        const [eh, em] = rule.workEndTime.split(':').map(Number);
        const endMin = eh * 60 + em;
        const nowMin = now.getHours() * 60 + now.getMinutes();
        const earlyMin = nowMin < endMin - rule.earlyLeaveThresholdMinutes ? endMin - nowMin : 0;
        const overtimeMin = nowMin > endMin + rule.overtimeThresholdMinutes ? nowMin - endMin : 0;
        const [cih, cim] = existing.checkInTime!.split(':').map(Number);
        const workHrs = Math.max(0, Math.round(((nowMin - (cih * 60 + cim) - rule.breakDurationMinutes) / 60) * 100) / 100);
        let status = existing.status;
        if (earlyMin > 0) status = 'early-leave';

        this.records.update(recs => recs.map(r => r.date === today ? {
            ...r, checkOutTime: timeStr, checkOutMethod: method, earlyLeaveMinutes: earlyMin,
            overtimeMinutes: overtimeMin, workHours: workHrs, breakMinutes: rule.breakDurationMinutes,
            status, location: location || r.location, selfie: selfie || r.selfie
        } : r));
        this.saveRecords();
        let msg = 'خروج با موفقیت ثبت شد.';
        if (earlyMin > 0) msg += ` ${earlyMin} دقیقه زودتر.`;
        if (overtimeMin > 0) msg += ` ${overtimeMin} دقیقه اضافه‌کاری.`;
        this.setLastAction(`خروج ${timeStr}`, 'success');
        this.computeWelcome();
        this.computeStreak();
        return { success: true, message: msg };
    }

    markLeave(note?: string): { success: boolean; message: string } {
        const validation = this.validateLeave();
        if (!validation.valid) return { success: false, message: validation.message };

        const today = this.formatJalaliDate(new Date());
        const existing = this.records().find(r => r.date === today);
        const now = new Date();
        const rule = this.rules();
        const rec: DailyAttendance = {
            id: `att-${Date.now()}`, date: today, dayOfWeek: now.getDay(),
            isWorkingDay: rule.workingDays.includes(now.getDay()),
            status: 'leave', checkInTime: null, checkOutTime: null,
            checkInMethod: null, checkOutMethod: null,
            lateMinutes: 0, earlyLeaveMinutes: 0, overtimeMinutes: 0, workHours: 0, breakMinutes: 0,
            location: null, selfie: null, note: note || 'مرخصی روزانه'
        };
        if (existing) {
            this.records.update(recs => recs.map(r => r.date === today ? rec : r));
        } else {
            this.records.update(recs => [rec, ...recs]);
        }
        this.saveRecords();
        this.setLastAction('مرخصی روزانه اعلام شد', 'success');
        this.computeWelcome();
        return { success: true, message: 'مرخصی روزانه ثبت شد.' };
    }

    markMission(note?: string): { success: boolean; message: string } {
        const validation = this.validateMission();
        if (!validation.valid) return { success: false, message: validation.message };

        const today = this.formatJalaliDate(new Date());
        const existing = this.records().find(r => r.date === today);
        const now = new Date();
        const rule = this.rules();
        const rec: DailyAttendance = {
            id: `att-${Date.now()}`, date: today, dayOfWeek: now.getDay(),
            isWorkingDay: rule.workingDays.includes(now.getDay()),
            status: 'mission', checkInTime: null, checkOutTime: null,
            checkInMethod: null, checkOutMethod: null,
            lateMinutes: 0, earlyLeaveMinutes: 0, overtimeMinutes: 0, workHours: 0, breakMinutes: 0,
            location: null, selfie: null, note: note || 'مأموریت اداری'
        };
        if (existing) {
            this.records.update(recs => recs.map(r => r.date === today ? rec : r));
        } else {
            this.records.update(recs => [rec, ...recs]);
        }
        this.saveRecords();
        this.setLastAction('مأموریت اداری اعلام شد', 'success');
        this.computeWelcome();
        return { success: true, message: 'مأموریت اداری ثبت شد.' };
    }

    toggleBreak(): { success: boolean; message: string; isActive: boolean } {
        const today = this.formatJalaliDate(new Date());
        const existing = this.records().find(r => r.date === today);
        if (!existing?.checkInTime) return { success: false, message: 'ابتدا ورود ثبت شود.', isActive: false };
        if (existing.checkOutTime) return { success: false, message: 'امروز تکمیل شده.', isActive: false };
        const isOnBreak = existing.note.includes('break-active');
        const newNote = isOnBreak ? existing.note.replace('break-active', '') : existing.note + ' break-active';
        this.records.update(recs => recs.map(r => r.date === today ? { ...r, note: newNote.trim() } : r));
        this.saveRecords();
        if (isOnBreak) {
            this.setLastAction('پایان استراحت', 'success');
            return { success: true, message: 'استراحت پایان یافت.', isActive: false };
        } else {
            this.setLastAction('شروع استراحت', 'warning');
            return { success: true, message: 'استراحت شروع شد.', isActive: true };
        }
    }

    markForgot(yesterdayNote?: string): { success: boolean; message: string } {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const dateStr = this.formatJalaliDate(yesterday);
        const existing = this.records().find(r => r.date === dateStr);
        if (existing && !existing.checkInTime) {
            this.records.update(recs => recs.map(r => r.date === dateStr ? { ...r, status: 'present' as AttendanceStatus, note: (r.note || '') + ' [اصلاح فراموشی]' } : r));
            this.saveRecords();
            this.setLastAction('فراموشی دیروز اصلاح شد', 'success');
            this.computeStreak();
            return { success: true, message: 'رکورد دیروز به عنوان حاضر علامت‌گذاری شد.' };
        }
        return { success: false, message: 'رکورد دیروز یافت نشد یا قبلاً ثبت شده.' };
    }

    startOvertime(): { success: boolean; message: string } {
        const today = this.formatJalaliDate(new Date());
        const existing = this.records().find(r => r.date === today);
        if (!existing?.checkInTime) return { success: false, message: 'ابتدا ورود ثبت شود.' };
        if (existing.checkOutTime) return { success: false, message: 'امروز تکمیل شده.' };
        this.records.update(recs => recs.map(r => r.date === today ? { ...r, note: (r.note || '') + ' overtime-requested', status: 'overtime' as AttendanceStatus } : r));
        this.saveRecords();
        this.setLastAction('اضافه‌کاری شروع شد', 'warning');
        return { success: true, message: 'اضافه‌کاری ثبت شد.' };
    }

    checkIn(method: CheckInMethod, location?: string): { success: boolean; message: string } { return this.checkInVerified(method, location); }
    checkOut(method: CheckInMethod, location?: string): { success: boolean; message: string } { return this.checkOutVerified(method, location); }

    updateRules(rules: Partial<AttendanceRule>): void { this.rules.update(r => ({ ...r, ...rules })); this.saveRules(); }

    getStatusLabel(status: AttendanceStatus): string {
        const map: Record<string, string> = { present: 'حاضر', absent: 'غایب', late: 'تأخیر', 'early-leave': 'تعجیل', holiday: 'تعطیل', leave: 'مرخصی', mission: 'مأموریت', remote: 'دورکاری', break: 'استراحت', overtime: 'اضافه‌کاری', forgot: 'فراموشی' };
        return map[status] || status;
    }

    getStatusBadgeClass(status: AttendanceStatus): string {
        const map: Record<string, string> = { present: 'bg-success/10 text-success', absent: 'bg-danger/10 text-danger', late: 'bg-warning/10 text-warning', 'early-leave': 'bg-warning/10 text-warning', holiday: 'bg-muted/10 text-muted', leave: 'bg-info/10 text-info', mission: 'bg-primary/10 text-primary', remote: 'bg-info/10 text-info', break: 'bg-violet-500/10 text-violet-500', overtime: 'bg-violet-500/10 text-violet-500', forgot: 'bg-orange-500/10 text-orange-500' };
        return map[status] || 'bg-muted/10 text-muted';
    }

    getMethodLabel(method: CheckInMethod): string {
        return { fingerprint: 'اثر انگشت', 'face-id': 'تشخیص چهره', card: 'کارت', gps: 'GPS', manual: 'دستی', web: 'وب', selfie: 'سلفی', qrcode: 'QR Code' }[method];
    }

    formatMinutes(minutes: number): string {
        const h = Math.floor(minutes / 60); const m = minutes % 60;
        if (h > 0 && m > 0) return `${h} ساعت و ${m} دقیقه`;
        if (h > 0) return `${h} ساعت`;
        return `${m} دقیقه`;
    }

    isOnBreak(): boolean { return !!this.todayRecord()?.note?.includes('break-active'); }

    private loadRecords(): DailyAttendance[] {
        if (typeof localStorage === 'undefined') return this.getDefaultRecords();
        try { const s = localStorage.getItem(this.STORAGE_KEY); if (!s) return this.getDefaultRecords(); return JSON.parse(s).map((r: any) => ({ ...r, date: this.normalizeDate(r.date), selfie: r.selfie || null })); } catch { return this.getDefaultRecords(); }
    }

    private loadRules(): AttendanceRule {
        if (typeof localStorage === 'undefined') return this.getDefaultRules();
        try { const s = localStorage.getItem(this.RULES_KEY); return s ? JSON.parse(s) : this.getDefaultRules(); } catch { return this.getDefaultRules(); }
    }

    private saveRecords(): void { if (typeof localStorage !== 'undefined') try { localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.records())); } catch { } }
    private saveRules(): void { if (typeof localStorage !== 'undefined') try { localStorage.setItem(this.RULES_KEY, JSON.stringify(this.rules())); } catch { } }

    private normalizeDate(dateStr: string): string {
        const en = this.toEnglishDigits(dateStr); const parts = en.split('/');
        if (parts.length !== 3) return dateStr;
        return `${parts[0].padStart(4, '0')}/${parts[1].padStart(2, '0')}/${parts[2].padStart(2, '0')}`;
    }

    private getDefaultRules(): AttendanceRule {
        return { workStartTime: '08:00', workEndTime: '17:00', lateThresholdMinutes: 15, earlyLeaveThresholdMinutes: 15, overtimeThresholdMinutes: 30, breakDurationMinutes: 60, workingDays: [0, 1, 2, 3, 4] };
    }

    private getDefaultRecords(): DailyAttendance[] {
        const records: DailyAttendance[] = [];
        const now = new Date();
        for (let i = 30; i >= 0; i--) {
            const d = new Date(now); d.setDate(d.getDate() - i);
            const dayOfWeek = d.getDay();
            const isWorking = this.getDefaultRules().workingDays.includes(dayOfWeek);
            const dateStr = this.formatJalaliDate(d);
            let status: AttendanceStatus = 'holiday'; let checkIn: string | null = null, checkOut: string | null = null;
            let lateMin = 0, earlyMin = 0, overtimeMin = 0, workHrs = 0;
            if (isWorking) {
                const rand = Math.random();
                if (rand < 0.7) { status = 'present'; checkIn = '07:5' + Math.floor(Math.random() * 10); checkOut = '17:0' + Math.floor(Math.random() * 10); workHrs = 8 + Math.random() * 0.5; }
                else if (rand < 0.82) { status = 'late'; lateMin = 15 + Math.floor(Math.random() * 30); checkIn = `08:${String(15 + Math.floor(Math.random() * 30)).padStart(2, '0')}`; checkOut = '17:00'; workHrs = 8 - lateMin / 60; }
                else if (rand < 0.9) { status = 'early-leave'; earlyMin = 15 + Math.floor(Math.random() * 30); checkIn = '08:00'; checkOut = `16:${String(30 - Math.floor(Math.random() * 15)).padStart(2, '0')}`; workHrs = 8 - earlyMin / 60; }
                else if (rand < 0.95) { status = 'leave'; } else { status = 'absent'; }
            }
            records.push({ id: `att-${Date.now()}-${i}`, date: dateStr, dayOfWeek, isWorkingDay: isWorking, status, checkInTime: checkIn, checkOutTime: checkOut, checkInMethod: checkIn ? 'web' : null, checkOutMethod: checkOut ? 'web' : null, lateMinutes: lateMin, earlyLeaveMinutes: earlyMin, overtimeMinutes: overtimeMin, workHours: Math.round(workHrs * 100) / 100, breakMinutes: isWorking && status !== 'absent' && status !== 'leave' ? 60 : 0, location: null, selfie: null, note: '' });
        }
        return records;
    }
}