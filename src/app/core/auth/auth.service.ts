import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';

export interface User {
    id: string;
    username: string;
    fullName: string;
    email: string;
    role: string;
    avatar: string;
    mobile: string;
}

export interface AuthSession {
    user: User;
    token: string;
    loginAt: string;
    expiresAt: string;
}

const MANAGER_ROLES = ['مدیر سیستم', 'مدیر عامل', 'مدیر منابع انسانی', 'سرپرست'];

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly SESSION_KEY = 'hrm24_session';
    private readonly USERS_KEY = 'hrm24_users';
    private readonly OTP_KEY = 'hrm24_otp';
    private readonly OTP_EXPIRY = 120000; // 2 minutes
    private readonly DEMO_OTP = '12345';

    private router = inject(Router);

    session = signal<AuthSession | null>(this.loadSession());

    isAuthenticated = computed(() => {
        const s = this.session();
        if (!s) return false;
        return new Date(s.expiresAt) > new Date();
    });

    currentUser = computed(() => {
        return this.session()?.user || null;
    });

    isManager = computed((): boolean => {
        const role = this.currentUser()?.role;
        if (!role) return false;
        return MANAGER_ROLES.includes(role);
    });

    canViewTeamAnalytics = computed((): boolean => {
        return this.isManager();
    });

    canViewPersonalAnalytics = computed((): boolean => {
        return this.isAuthenticated();
    });

    // ══════════════════════════════════════
    // Session Management
    // ══════════════════════════════════════
    private loadSession(): AuthSession | null {
        if (typeof localStorage === 'undefined') return null;
        try {
            const stored = localStorage.getItem(this.SESSION_KEY);
            if (!stored) return null;
            const session: AuthSession = JSON.parse(stored);
            if (new Date(session.expiresAt) <= new Date()) {
                localStorage.removeItem(this.SESSION_KEY);
                return null;
            }
            return session;
        } catch {
            return null;
        }
    }

    private saveSession(session: AuthSession): void {
        if (typeof localStorage === 'undefined') return;
        try {
            localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
        } catch (error) {
            console.error('Error saving session:', error);
        }
    }

    // ══════════════════════════════════════
    // User Management
    // ══════════════════════════════════════
    private getUsers(): { username: string; password: string; mobile: string; user: User }[] {
        if (typeof localStorage === 'undefined') return this.getDefaultUsers();
        try {
            const stored = localStorage.getItem(this.USERS_KEY);
            if (!stored) return this.getDefaultUsers();
            const parsed = JSON.parse(stored);
            // Migration: ensure all users have mobile field
            return parsed.map((u: any) => ({
                ...u,
                mobile: u.mobile || '',
                user: { ...u.user, mobile: u.user?.mobile || '' }
            }));
        } catch {
            return this.getDefaultUsers();
        }
    }

    private saveUsers(users: { username: string; password: string; mobile: string; user: User }[]): void {
        if (typeof localStorage === 'undefined') return;
        try {
            localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
        } catch (error) {
            console.error('Error saving users:', error);
        }
    }

    private getDefaultUsers(): { username: string; password: string; mobile: string; user: User }[] {
        return [
            {
                username: 'admin',
                password: 'admin123',
                mobile: '09123456789',
                user: {
                    id: 'user-1',
                    username: 'admin',
                    fullName: 'علی احمدی',
                    email: 'ali@hrm24.ir',
                    role: 'مدیر سیستم',
                    avatar: '',
                    mobile: '09123456789'
                }
            },
            {
                username: 'user',
                password: 'user123',
                mobile: '09987654321',
                user: {
                    id: 'user-2',
                    username: 'user',
                    fullName: 'سارا محمدی',
                    email: 'sara@hrm24.ir',
                    role: 'کارمند',
                    avatar: '',
                    mobile: '09987654321'
                }
            }
        ];
    }

    // ══════════════════════════════════════
    // Mobile Validation
    // ══════════════════════════════════════
    validateMobile(mobile: string): { valid: boolean; message: string } {
        const cleaned = mobile.trim();

        if (!cleaned) {
            return { valid: false, message: 'لطفاً شماره موبایل را وارد کنید.' };
        }

        const regex = /^(\+98|0)?9\d{9}$/;
        if (!regex.test(cleaned)) {
            return { valid: false, message: 'شماره موبایل نامعتبر است. فرمت صحیح: 09123456789' };
        }

        return { valid: true, message: '' };
    }

    normalizeMobile(mobile: string): string {
        let cleaned = mobile.trim();
        if (cleaned.startsWith('+98')) {
            cleaned = '0' + cleaned.substring(3);
        }
        if (cleaned.startsWith('9') && cleaned.length === 10) {
            cleaned = '0' + cleaned;
        }
        return cleaned;
    }

    // ══════════════════════════════════════
    // OTP - Demo Mode: Any valid mobile + fixed code 12345
    // ══════════════════════════════════════
    sendOTP(mobile: string): { success: boolean; message: string } {
        const validation = this.validateMobile(mobile);
        if (!validation.valid) {
            return { success: false, message: validation.message };
        }

        const normalizedMobile = this.normalizeMobile(mobile);

        // Store OTP data
        const otpData = {
            mobile: normalizedMobile,
            code: this.DEMO_OTP,
            createdAt: Date.now(),
            attempts: 0
        };

        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(this.OTP_KEY, JSON.stringify(otpData));
        }

        return {
            success: true,
            message: 'کد تأیید ارسال شد.'
        };
    }

    verifyOTP(mobile: string, code: string): { success: boolean; message: string } {
        const normalizedMobile = this.normalizeMobile(mobile);

        if (typeof localStorage === 'undefined') {
            return { success: false, message: 'خطای سیستم. لطفاً مجدداً تلاش کنید.' };
        }

        const stored = localStorage.getItem(this.OTP_KEY);
        if (!stored) {
            return { success: false, message: 'کد تأیید یافت نشد. لطفاً مجدداً درخواست دهید.' };
        }

        let otpData: { mobile: string; code: string; createdAt: number; attempts: number };
        try {
            otpData = JSON.parse(stored);
        } catch {
            return { success: false, message: 'خطای سیستم. لطفاً مجدداً تلاش کنید.' };
        }

        if (otpData.mobile !== normalizedMobile) {
            return { success: false, message: 'شماره موبایل مطابقت ندارد.' };
        }

        if (Date.now() - otpData.createdAt > this.OTP_EXPIRY) {
            localStorage.removeItem(this.OTP_KEY);
            return { success: false, message: 'کد تأیید منقضی شده است. لطفاً مجدداً درخواست دهید.' };
        }

        otpData.attempts++;
        if (otpData.attempts > 5) {
            localStorage.removeItem(this.OTP_KEY);
            return { success: false, message: 'تعداد تلاش بیش از حد مجاز است. لطفاً مجدداً کد دریافت کنید.' };
        }
        localStorage.setItem(this.OTP_KEY, JSON.stringify(otpData));

        if (otpData.code !== code.trim()) {
            return { success: false, message: 'کد تأیید اشتباه است.' };
        }

        localStorage.removeItem(this.OTP_KEY);
        return { success: true, message: 'تأیید با موفقیت انجام شد.' };
    }

    loginWithMobile(mobile: string): { success: boolean; message: string } {
        const normalizedMobile = this.normalizeMobile(mobile);

        // Demo mode: create/find user for any valid mobile
        const users = this.getUsers();
        let found = users.find(u => u.mobile === normalizedMobile);

        if (!found) {
            // Auto-create demo user for any new mobile number
            const newUser: User = {
                id: `user-${Date.now()}`,
                username: normalizedMobile,
                fullName: 'علی احمدی',
                email: '',
                role: 'کارمند',
                avatar: '',
                mobile: normalizedMobile
            };

            found = {
                username: normalizedMobile,
                password: '',
                mobile: normalizedMobile,
                user: newUser
            };

            users.push(found);
            this.saveUsers(users);
        }

        const session: AuthSession = {
            user: found.user,
            token: `token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            loginAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };

        this.session.set(session);
        this.saveSession(session);

        return { success: true, message: 'ورود با موفقیت انجام شد.' };
    }

    // ══════════════════════════════════════
    // Legacy Methods
    // ══════════════════════════════════════
    login(username: string, password: string): { success: boolean; message: string } {
        const users = this.getUsers();
        const found = users.find(u => u.username === username && u.password === password);

        if (!found) {
            return { success: false, message: 'نام کاربری یا رمز عبور اشتباه است.' };
        }

        const session: AuthSession = {
            user: found.user,
            token: `token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            loginAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };

        this.session.set(session);
        this.saveSession(session);

        return { success: true, message: 'ورود با موفقیت انجام شد.' };
    }

    register(username: string, password: string, fullName: string, email: string): { success: boolean; message: string } {
        const users = this.getUsers();

        if (users.find(u => u.username === username)) {
            return { success: false, message: 'این نام کاربری قبلاً ثبت شده است.' };
        }

        if (users.find(u => u.user.email === email)) {
            return { success: false, message: 'این ایمیل قبلاً ثبت شده است.' };
        }

        const newUser: User = {
            id: `user-${Date.now()}`,
            username,
            fullName,
            email,
            role: 'کارمند',
            avatar: '',
            mobile: ''
        };

        users.push({ username, password, mobile: '', user: newUser });
        this.saveUsers(users);

        return { success: true, message: 'ثبت‌نام با موفقیت انجام شد. اکنون وارد شوید.' };
    }

    logout(): void {
        this.session.set(null);
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem(this.SESSION_KEY);
            localStorage.removeItem(this.OTP_KEY);
        }
        this.router.navigate(['/login']);
    }

    changePassword(currentPassword: string, newPassword: string): { success: boolean; message: string } {
        const session = this.session();
        if (!session) return { success: false, message: 'لطفاً ابتدا وارد شوید.' };

        const users = this.getUsers();
        const userIndex = users.findIndex(u => u.username === session.user.username);

        if (userIndex === -1) {
            return { success: false, message: 'کاربر یافت نشد.' };
        }

        if (users[userIndex].password !== currentPassword) {
            return { success: false, message: 'رمز عبور فعلی اشتباه است.' };
        }

        users[userIndex].password = newPassword;
        this.saveUsers(users);

        return { success: true, message: 'رمز عبور با موفقیت تغییر کرد.' };
    }

    resetPassword(username: string, email: string): { success: boolean; message: string } {
        const users = this.getUsers();
        const found = users.find(u => u.username === username && u.user.email === email);

        if (!found) {
            return { success: false, message: 'نام کاربری یا ایمیل مطابقت ندارد.' };
        }

        const tempPassword = Math.random().toString(36).substr(2, 8);
        found.password = tempPassword;
        this.saveUsers(users);

        return { success: true, message: `رمز عبور موقت شما: ${tempPassword} (لطفاً پس از ورود تغییر دهید)` };
    }
}