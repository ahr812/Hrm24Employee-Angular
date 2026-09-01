import { Injectable, signal, inject, NgZone } from '@angular/core';
import { ToastService } from '../../shared/ui/toast/toast.service';

@Injectable({ providedIn: 'root' })
export class NetworkService {
    private toastService = inject(ToastService);
    private zone = inject(NgZone);

    isOnline = signal(navigator.onLine);

    constructor() {
        window.addEventListener('online', () => {
            this.zone.run(() => {
                this.isOnline.set(true);
                this.toastService.show('اتصال اینترنت برقرار شد.', 'success');
                // Hide offline error if visible
                const el = document.getElementById('offline-error');
                if (el) el.style.display = 'none';
            });
        });

        window.addEventListener('offline', () => {
            this.zone.run(() => {
                this.isOnline.set(false);
                // Show offline error overlay
                const el = document.getElementById('offline-error');
                if (el) el.style.display = 'flex';
            });
        });
    }
}