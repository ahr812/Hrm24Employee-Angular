import { Component, inject } from '@angular/core';
import { ToastService } from './toast.service';
import { IconComponent } from '../icon/icon.component';

@Component({
    selector: 'app-toast',
    standalone: true,
    imports: [IconComponent],
    template: `
    <div class="fixed bottom-6 left-6 z-50 flex flex-col gap-3">
      @for (toast of toastService.toasts(); track toast.id) {
        <div 
          class="flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border animate-slide-in-left"
          [class]="toast.type === 'success' ? 'bg-success/10 border-success/20 text-success' : 'bg-danger/10 border-danger/20 text-danger'"
        >
          <ui-icon [name]="toast.type === 'success' ? 'check-circle' : 'x'" [size]="20" />
          <span class="text-sm font-medium">{{ toast.text }}</span>
          <button (click)="toastService.remove(toast.id)" class="mr-2 opacity-70 hover:opacity-100">
            <ui-icon name="x" [size]="16" />
          </button>
        </div>
      }
    </div>
  `,
    styles: [`
    @keyframes slide-in-left {
      from { transform: translateX(-100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    .animate-slide-in-left {
      animation: slide-in-left 0.3s ease-out forwards;
    }
  `]
})
export class ToastComponent {
    toastService = inject(ToastService);
}