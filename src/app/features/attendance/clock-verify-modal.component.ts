import { Component, inject, output, signal, ElementRef, ViewChild, AfterViewInit, OnDestroy, HostListener } from '@angular/core';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { AttendanceService, CheckInMethod } from '../../core/attendance/attendance.service';

@Component({
  selector: 'app-clock-verify-modal',
  standalone: true,
  imports: [IconComponent],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-[100] flex items-center justify-center" (click)="close()">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"></div>

        <div class="relative w-full max-w-sm bg-surface dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden animate-scale-in max-h-[85vh] flex flex-col mx-4"
             (click)="$event.stopPropagation()">

          <!-- Compact Header -->
          <div class="flex items-center justify-between px-4 py-3 border-b border-border dark:border-slate-700">
            <h2 class="text-base font-extrabold text-foreground dark:text-white">
              {{ actionType() === 'in' ? 'ثبت ورود' : 'ثبت خروج' }}
            </h2>
            <button (click)="close()" class="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <ui-icon name="x" [size]="18" class="text-muted"></ui-icon>
            </button>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto p-4">

            @if (step() === 'choose') {
              <div class="space-y-2">
                <!-- Selfie + GPS -->
                <button (click)="startSelfieVerify()"
                        class="w-full flex items-center gap-3 p-3 rounded-xl border border-border dark:border-slate-700 hover:border-primary hover:bg-primary/5 transition-all group">
                  <div class="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors flex-shrink-0">
                    <ui-icon name="camera" [size]="18" class="text-primary group-hover:text-white"></ui-icon>
                  </div>
                  <div class="text-right flex-1 min-w-0">
                    <p class="text-sm font-bold text-foreground dark:text-slate-100">سلفی + موقعیت</p>
                    <p class="text-[10px] text-muted truncate">عکس + بررسی GPS محل کار</p>
                  </div>
                </button>

                <!-- GPS Only -->
                <button (click)="startGpsVerify()"
                        class="w-full flex items-center gap-3 p-3 rounded-xl border border-border dark:border-slate-700 hover:border-success hover:bg-success/5 transition-all group">
                  <div class="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center group-hover:bg-success group-hover:text-white transition-colors flex-shrink-0">
                    <ui-icon name="map-pin" [size]="18" class="text-success group-hover:text-white"></ui-icon>
                  </div>
                  <div class="text-right flex-1 min-w-0">
                    <p class="text-sm font-bold text-foreground dark:text-slate-100">موقعیت مکانی</p>
                    <p class="text-[10px] text-muted truncate">فقط GPS بدون عکس</p>
                  </div>
                </button>

                <!-- QR Code -->
                <button (click)="startQrVerify()"
                        class="w-full flex items-center gap-3 p-3 rounded-xl border border-border dark:border-slate-700 hover:border-info hover:bg-info/5 transition-all group">
                  <div class="w-9 h-9 rounded-lg bg-info/10 flex items-center justify-center group-hover:bg-info group-hover:text-white transition-colors flex-shrink-0">
                    <ui-icon name="qr-code" [size]="18" class="text-info group-hover:text-white"></ui-icon>
                  </div>
                  <div class="text-right flex-1 min-w-0">
                    <p class="text-sm font-bold text-foreground dark:text-slate-100">اسکن QR Code</p>
                    <p class="text-[10px] text-muted truncate">بارکد ورودی/خروجی</p>
                  </div>
                </button>

                <!-- WiFi Internal -->
                <button (click)="startWifiVerify()"
                        class="w-full flex items-center gap-3 p-3 rounded-xl border border-border dark:border-slate-700 hover:border-violet-500 hover:bg-violet-500/5 transition-all group">
                  <div class="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center group-hover:bg-violet-500 group-hover:text-white transition-colors flex-shrink-0">
                    <ui-icon name="wifi" [size]="18" class="text-violet-500 group-hover:text-white"></ui-icon>
                  </div>
                  <div class="text-right flex-1 min-w-0">
                    <p class="text-sm font-bold text-foreground dark:text-slate-100">وای‌فای داخلی</p>
                    <p class="text-[10px] text-muted truncate">احراز از طریق شبکه شرکت</p>
                  </div>
                </button>

                <!-- Quick (No Auth) -->
                <button (click)="quickRegister()"
                        class="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-border dark:border-slate-700 hover:border-muted hover:bg-muted/5 transition-all group">
                  <div class="w-9 h-9 rounded-lg bg-muted/10 flex items-center justify-center group-hover:bg-muted group-hover:text-white transition-colors flex-shrink-0">
                    <ui-icon name="zap" [size]="18" class="text-muted group-hover:text-white"></ui-icon>
                  </div>
                  <div class="text-right flex-1 min-w-0">
                    <p class="text-sm font-bold text-foreground dark:text-slate-100">ثبت بدون احراز هویت</p>
                    <p class="text-[10px] text-muted truncate">ثبت بدون احراز هویت</p>
                  </div>
                </button>
              </div>
            }

            @if (step() === 'loading') {
              <div class="flex flex-col items-center justify-center py-10 gap-3">
                <div class="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                <p class="text-sm font-bold text-foreground dark:text-slate-100">{{ loadingMessage() }}</p>
              </div>
            }

            @if (step() === 'selfie') {
              <div class="space-y-3">
                <div class="relative rounded-xl overflow-hidden bg-black aspect-[3/4]">
                  <video #videoEl autoplay playsinline muted class="w-full h-full object-cover mirror-camera"></video>
                  <div class="absolute top-2 right-2 px-2 py-0.5 bg-black/50 rounded-full text-white text-[10px] font-bold flex items-center gap-1">
                    <div class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                    دوربین
                  </div>
                </div>
                <button (click)="captureSelfie()"
                        class="w-full py-3 bg-primary text-white rounded-xl font-extrabold text-base hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                  <ui-icon name="camera" [size]="20"></ui-icon>
                  گرفتن عکس
                </button>
              </div>
            }

            @if (step() === 'qr') {
              <div class="space-y-3">
                <div class="relative rounded-xl overflow-hidden bg-black aspect-square">
                  <video #qrVideoEl autoplay playsinline muted class="w-full h-full object-cover"></video>
                  <div class="absolute inset-0 flex items-center justify-center">
                    <div class="w-40 h-40 border-2 border-white/80 rounded-xl relative">
                      <div class="absolute top-0 left-0 w-5 h-5 border-t-3 border-l-3 border-primary rounded-tl-lg"></div>
                      <div class="absolute top-0 right-0 w-5 h-5 border-t-3 border-r-3 border-primary rounded-tr-lg"></div>
                      <div class="absolute bottom-0 left-0 w-5 h-5 border-b-3 border-l-3 border-primary rounded-bl-lg"></div>
                      <div class="absolute bottom-0 right-0 w-5 h-5 border-b-3 border-r-3 border-primary rounded-br-lg"></div>
                      <div class="absolute top-1/2 left-0 right-0 h-0.5 bg-primary/50 animate-scan-line"></div>
                    </div>
                  </div>
                </div>
                <button (click)="manualQrInput()"
                        class="w-full py-2.5 border border-border dark:border-slate-700 rounded-xl font-bold text-xs text-muted hover:border-primary hover:text-primary transition-colors">
                  وارد کردن دستی کد
                </button>
              </div>
            }

            @if (step() === 'error') {
              <div class="flex flex-col items-center gap-3 py-6">
                <div class="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center">
                  <ui-icon name="alert-triangle" [size]="28" class="text-danger"></ui-icon>
                </div>
                <p class="text-base font-extrabold text-danger text-center px-4">{{ errorMessage() }}</p>
                @if (errorDistance() !== null) {
                  <p class="text-xs text-muted text-center">فاصله: <span class="font-bold dir-ltr text-foreground dark:text-slate-200">{{ errorDistance() }} km</span></p>
                }
                <button (click)="step.set('choose')"
                        class="px-6 py-2.5 bg-surface dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  تلاش مجدد
                </button>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scale-in { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
    @keyframes scan-line { 0%, 100% { top: 10%; } 50% { top: 90%; } }
    .animate-fade-in { animation: fade-in 0.2s ease-out; }
    .animate-scale-in { animation: scale-in 0.25s ease-out; }
    .animate-scan-line { animation: scan-line 2s ease-in-out infinite; }
    .mirror-camera { transform: scaleX(-1); }
  `]
})
export class ClockVerifyModalComponent implements AfterViewInit, OnDestroy {
  private attService = inject(AttendanceService);

  isOpen = signal(false);
  actionType = signal<'in' | 'out'>('in');
  step = signal<'choose' | 'loading' | 'selfie' | 'qr' | 'error'>('choose');
  loadingMessage = signal('');
  errorMessage = signal('');
  errorDistance = signal<number | null>(null);

  verified = output<{ method: CheckInMethod; location?: string; selfie?: string }>();
  closed = output<void>();

  @ViewChild('videoEl') videoEl!: ElementRef<HTMLVideoElement>;
  @ViewChild('qrVideoEl') qrVideoEl!: ElementRef<HTMLVideoElement>;

  private stream: MediaStream | null = null;
  private qrStream: MediaStream | null = null;
  private qrScanInterval: any = null;

  ngAfterViewInit(): void { }

  ngOnDestroy(): void {
    this.stopCamera();
    this.stopQrCamera();
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isOpen()) this.close();
  }

  open(type: 'in' | 'out'): void {
    this.actionType.set(type);
    this.step.set('choose');
    this.errorMessage.set('');
    this.errorDistance.set(null);
    this.isOpen.set(true);
  }

  close(): void {
    this.stopCamera();
    this.stopQrCamera();
    this.isOpen.set(false);
    this.closed.emit();
  }

  quickRegister(): void {
    this.verified.emit({ method: 'web' });
    this.close();
  }

  // ── WiFi Verification ──

  async startWifiVerify(): Promise<void> {
    this.step.set('loading');
    this.loadingMessage.set('در حال بررسی شبکه وای‌فای...');
    await new Promise(resolve => setTimeout(resolve, 1500));
    if (navigator.onLine) {
      this.verified.emit({ method: 'web', location: 'wifi-internal' });
      this.close();
    } else {
      this.showError('به شبکه وای‌فای شرکت متصل نیستید');
    }
  }

  // ── GPS Only ──

  async startGpsVerify(): Promise<void> {
    this.step.set('loading');
    this.loadingMessage.set('بررسی موقعیت مکانی...');
    try {
      const pos = await this.attService.verifyLocation();
      const result = this.attService.isWithinGeofence(pos.lat, pos.lng);
      if (result.inside) {
        this.verified.emit({ method: 'gps', location: `${pos.lat.toFixed(6)},${pos.lng.toFixed(6)}` });
        this.close();
      } else {
        this.showError('در محدوده محل کار نیستید', result.distanceKm);
      }
    } catch (e: any) {
      this.showError(e.message || 'خطا در دریافت موقعیت');
    }
  }

  // ── Selfie + GPS ──

  async startSelfieVerify(): Promise<void> {
    this.step.set('loading');
    this.loadingMessage.set('فعال‌سازی دوربین...');
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      });
      this.step.set('selfie');
      setTimeout(() => {
        if (this.videoEl?.nativeElement) this.videoEl.nativeElement.srcObject = this.stream;
      }, 100);
    } catch (e: any) {
      this.showError('دسترسی به دوربین رد شد');
    }
  }

  async captureSelfie(): Promise<void> {
    if (!this.videoEl?.nativeElement) return;
    const canvas = document.createElement('canvas');
    const video = this.videoEl.nativeElement;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')!.drawImage(video, 0, 0);
    const selfieData = canvas.toDataURL('image/jpeg', 0.6);

    this.stopCamera();
    this.step.set('loading');
    this.loadingMessage.set('بررسی موقعیت مکانی...');

    try {
      const pos = await this.attService.verifyLocation();
      const result = this.attService.isWithinGeofence(pos.lat, pos.lng);
      if (result.inside) {
        this.verified.emit({ method: 'selfie', location: `${pos.lat.toFixed(6)},${pos.lng.toFixed(6)}`, selfie: selfieData });
        this.close();
      } else {
        this.showError('در محدوده محل کار نیستید', result.distanceKm);
      }
    } catch (e: any) {
      this.showError(e.message || 'خطا در دریافت موقعیت');
    }
  }

  // ── QR Code ──

  async startQrVerify(): Promise<void> {
    this.step.set('loading');
    this.loadingMessage.set('فعال‌سازی دوربین...');
    try {
      this.qrStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      });
      this.step.set('qr');
      setTimeout(() => {
        if (this.qrVideoEl?.nativeElement) {
          this.qrVideoEl.nativeElement.srcObject = this.qrStream;
          this.startQrScanning();
        }
      }, 100);
    } catch (e: any) {
      this.showError('دسترسی به دوربین رد شد');
    }
  }

  private startQrScanning(): void {
    if ('BarcodeDetector' in window) {
      const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
      this.qrScanInterval = setInterval(async () => {
        if (!this.qrVideoEl?.nativeElement || this.step() !== 'qr') return;
        try {
          const barcodes = await detector.detect(this.qrVideoEl.nativeElement);
          if (barcodes.length > 0) {
            const validation = this.attService.validateQrCode(barcodes[0].rawValue);
            if (validation.valid) {
              clearInterval(this.qrScanInterval);
              this.stopQrCamera();
              this.verified.emit({ method: 'qrcode', location: validation.locationId });
              this.close();
            }
          }
        } catch { }
      }, 500);
    }
  }

  manualQrInput(): void {
    this.stopQrCamera();
    const code = prompt('کد QR را وارد کنید:');
    if (code) {
      const validation = this.attService.validateQrCode(code);
      if (validation.valid) {
        this.verified.emit({ method: 'qrcode', location: validation.locationId });
        this.close();
      } else {
        this.showError(validation.message);
      }
    } else {
      this.step.set('choose');
    }
  }

  // ── Helpers ──

  private showError(message: string, distance?: number): void {
    this.step.set('error');
    this.errorMessage.set(message);
    this.errorDistance.set(distance ?? null);
    this.stopCamera();
    this.stopQrCamera();
  }

  private stopCamera(): void {
    if (this.stream) { this.stream.getTracks().forEach(t => t.stop()); this.stream = null; }
  }

  private stopQrCamera(): void {
    if (this.qrStream) { this.qrStream.getTracks().forEach(t => t.stop()); this.qrStream = null; }
    if (this.qrScanInterval) { clearInterval(this.qrScanInterval); this.qrScanInterval = null; }
  }
}