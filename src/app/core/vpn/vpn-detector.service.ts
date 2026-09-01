
import { Injectable, inject, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../shared/ui/toast/toast.service';

@Injectable({ providedIn: 'root' })
export class VpnDetectorService {
    private http = inject(HttpClient);
    private toastService = inject(ToastService);
    private zone = inject(NgZone);

    check(): void {
        // Check WebRTC leak (common VPN detection method)
        this.checkWebRTC();
    }

    private checkWebRTC(): void {
        try {
            const RTCPeerConnection = (window as any).RTCPeerConnection ||
                (window as any).webkitRTCPeerConnection ||
                (window as any).mozRTCPeerConnection;

            if (!RTCPeerConnection) return;

            const pc = new RTCPeerConnection({ iceServers: [] });
            const ips = new Set<string>();

            pc.createDataChannel('');
            pc.createOffer().then((offer: any) => pc.setLocalDescription(offer));

            pc.onicecandidate = (event: any) => {
                if (!event || !event.candidate) {
                    // Done gathering candidates
                    this.evaluateIPs(ips);
                    pc.close();
                    return;
                }

                const parts = event.candidate.candidate.split(' ');
                const ip = parts[4];
                if (ip && !ip.endsWith('.local')) {
                    ips.add(ip);
                }
            };

            // Timeout after 3 seconds
            setTimeout(() => {
                this.evaluateIPs(ips);
                try { pc.close(); } catch { }
            }, 3000);
        } catch {
            // WebRTC not available or blocked
        }
    }

    private evaluateIPs(ips: Set<string>): void {
        // If multiple different IPs detected, likely VPN/proxy
        const uniqueIPs = Array.from(ips).filter(ip =>
            !ip.startsWith('0.') &&
            !ip.startsWith('127.') &&
            !ip.startsWith('::') &&
            ip !== '0.0.0.0'
        );

        if (uniqueIPs.length > 2) {
            this.zone.run(() => {
                const el = document.getElementById('vpn-warning');
                if (el) el.style.display = 'flex';
            });
        }
    }
}