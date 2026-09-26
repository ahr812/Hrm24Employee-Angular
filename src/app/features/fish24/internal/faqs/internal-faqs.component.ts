import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Fish24Faq, Fish24FaqPreviewService } from '../../../../core/fish24/faqs/fish24-faq-preview.service';
import { Fish24RolePreviewService } from '../../../../core/fish24/dev/fish24-role-preview.service';
import { InternalListColumn, InternalListColumnSearches, InternalListSort, filterByInternalListColumns, nextInternalListSort, sortInternalListRows } from '../../../../shared/ui/data-list/internal-list.model';
import { InternalListPreferencesService } from '../../../../shared/ui/data-list/internal-list-preferences.service';
import { PlainXlsxService } from '../../../../shared/ui/data-list/plain-xlsx.service';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { ToastService } from '../../../../shared/ui/toast/toast.service';

const LIST_ID = 'internal-faqs';

@Component({
  selector: 'app-internal-faqs',
  standalone: true,
  imports: [FormsModule, IconComponent],
  template: `
    <div class="mx-auto max-w-[96%] space-y-4 animate-fade-in-up sm:space-y-5" dir="rtl">
      <header class="flex items-center gap-3"><span class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10"><ui-icon name="help-circle" [size]="25" class="text-primary"></ui-icon></span><div><h1 class="text-2xl font-black text-primary sm:text-3xl">مدیریت سؤالات متداول</h1><p class="text-sm text-muted">ثبت و مرتب‌سازی سؤال و پاسخ‌های راهنما</p></div></header>

      <section class="card overflow-hidden">
        <div class="flex flex-col gap-3 border-b border-border p-4 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
          <h2 class="text-lg font-extrabold">لیست سؤالات متداول ({{ number(service.faqs().length) }} رکورد)</h2>
          <div class="flex flex-wrap gap-2"><button type="button" class="primary" (click)="openCreate()">جدید</button><button type="button" class="toolbar" (click)="columnChooserOpen.set(!columnChooserOpen())">انتخاب ستون‌ها</button><button type="button" class="toolbar" (click)="exportRows()" [disabled]="!canExport()" [title]="canExport()?'خروجی Excel':'نقش پشتیبانی مجوز خروجی Excel ندارد'">خروجی Excel</button></div>
        </div>
        @if(columnChooserOpen()) {<div class="border-b border-border bg-background p-4 dark:border-slate-700"><div class="flex flex-wrap gap-3">@for(column of columns;track column.id){<label class="flex items-center gap-2 text-sm font-bold"><input type="checkbox" [checked]="visible(column.id)" [disabled]="onlyVisible(column.id)" (change)="toggleColumn(column.id,$event)">{{column.label}}</label>}</div><button type="button" class="secondary mt-3" (click)="restoreColumns()">بازگردانی ستون‌های پیش‌فرض</button></div>}
        <div class="overflow-x-auto"><table class="w-full min-w-max border-collapse text-right text-sm"><thead><tr class="bg-background">@for(column of visibleColumns();track column.id){<th class="border-b border-border px-3 py-3 align-top dark:border-slate-700" [style.min-width]="column.minWidth"><button type="button" class="flex w-full items-center justify-between gap-2 font-extrabold" (click)="sort(column.id)"><span>{{column.label}}</span><span class="text-muted">{{sortMark(column.id)}}</span></button><input class="header-search mt-2" [value]="columnSearches()[column.id]||''" (input)="searchColumn(column.id,value($event))" [attr.aria-label]="'جستجو در '+column.label"></th>}<th class="border-b border-border px-3 py-3 dark:border-slate-700">عملیات</th></tr></thead>
          <tbody>@for(row of pageRows();track row.id){<tr class="hover:bg-primary/5">@for(column of visibleColumns();track column.id){<td class="max-w-[34rem] border-b border-border px-3 py-3 align-top dark:border-slate-700">@switch(column.id){@case('question'){<span class="literal-text font-bold">{{row.question}}</span>}@case('answer'){<span class="literal-text">{{row.answer}}</span>}@case('status'){<span [class]="row.active?'status-active':'status-inactive'">{{row.active?'فعال':'غیرفعال'}}</span>}@default{<span [attr.dir]="column.ltr?'ltr':null">{{cellValue(column,row)}}</span>}}</td>}<td class="border-b border-border px-3 py-3 align-top dark:border-slate-700"><div class="flex flex-wrap gap-2"><button type="button" class="action" (click)="openEdit(row)">ویرایش</button><button type="button" class="action" (click)="toggle(row)">{{row.active?'غیرفعال‌کردن':'فعال‌کردن'}}</button><button type="button" class="danger" (click)="remove(row)">حذف</button></div></td></tr>}@empty{<tr><td [attr.colspan]="visibleColumns().length+1" class="p-8 text-center text-muted">سؤالی یافت نشد.</td></tr>}</tbody></table></div>
        @if(totalPages()>1){<div class="flex items-center justify-center gap-3 border-t border-border p-4 dark:border-slate-700"><button class="secondary" type="button" [disabled]="page()===1" (click)="page.set(page()-1)">قبلی</button><span class="text-sm font-bold">صفحه {{number(page())}} از {{number(totalPages())}}</span><button class="secondary" type="button" [disabled]="page()===totalPages()" (click)="page.set(page()+1)">بعدی</button></div>}
      </section>

      @if(editorOpen()){<div class="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/55 p-3" role="dialog" aria-modal="true" aria-labelledby="faq-editor-title"><form class="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-surface p-4 shadow-2xl dark:bg-slate-800 sm:p-6" (submit)="save($event)"><div class="flex items-center justify-between gap-3"><h2 id="faq-editor-title" class="text-xl font-black">{{editingId()===null?'سؤال جدید':'ویرایش سؤال'}}</h2><button type="button" class="icon-button" aria-label="بستن" (click)="closeEditor()">×</button></div><div class="mt-5 grid gap-4"><label class="label">سؤال<textarea class="input min-h-20 py-2" name="question" [(ngModel)]="draft.question"></textarea></label><label class="label">پاسخ<textarea class="input min-h-32 py-2" name="answer" [(ngModel)]="draft.answer"></textarea></label><label class="label sm:max-w-48">ترتیب نمایش<input class="input" name="displayOrder" inputmode="numeric" dir="ltr" [(ngModel)]="draft.displayOrder"></label></div>@if(formError()){<p role="alert" class="mt-3 rounded-xl bg-danger/10 p-3 text-sm font-bold text-danger">{{formError()}}</p>}<div class="mt-5 flex justify-end gap-2"><button type="button" class="secondary" (click)="closeEditor()">انصراف</button><button type="submit" class="primary" [disabled]="submitting()">{{submitting()?'در حال ذخیره…':'ذخیره'}}</button></div></form></div>}
    </div>
  `,
  styles: [`
    .card{border:1px solid rgb(var(--color-border));border-radius:1rem;background:rgb(var(--color-surface));box-shadow:0 1px 3px rgb(15 23 42/.08)}
    .primary,.secondary,.toolbar,.action,.danger,.icon-button{display:inline-flex;min-height:2.55rem;align-items:center;justify-content:center;gap:.4rem;border-radius:.7rem;padding-inline:.9rem;font-size:.78rem;font-weight:800}.primary{background:rgb(var(--color-primary));color:#fff}.secondary,.toolbar,.action,.icon-button{border:1px solid rgb(var(--color-border));background:rgb(var(--color-surface))}.danger{border:1px solid rgb(var(--color-danger)/.3);color:rgb(var(--color-danger))}
    .label{display:flex;flex-direction:column;gap:.4rem;font-size:.75rem;font-weight:800}.input,.header-search{width:100%;border:1px solid rgb(var(--color-border));border-radius:.65rem;background:rgb(var(--color-background));padding:.68rem .8rem;outline:none}.input:focus,.header-search:focus{border-color:rgb(var(--color-primary))}.header-search{min-width:7rem;padding:.45rem .55rem;font-size:.72rem;font-weight:500}.literal-text{display:block;white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.8}.status-active,.status-inactive{display:inline-flex;border-radius:999px;padding:.3rem .7rem;font-size:.7rem;font-weight:800}.status-active{background:rgb(var(--color-success)/.15);color:rgb(var(--color-success))}.status-inactive{background:rgb(var(--color-muted)/.15);color:rgb(var(--color-muted))}button:disabled{cursor:not-allowed;opacity:.45}
  `]
})
export class InternalFaqsComponent {
  readonly service = inject(Fish24FaqPreviewService);
  private readonly roles = inject(Fish24RolePreviewService);
  private readonly prefs = inject(InternalListPreferencesService);
  private readonly xlsx = inject(PlainXlsxService);
  private readonly toast = inject(ToastService);
  readonly page = signal(1); readonly pageSize = 10; readonly columnChooserOpen = signal(false); readonly editorOpen = signal(false); readonly editingId = signal<number | null>(null); readonly formError = signal(''); readonly submitting = signal(false);
  draft = { question: '', answer: '', displayOrder: '0' };
  readonly columnSearches = signal<InternalListColumnSearches>({}); readonly tableSort = signal<InternalListSort>({ columnId: null, direction: null });
  readonly columns: readonly InternalListColumn<Fish24Faq>[] = [
    {id:'id',label:'شناسه',value:r=>String(r.id),exportValue:r=>String(r.id),minWidth:'6rem',ltr:true},
    {id:'question',label:'سؤال',value:r=>r.question,minWidth:'20rem'},
    {id:'answer',label:'پاسخ',value:r=>r.answer,minWidth:'28rem'},
    {id:'displayOrder',label:'ترتیب',value:r=>r.displayOrder,minWidth:'7rem'},
    {id:'status',label:'وضعیت',value:r=>r.active?'فعال':'غیرفعال',minWidth:'8rem'}
  ];
  readonly allColumnIds=this.columns.map(column=>column.id); readonly defaultColumnIds=[...this.allColumnIds];
  readonly selectedColumns=signal<readonly string[]>(this.prefs.load(LIST_ID,this.allColumnIds,this.defaultColumnIds));
  readonly visibleColumns=computed(()=>this.columns.filter(column=>this.selectedColumns().includes(column.id)));
  readonly tableRows=computed(()=>sortInternalListRows(filterByInternalListColumns(this.service.faqs(),this.columns,this.selectedColumns(),this.columnSearches()),this.columns,this.tableSort()));
  readonly pageRows=computed(()=>this.tableRows().slice((this.page()-1)*this.pageSize,this.page()*this.pageSize));
  readonly totalPages=computed(()=>Math.max(1,Math.ceil(this.tableRows().length/this.pageSize)));

  canExport(){return this.service.canExport(this.roles.getPreviewRole());} visible(id:string){return this.selectedColumns().includes(id);} onlyVisible(id:string){return this.visible(id)&&this.selectedColumns().length===1;} value(e:Event){return(e.target as HTMLInputElement).value;} number(v:number){return new Intl.NumberFormat('fa-IR').format(v);} cellValue(column:InternalListColumn<Fish24Faq>,row:Fish24Faq){return column.value(row);}
  toggleColumn(id:string,e:Event){const checked=(e.target as HTMLInputElement).checked;const next=checked?[...this.selectedColumns(),id]:this.selectedColumns().filter(item=>item!==id);if(!next.length)return;this.selectedColumns.set(this.prefs.save(LIST_ID,next,this.allColumnIds));if(!checked)this.searchColumn(id,'');}
  restoreColumns(){this.selectedColumns.set(this.prefs.reset(LIST_ID,this.allColumnIds,this.defaultColumnIds));this.columnSearches.set({});this.tableSort.set({columnId:null,direction:null});}
  searchColumn(id:string,query:string){this.columnSearches.update(value=>({...value,[id]:query}));this.page.set(1);} sort(id:string){this.tableSort.update(value=>nextInternalListSort(value,id));} sortMark(id:string){const sort=this.tableSort();return sort.columnId===id?(sort.direction==='asc'?'↑':'↓'):'↕';}
  openCreate(){this.editingId.set(null);this.draft={question:'',answer:'',displayOrder:'0'};this.formError.set('');this.editorOpen.set(true);}
  openEdit(row:Fish24Faq){this.editingId.set(row.id);this.draft={question:row.question,answer:row.answer,displayOrder:String(row.displayOrder)};this.formError.set('');this.editorOpen.set(true);}
  closeEditor(){if(this.submitting())return;this.editorOpen.set(false);this.formError.set('');}
  save(e:Event){e.preventDefault();if(this.submitting())return;this.submitting.set(true);const id=this.editingId();const result=id===null?this.service.create(this.roles.getPreviewRole(),this.draft):this.service.update(this.roles.getPreviewRole(),id,this.draft);this.submitting.set(false);if(!result.ok){this.formError.set(result.error);return;}this.editorOpen.set(false);this.toast.show(id===null?'سؤال جدید ثبت شد.':'تغییرات سؤال ذخیره شد.','success');}
  toggle(row:Fish24Faq){const result=this.service.toggleActive(this.roles.getPreviewRole(),row.id);this.toast.show(result.ok?(row.active?'سؤال غیرفعال شد.':'سؤال فعال شد.'):result.error,result.ok?'success':'error');}
  remove(row:Fish24Faq){if(!confirm(`آیا از حذف سؤال «${row.question}» اطمینان دارید؟`))return;const result=this.service.delete(this.roles.getPreviewRole(),row.id);this.toast.show(result.ok?'سؤال حذف شد.':result.error,result.ok?'success':'error');}
  exportRows(){if(!this.canExport()){this.toast.show('نقش پشتیبانی مجوز خروجی Excel ندارد.','error');return;}const columns=this.visibleColumns();const rows=this.service.faqs().map(row=>columns.map(column=>column.exportValue?column.exportValue(row):column.value(row)==null?null:column.value(row) as string|number));this.xlsx.export('fish24-faqs.xlsx',columns.map(column=>column.label),rows);this.toast.show(`${this.number(rows.length)} سؤال برای Excel آماده شد.`,'success');}
}
