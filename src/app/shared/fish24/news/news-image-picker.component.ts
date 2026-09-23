import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { IconComponent } from '../../ui/icon/icon.component';

@Component({
  selector: 'app-news-image-picker',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="space-y-3">
      <input #input [id]="inputId" class="sr-only" type="file" accept=".jpg,.jpeg,.png,.webp" aria-label="افزودن تصویر" (change)="select($event)">
      <div class="flex flex-wrap items-center gap-2">
        <button type="button" class="picker" (click)="input.click()"><ui-icon name="image" [size]="17"></ui-icon>{{ value ? 'جایگزینی تصویر' : 'افزودن تصویر' }}</button>
        @if (value) { <button type="button" class="remove" (click)="remove()"><ui-icon name="trash" [size]="16"></ui-icon>حذف تصویر</button> }
      </div>
      <p class="text-xs leading-6 text-muted">JPG، PNG یا WebP؛ حداکثر ۵ مگابایت</p>
      @if (error()) { <p role="alert" class="text-sm font-bold text-danger">{{ error() }}</p> }
      @if (value) { <img [src]="value" [alt]="alt || 'پیش‌نمایش تصویر'" class="max-h-52 w-full rounded-xl border border-border bg-background object-contain p-2 dark:border-slate-600"> }
    </div>
  `,
  styles: [`.picker,.remove{display:inline-flex;min-height:2.6rem;align-items:center;gap:.4rem;border-radius:.75rem;padding:.45rem .8rem;font-size:.78rem;font-weight:800;outline:none}.picker{border:1px solid rgb(var(--color-primary)/.3);background:rgb(var(--color-primary)/.1);color:rgb(var(--color-primary))}.remove{border:1px solid rgb(var(--color-danger)/.25);color:rgb(var(--color-danger))}.picker:focus-visible,.remove:focus-visible{box-shadow:0 0 0 3px rgb(var(--color-primary)/.2)}`]
})
export class NewsImagePickerComponent {
  @Input({ required: true }) inputId = '';
  @Input() value = '';
  @Input() alt = '';
  @Output() valueChange = new EventEmitter<string>();
  readonly error = signal('');

  select(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { this.error.set('فقط تصویر JPG، PNG یا WebP مجاز است.'); return; }
    if (file.size > 5 * 1024 * 1024) { this.error.set('حجم تصویر نباید بیشتر از ۵ مگابایت باشد.'); return; }
    const reader = new FileReader();
    reader.onload = () => { this.error.set(''); this.valueChange.emit(String(reader.result)); };
    reader.onerror = () => this.error.set('خواندن تصویر انجام نشد.');
    reader.readAsDataURL(file);
  }
  remove(): void { this.error.set(''); this.valueChange.emit(''); }
}
