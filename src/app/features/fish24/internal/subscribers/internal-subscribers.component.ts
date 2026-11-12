import { Component, computed, inject, signal } from '@angular/core';
import { BusinessUserPreviewService, BusinessUserRecord } from '../users/business-user-preview.service';
import { Fish24RolePreviewService } from '../../../../core/fish24/dev/fish24-role-preview.service';
import { Fish24PermissionService } from '../../../../core/fish24/permissions/fish24-permission.service';
import { FISH24_PERMISSIONS } from '../../../../core/fish24/permissions/fish24-permissions';
import { InternalListColumn, InternalListColumnSearches, InternalListSort, filterByInternalListColumns, nextInternalListSort, sortInternalListRows } from '../../../../shared/ui/data-list/internal-list.model';
import { InternalListPreferencesService } from '../../../../shared/ui/data-list/internal-list-preferences.service';
import { PlainXlsxService } from '../../../../shared/ui/data-list/plain-xlsx.service';

const LIST_ID = 'internal-subscribers';

@Component({
  selector: 'app-internal-subscribers',
  standalone: true,
  template: `
    <main class="mx-auto max-w-[96%] space-y-4" dir="rtl">
      <header><h1 class="text-2xl font-black text-primary">مشترکین</h1><p class="mt-1 text-sm text-muted">کاربران دارای اشتراک خبرنامه ایمیلی</p></header>
      <section class="rounded-2xl border border-border bg-surface overflow-hidden">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
          <h2 class="font-bold">فهرست مشترکین ({{ number(subscribers().length) }} رکورد)</h2>
          <div class="flex flex-wrap gap-2">
            <button type="button" (click)="chooserOpen.set(!chooserOpen())" [attr.aria-expanded]="chooserOpen()">انتخاب ستون‌ها</button>
            @if(canExport()) { <button type="button" (click)="exportRows()">خروجی Excel</button> }
          </div>
        </div>
        @if(chooserOpen()) {
          <div class="border-b border-border p-4">
            <div class="flex flex-wrap gap-4">
              @for(column of columns; track column.id) {
                <label class="flex items-center gap-2"><input type="checkbox" [checked]="visible(column.id)" [disabled]="visible(column.id) && selectedColumns().length === 1" (change)="toggleColumn(column.id, $event)">{{ column.label }}</label>
              }
            </div>
            <button class="mt-3" type="button" (click)="restoreColumns()">بازگردانی ستون‌های پیش‌فرض</button>
          </div>
        }
        <div class="overflow-x-auto">
          <table class="w-full min-w-[36rem] text-right text-sm">
            <thead><tr>
              @for(column of visibleColumns(); track column.id) {
                <th class="border-b border-border p-3" [attr.aria-sort]="sortState(column.id)">
                  <button class="w-full flex justify-between" type="button" (click)="sort(column.id)">{{column.label}} <span>{{sortMark(column.id)}}</span></button>
                  <input class="mt-2 w-full rounded-lg border border-border bg-background p-2 font-normal" type="search" [attr.aria-label]="'جستجو در '+column.label" [value]="searches()[column.id] || ''" (input)="search(column.id, $event)">
                </th>
              }
            </tr></thead>
            <tbody>
              @for(row of pageRows(); track row.id) {
                <tr class="hover:bg-primary/5">@for(column of visibleColumns(); track column.id) {<td class="border-b border-border p-3" [attr.dir]="column.ltr ? 'ltr' : 'rtl'">{{ column.value(row) || '—' }}</td>}</tr>
              } @empty {<tr><td class="p-8 text-center text-muted" [attr.colspan]="visibleColumns().length">{{ subscribers().length ? 'نتیجه‌ای برای جستجو یافت نشد.' : 'مشترکی ثبت نشده است.' }}</td></tr>}
            </tbody>
          </table>
        </div>
        @if(totalPages() > 1) {
          <nav class="flex items-center justify-center gap-3 p-4" aria-label="صفحه‌بندی مشترکین">
            <button type="button" [disabled]="currentPage() === 1" (click)="page.set(currentPage()-1)">قبلی</button>
            <span>صفحه {{number(currentPage())}} از {{number(totalPages())}}</span>
            <button type="button" [disabled]="currentPage() === totalPages()" (click)="page.set(currentPage()+1)">بعدی</button>
          </nav>
        }
      </section>
    </main>
  `,
  styles: [`button{min-height:2.5rem;border:1px solid rgb(var(--color-border));border-radius:.6rem;padding:.45rem .8rem;font-size:.8rem;font-weight:700}button:disabled{opacity:.45;cursor:not-allowed}td{overflow-wrap:anywhere;max-width:28rem}input:focus-visible,button:focus-visible{outline:2px solid rgb(var(--color-primary));outline-offset:2px}`]
})
export class InternalSubscribersComponent {
  private readonly users = inject(BusinessUserPreviewService);
  private readonly roles = inject(Fish24RolePreviewService);
  private readonly permissions = inject(Fish24PermissionService);
  private readonly prefs = inject(InternalListPreferencesService);
  private readonly xlsx = inject(PlainXlsxService);
  readonly columns: readonly InternalListColumn<BusinessUserRecord>[] = [
    { id: 'name', label: 'نام', value: row => row.fullName ?? '' },
    { id: 'mobile', label: 'موبایل', value: row => row.mobile, ltr: true },
    { id: 'email', label: 'ایمیل', value: row => row.email, ltr: true }
  ];
  private readonly columnIds = this.columns.map(column => column.id);
  readonly selectedColumns = signal<readonly string[]>(this.prefs.load(LIST_ID, this.columnIds, this.columnIds));
  readonly visibleColumns = computed(() => this.columns.filter(column => this.selectedColumns().includes(column.id)));
  readonly chooserOpen = signal(false);
  readonly searches = signal<InternalListColumnSearches>({});
  readonly tableSort = signal<InternalListSort>({ columnId: null, direction: null });
  readonly page = signal(1);
  readonly pageSize = 10;
  readonly canView = computed(() => this.permissions.hasPermission(this.roles.getPreviewRoles(), FISH24_PERMISSIONS.subscriberManagement));
  readonly canExport = computed(() => this.canView() && ['super-admin', 'sales-expert'].includes(this.roles.getPreviewRole()));
  // Membership follows the existing explicit preference, not account activity or email presence.
  readonly subscribers = computed(() => this.canView() ? this.users.users().filter(user => user.newsletterEmail) : []);
  readonly tableRows = computed(() => sortInternalListRows(filterByInternalListColumns(this.subscribers(), this.columns, this.selectedColumns(), this.searches()), this.columns, this.tableSort()));
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.tableRows().length / this.pageSize)));
  readonly currentPage = computed(() => Math.min(this.page(), this.totalPages()));
  readonly pageRows = computed(() => this.tableRows().slice((this.currentPage()-1)*this.pageSize, this.currentPage()*this.pageSize));

  number(value: number): string { return value.toLocaleString('fa-IR'); }
  visible(id: string): boolean { return this.selectedColumns().includes(id); }
  toggleColumn(id: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const next = checked ? [...this.selectedColumns(), id] : this.selectedColumns().filter(value => value !== id);
    if (!next.length) return;
    this.selectedColumns.set(this.prefs.save(LIST_ID, next, this.columnIds));
    if (!checked) this.searches.update(value => ({ ...value, [id]: '' }));
    this.page.set(1);
  }
  restoreColumns(): void {
    this.selectedColumns.set(this.prefs.reset(LIST_ID, this.columnIds, this.columnIds));
    this.searches.set({}); this.tableSort.set({ columnId: null, direction: null }); this.page.set(1);
  }
  search(id: string, event: Event): void {
    this.searches.update(value => ({ ...value, [id]: (event.target as HTMLInputElement).value })); this.page.set(1);
  }
  sort(id: string): void { this.tableSort.update(value => nextInternalListSort(value, id)); this.page.set(1); }
  sortMark(id: string): string { return this.tableSort().columnId === id ? this.tableSort().direction === 'asc' ? '↑' : '↓' : '↕'; }
  sortState(id: string): string { return this.tableSort().columnId === id ? this.tableSort().direction === 'asc' ? 'ascending' : 'descending' : 'none'; }
  exportRows(): void {
    if (!this.canExport()) return;
    const columns = this.visibleColumns();
    this.xlsx.export('fish24-subscribers.xlsx', columns.map(column => column.label),
      this.subscribers().map(row => columns.map(column => String(column.value(row) ?? ''))));
  }
}
