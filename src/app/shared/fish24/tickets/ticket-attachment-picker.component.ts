import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IconComponent } from '../../ui/icon/icon.component';

@Component({
  selector: 'app-ticket-attachment-picker',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="mt-4 space-y-3" dir="rtl">
      <div class="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-border bg-background/50 p-3 dark:border-slate-600 dark:bg-slate-900/40">
        <input
          #fileInput
          [id]="inputId"
          type="file"
          multiple
          class="sr-only"
          accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.zip"
          aria-label="افزودن فایل"
          (change)="select($event)">
        <button
          type="button"
          class="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-primary/25 bg-primary/10 px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:ring-offset-slate-800"
          (click)="fileInput.click()">
          <ui-icon name="paperclip" [size]="18"></ui-icon>
          افزودن فایل
        </button>
        <p class="min-w-0 flex-1 text-xs leading-6 text-muted">حداکثر ۵ فایل؛ هر فایل تا ۱۰ مگابایت. تصویر، PDF، Word، Excel و ZIP مجاز است.</p>
      </div>

      @if (errorMessage) {
        <p role="alert" class="text-sm font-bold text-danger">{{ errorMessage }}</p>
      }

      @if (files.length) {
        <ul class="grid min-w-0 gap-2 sm:grid-cols-2" aria-label="فایل‌های انتخاب‌شده">
          @for (file of files; track file.name + file.size + $index) {
            <li class="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-surface p-3 dark:border-slate-600 dark:bg-slate-800">
              <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><ui-icon name="file" [size]="17"></ui-icon></span>
              <span class="min-w-0 flex-1">
                <span class="block break-all text-sm font-bold text-foreground dark:text-slate-100">{{ file.name }}</span>
                <span class="mt-1 block text-xs text-muted">{{ formatSize(file.size) }}</span>
              </span>
              <button
                type="button"
                class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-danger transition-colors hover:bg-danger/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
                [attr.aria-label]="'حذف فایل ' + file.name"
                (click)="removeFile.emit($index)">
                <ui-icon name="x" [size]="17"></ui-icon>
              </button>
            </li>
          }
        </ul>
      }
    </div>
  `
})
export class TicketAttachmentPickerComponent {
  @Input({ required: true }) inputId = '';
  @Input() files: readonly File[] = [];
  @Input() errorMessage = '';
  @Output() filesSelected = new EventEmitter<readonly File[]>();
  @Output() removeFile = new EventEmitter<number>();

  select(event: Event): void {
    const input = event.target as HTMLInputElement;
    const selected = Array.from(input.files ?? []);
    if (selected.length) this.filesSelected.emit(selected);
    input.value = '';
  }

  formatSize(size: number): string {
    return size < 1024 * 1024 ? `${Math.max(1, Math.ceil(size / 1024))} کیلوبایت` : `${(size / 1024 / 1024).toFixed(1)} مگابایت`;
  }
}
