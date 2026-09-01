import { Component, inject, HostListener, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { HeaderComponent } from './shared/layout/header/header.component';
import { SidebarComponent } from './shared/layout/sidebar/sidebar.component';
import { LayoutService } from './shared/layout/layout.service';
import { ToastComponent } from './shared/ui/toast/toast.component';
import { ThemeService } from './shared/layout/theme.service';
import { OrgContextBarComponent } from './shared/layout/org-context-bar/org-context-bar.component';
import { GlobalSearchComponent } from './shared/ui/global-search/global-search.component';
import { SearchService } from './core/search/search.service';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    HeaderComponent,
    SidebarComponent,
    ToastComponent,
    OrgContextBarComponent,
    GlobalSearchComponent
  ],
  template: `
    @if (isMainLayout) {
      <div class="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300 dark:bg-slate-900 dark:text-slate-100">
        
        <div class="sticky top-0 z-50 bg-surface border-b border-border shadow-sm dark:bg-slate-800 dark:border-slate-700">
          <app-header />
          <app-org-context-bar />
        </div>

        <div class="flex flex-1 relative">
          <aside 
            class="fixed top-[114px] bottom-0 right-0 z-40 w-full lg:w-64 bg-surface border-l border-border transform transition-transform duration-300 ease-in-out dark:bg-slate-800 dark:border-slate-700"
            [class.translate-x-full]="!layoutService.isSidebarOpen()"
            dir="rtl"
          >
            <app-sidebar />
          </aside>
          
          <main 
            class="flex-1 overflow-y-auto p-4 lg:p-6 transition-all duration-300"
            [style.margin-right.px]="getMainMargin()"
          >
            <router-outlet />
          </main>
        </div>

        <app-toast />
        <app-global-search />
      </div>
    } @else {
      <router-outlet />
    }
  `
})
export class AppComponent implements OnInit, OnDestroy {
  protected layoutService = inject(LayoutService);
  protected themeService = inject(ThemeService);
  protected searchService = inject(SearchService);
  private router = inject(Router);
  private lastWidth = window.innerWidth;
  private routerSub!: Subscription;
  private onlineHandler!: () => void;
  private offlineHandler!: () => void;

  constructor() {
    this.layoutService.openSidebar();
  }

  ngOnInit(): void {
    this.injectPrintStyles();
    this.setupAlertBanners();
    this.checkAll();

    this.routerSub = this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe(() => {
      const main = document.querySelector('main');
      if (main) main.scrollTo({ top: 0, behavior: 'smooth' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.checkAll();
    });
  }

  ngOnDestroy(): void {
    if (this.routerSub) this.routerSub.unsubscribe();
    window.removeEventListener('online', this.onlineHandler);
    window.removeEventListener('offline', this.offlineHandler);
  }

  private setupAlertBanners(): void {
    // Offline banner
    if (!document.getElementById('offline-banner')) {
      const offline = document.createElement('div');
      offline.id = 'offline-banner';
      offline.className = 'alert-banner';
      offline.style.cssText = 'display:none;position:fixed;left:0;right:0;z-index:100000;background:#ef4444;color:white;text-align:center;padding:8px 12px;font-family:Tahoma,sans-serif;font-size:clamp(11px,2.8vw,13px);font-weight:700;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.4;';
      offline.textContent = '⚠️ اینترنت قطع است — کلیک برای تلاش مجدد';
      offline.onclick = () => location.reload();
      document.body.prepend(offline);
    }

    // VPN banner — غیرمسدودکننده با دکمه بستن و بررسی مجدد
    if (!document.getElementById('vpn-banner')) {
      const vpn = document.createElement('div');
      vpn.id = 'vpn-banner';
      vpn.className = 'alert-banner';
      vpn.style.cssText = 'display:none;position:fixed;left:0;right:0;z-index:100000;background:#f59e0b;color:#1e293b;text-align:center;padding:8px 16px;font-family:Tahoma,sans-serif;font-size:clamp(11px,2.8vw,13px);font-weight:700;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.4;';
      vpn.innerHTML = '🛡️ احتمالاً VPN روشن است — لطفاً قطع کنید &nbsp;|&nbsp; <span id="vpn-dismiss" style="text-decoration:underline;cursor:pointer;">بستن</span>';

      // بستن بنر با کلیک روی "بستن"
      vpn.querySelector('#vpn-dismiss')?.addEventListener('click', (e) => {
        e.stopPropagation();
        vpn.style.display = 'none';
        sessionStorage.setItem('vpn_banner_dismissed', 'true');
        if ((window as any).repositionBanners) (window as any).repositionBanners();
      });

      // کلیک روی خود بنر نیز آن را ببندد
      vpn.addEventListener('click', () => {
        vpn.style.display = 'none';
        sessionStorage.setItem('vpn_banner_dismissed', 'true');
        if ((window as any).repositionBanners) (window as any).repositionBanners();
      });

      document.body.prepend(vpn);
    }

    this.onlineHandler = () => this.updateOfflineBanner();
    this.offlineHandler = () => this.updateOfflineBanner();
    window.addEventListener('online', this.onlineHandler);
    window.addEventListener('offline', this.offlineHandler);
  }

  private checkAll(): void {
    this.updateOfflineBanner();
    this.checkVPN();
  }

  private updateOfflineBanner(): void {
    const banner = document.getElementById('offline-banner');
    if (banner) {
      banner.style.display = navigator.onLine ? 'none' : 'block';
    }
    if ((window as any).repositionBanners) {
      (window as any).repositionBanners();
    }
  }

  /**
   * تشخیص VPN با رویکرد محافظه‌کارانه:
   * - اگر کاربر قبلاً بنر را بسته باشد، دیگر نمایش نده
   * - فقط زمانی هشدار بده که چندین نشانه همزمان وجود داشته باشد
   * - بنر غیرمسدودکننده است و کاربر می‌تواند آن را ببندد
   */
  private checkVPN(): void {
    const banner = document.getElementById('vpn-banner');
    if (!banner) return;

    // اگر کاربر قبلاً بنر را در این نشست بسته است، نمایش نده
    if (sessionStorage.getItem('vpn_banner_dismissed') === 'true') {
      banner.style.display = 'none';
      return;
    }

    // اگر تابع خارجی وجود دارد و نتیجه معتبر می‌دهد، استفاده کن
    if ((window as any).__checkVPN) {
      try {
        const result = (window as any).__checkVPN();
        // فقط اگر نتیجه صریحاً true بود نمایش بده
        if (result === true) {
          banner.style.display = 'block';
        } else {
          banner.style.display = 'none';
        }
      } catch {
        // در صورت خطا، بنر را نمایش نده
        banner.style.display = 'none';
      }
    } else {
      // بدون تابع خارجی، هرگز بنر VPN را نمایش نده
      // زیرا تشخیص VPN بدون ابزار اختصاصی غیرقابل اعتماد است
      banner.style.display = 'none';
    }

    if ((window as any).repositionBanners) {
      (window as any).repositionBanners();
    }
  }

  getMainMargin(): number {
    if (window.innerWidth >= 1024 && this.layoutService.isSidebarOpen()) {
      return 256;
    }
    return 0;
  }

  private injectPrintStyles(): void {
    if (document.getElementById('global-print-styles')) return;

    const style = document.createElement('style');
    style.id = 'global-print-styles';
    style.textContent = `
      @media print {
        @page { size: A4 landscape; margin: 0.5cm; }
        html, body { overflow: visible !important; height: auto !important; min-height: 0 !important; max-height: none !important; background: white !important; }
        div, main, aside, header, section, article { overflow: visible !important; height: auto !important; min-height: 0 !important; max-height: none !important; }
        aside { display: none !important; position: static !important; }
        .sticky { position: static !important; }
        main { overflow: visible !important; height: auto !important; padding: 0 !important; margin: 0 !important; width: 100% !important; max-width: none !important; }
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-shadow: none !important; }
        .dark, .dark * { background-color: white !important; color: black !important; }
      }
    `;
    document.head.appendChild(style);
  }

  @HostListener('window:resize')
  onResize() {
    const currentWidth = window.innerWidth;
    const prevWidth = this.lastWidth;
    this.lastWidth = currentWidth;

    const wasDesktop = prevWidth >= 1024;
    const isDesktop = currentWidth >= 1024;

    if (wasDesktop !== isDesktop) {
      this.layoutService.openSidebar();
    }
  }

  @HostListener('document:keydown.control.k', ['$event'])
  @HostListener('document:keydown.meta.k', ['$event'])
  handleSearchShortcut(event: Event): void {
    event.preventDefault();
    this.searchService.toggle();
  }

  get isMainLayout(): boolean {
    return !this.router.url.startsWith('/login') &&
      !this.router.url.startsWith('/register') &&
      !this.router.url.startsWith('/forgot-password');
  }
}