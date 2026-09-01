import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
    id: number;
    text: string;
    type: 'success' | 'error';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
    toasts = signal<ToastMessage[]>([]);

    show(text: string, type: 'success' | 'error' = 'success') {
        const id = Date.now();
        this.toasts.update(list => [...list, { id, text, type }]);

        // حذف خودکار پس از 3 ثانیه
        setTimeout(() => {
            this.remove(id);
        }, 3000);
    }

    remove(id: number) {
        this.toasts.update(list => list.filter(t => t.id !== id));
    }
}