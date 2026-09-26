import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Fish24NewsComment, Fish24NewsCommentPreviewService } from '../../../../core/fish24/news/fish24-news-comment-preview.service';
import { Fish24NewsPreviewService } from '../../../../core/fish24/news/fish24-news-preview.service';
import { Fish24RolePreviewService } from '../../../../core/fish24/dev/fish24-role-preview.service';
import { InternalListColumn, InternalListColumnSearches, InternalListSort, filterByInternalListColumns, nextInternalListSort, sortInternalListRows } from '../../../../shared/ui/data-list/internal-list.model';
import { InternalListPreferencesService } from '../../../../shared/ui/data-list/internal-list-preferences.service';
import { PlainXlsxService } from '../../../../shared/ui/data-list/plain-xlsx.service';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { ToastService } from '../../../../shared/ui/toast/toast.service';

interface CommentFilters { readonly name: string; readonly mobile: string; }
const LIST_ID = 'internal-news-comments';
const DEFAULT_FILTERS: CommentFilters = { name: '', mobile: '' };

@Component({
  selector: 'app-internal-news-comments',
  standalone: true,
  imports: [FormsModule, RouterLink, IconComponent],
  template: `
    <div class="mx-auto max-w-[96%] space-y-4 animate-fade-in-up sm:space-y-5" dir="rtl">
      <header class="flex items-center gap-3"><span class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10"><ui-icon name="message-square" [size]="25" class="text-primary"></ui-icon></span><div><h1 class="text-2xl font-black text-primary sm:text-3xl">مدیریت دیدگاه‌های اخبار</h1><p class="text-sm text-muted">تأیید دیدگاه‌ها و ثبت یک پاسخ متنی</p></div></header>

      <nav class="flex flex-wrap gap-2" aria-label="بخش‌های مدیریت اخبار">
        <a routerLink="/fish24/internal/news" class="tab">لیست اخبار</a><a routerLink="/fish24/internal/news/categories" class="tab">دسته‌بندی اخبار</a><a routerLink="/fish24/internal/news/comments" class="tab active">مدیریت دیدگاه‌ها</a>
      </nav>

      <section class="card p-4 sm:p-5">
        <div class="mb-3 flex items-center gap-2"><ui-icon name="search" [size]="18" class="text-primary"></ui-icon><h2 class="text-lg font-extrabold">جستجو</h2></div>
        <form class="grid items-end gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]" (submit)="applyFilters($event)">
          <label class="label">نام<input class="input" name="name" [(ngModel)]="draftFilters.name"></label>
          <label class="label">موبایل<input class="input" name="mobile" inputmode="numeric" dir="ltr" [(ngModel)]="draftFilters.mobile"></label>
          <div class="flex gap-2"><button class="primary" type="submit">جستجو</button><button class="secondary" type="button" (click)="showAll()">مشاهده همه</button></div>
        </form>
      </section>

      <section class="card overflow-hidden">
        <div class="flex flex-col gap-3 border-b border-border p-4 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
          <h2 class="text-lg font-extrabold">لیست دیدگاه‌ها ({{ number(filteredRows().length) }} رکورد)</h2>
          <div class="flex flex-wrap gap-2"><button type="button" class="toolbar" (click)="columnChooserOpen.set(!columnChooserOpen())">انتخاب ستون‌ها</button><button type="button" class="toolbar" (click)="exportRows()" [disabled]="!canExport()">خروجی Excel</button></div>
        </div>
        @if(columnChooserOpen()) {<div class="border-b border-border bg-background p-4 dark:border-slate-700"><div class="flex flex-wrap gap-3">@for(column of columns;track column.id){<label class="flex items-center gap-2 text-sm font-bold"><input type="checkbox" [checked]="visible(column.id)" [disabled]="onlyVisible(column.id)" (change)="toggleColumn(column.id,$event)">{{column.label}}</label>}</div><button type="button" class="secondary mt-3" (click)="restoreColumns()">بازگردانی ستون‌های پیش‌فرض</button></div>}
        <div class="table-scroll overflow-x-auto"><table class="w-full min-w-max border-collapse text-right text-sm"><thead><tr class="bg-background">@for(column of visibleColumns();track column.id){<th class="border-b border-border px-3 py-3 align-top dark:border-slate-700" [style.min-width]="column.minWidth"><button type="button" class="flex w-full items-center justify-between gap-2 font-extrabold" (click)="sort(column.id)"><span>{{column.label}}</span><span class="text-muted">{{sortMark(column.id)}}</span></button><input class="header-search mt-2" [value]="columnSearches()[column.id]||''" (input)="searchColumn(column.id,value($event))" [attr.aria-label]="'جستجو در '+column.label"></th>}<th class="border-b border-border px-3 py-3 dark:border-slate-700">عملیات</th></tr></thead>
          <tbody>@for(row of pageRows();track row.id){<tr class="hover:bg-primary/5">@for(column of visibleColumns();track column.id){<td class="max-w-[30rem] border-b border-border px-3 py-3 align-top dark:border-slate-700">@switch(column.id){@case('newsTitle'){<a class="font-bold text-primary hover:underline" [routerLink]="['/fish24/internal/news',row.newsId]">{{newsTitle(row.newsId)}}</a>}@case('message'){<span class="literal-text">{{row.message}}</span>}@case('response'){<span class="literal-text">{{row.response||'—'}}</span>}@case('status'){<span [class]="statusClass(row.approved)">{{row.approved?'تأییدشده':'تأییدنشده'}}</span>}@default{<span [attr.dir]="column.ltr?'ltr':null">{{cellValue(column,row)}}</span>}}</td>}<td class="border-b border-border px-3 py-3 align-top dark:border-slate-700"><div class="flex flex-wrap gap-2">@if(row.approved){<button type="button" class="danger" title="رد و پنهان‌کردن دیدگاه؛ حذف نمی‌شود" (click)="setApproval(row,false)">تأیید نشود ×</button><button type="button" class="action" (click)="openResponse(row)">{{row.response?'ویرایش پاسخ':'پاسخ'}}</button>}@else{<button type="button" class="action" (click)="setApproval(row,true)">تأیید دیدگاه ✓</button>}</div></td></tr>}@empty{<tr><td [attr.colspan]="visibleColumns().length+1" class="p-8 text-center text-muted">دیدگاهی یافت نشد.</td></tr>}</tbody></table></div>
        @if(totalPages()>1){<div class="flex items-center justify-center gap-3 border-t border-border p-4 dark:border-slate-700"><button class="secondary" type="button" [disabled]="page()===1" (click)="page.set(page()-1)">قبلی</button><span class="text-sm font-bold">صفحه {{number(page())}} از {{number(totalPages())}}</span><button class="secondary" type="button" [disabled]="page()===totalPages()" (click)="page.set(page()+1)">بعدی</button></div>}
      </section>

      @if(responseTarget();as comment){<div class="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/55 p-3" role="dialog" aria-modal="true" aria-labelledby="response-title"><form class="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-surface p-4 shadow-2xl dark:bg-slate-800 sm:p-6" (submit)="saveResponse($event)"><div class="flex items-center justify-between gap-3"><h2 id="response-title" class="text-xl font-black">{{comment.response?'ویرایش پاسخ':'ثبت پاسخ'}}</h2><button type="button" class="icon-button" aria-label="بستن" (click)="closeResponse()">×</button></div><dl class="mt-5 grid gap-3 rounded-xl bg-background p-4 text-sm"><div><dt>عنوان خبر</dt><dd>{{newsTitle(comment.newsId)}}</dd></div><div><dt>نام کاربر</dt><dd>{{comment.authorName}}</dd></div><div><dt>متن دیدگاه</dt><dd class="literal-text">{{comment.message}}</dd></div></dl><label class="label mt-4">پاسخ متنی<textarea class="input min-h-32 py-2" name="response" [(ngModel)]="responseDraft"></textarea></label>@if(responseError()){<p role="alert" class="mt-3 rounded-xl bg-danger/10 p-3 text-sm font-bold text-danger">{{responseError()}}</p>}<div class="mt-5 flex justify-end gap-2"><button type="button" class="secondary" (click)="closeResponse()">انصراف</button><button type="submit" class="primary">ذخیره پاسخ</button></div></form></div>}
    </div>
  `,
  styles: [`
    .card{border:1px solid rgb(var(--color-border));border-radius:1rem;background:rgb(var(--color-surface));box-shadow:0 1px 3px rgb(15 23 42/.08)}
    .primary,.secondary,.toolbar,.action,.danger,.tab,.icon-button{display:inline-flex;min-height:2.55rem;align-items:center;justify-content:center;gap:.4rem;border-radius:.7rem;padding-inline:.9rem;font-size:.78rem;font-weight:800}
    .primary{background:rgb(var(--color-primary));color:#fff}.secondary,.toolbar,.action,.tab,.icon-button{border:1px solid rgb(var(--color-border));background:rgb(var(--color-surface))}.tab.active{border-color:rgb(var(--color-primary));background:rgb(var(--color-primary)/.1);color:rgb(var(--color-primary))}.danger{border:1px solid rgb(var(--color-danger)/.3);color:rgb(var(--color-danger))}
    .label{display:flex;flex-direction:column;gap:.4rem;font-size:.75rem;font-weight:800}.input,.header-search{width:100%;border:1px solid rgb(var(--color-border));border-radius:.65rem;background:rgb(var(--color-background));padding:.68rem .8rem;outline:none}.input:focus,.header-search:focus{border-color:rgb(var(--color-primary))}.header-search{min-width:7rem;padding:.45rem .55rem;font-size:.72rem;font-weight:500}.literal-text{display:block;white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.8}.status-approved,.status-pending{display:inline-flex;border-radius:999px;padding:.3rem .7rem;font-size:.7rem;font-weight:800}.status-approved{background:rgb(var(--color-success)/.15);color:rgb(var(--color-success))}.status-pending{background:rgb(var(--color-danger)/.12);color:rgb(var(--color-danger))}dt{color:rgb(var(--color-muted));font-size:.72rem}dd{margin-top:.2rem;font-weight:800}button:disabled{cursor:not-allowed;opacity:.45}
  `]
})
export class InternalNewsCommentsComponent {
  readonly commentService = inject(Fish24NewsCommentPreviewService);
  private readonly newsService = inject(Fish24NewsPreviewService);
  private readonly roles = inject(Fish24RolePreviewService);
  private readonly prefs = inject(InternalListPreferencesService);
  private readonly xlsx = inject(PlainXlsxService);
  private readonly toast = inject(ToastService);
  readonly page = signal(1); readonly pageSize = 10; readonly columnChooserOpen = signal(false); readonly responseTarget = signal<Fish24NewsComment | null>(null); readonly responseError = signal('');
  responseDraft = '';
  readonly appliedFilters = signal(this.loadFilters());
  draftFilters = { ...this.appliedFilters() };
  readonly columnSearches = signal<InternalListColumnSearches>({}); readonly tableSort = signal<InternalListSort>({ columnId: null, direction: null });
  readonly columns: readonly InternalListColumn<Fish24NewsComment>[] = [
    {id:'id',label:'شناسه',value:r=>String(r.id),exportValue:r=>String(r.id),minWidth:'6rem',ltr:true},
    {id:'createdAt',label:'تاریخ',value:r=>r.createdAt,minWidth:'10rem',ltr:true},
    {id:'newsTitle',label:'عنوان خبر',value:r=>this.newsTitle(r.newsId),minWidth:'18rem'},
    {id:'authorName',label:'نام کاربر',value:r=>r.authorName,minWidth:'12rem'},
    {id:'authorMobile',label:'موبایل',value:r=>r.authorMobile,exportValue:r=>r.authorMobile,minWidth:'10rem',ltr:true},
    {id:'message',label:'متن پیام',value:r=>r.message,minWidth:'24rem'},
    {id:'response',label:'پاسخ',value:r=>r.response||'',exportValue:r=>r.response||'',minWidth:'22rem'},
    {id:'status',label:'وضعیت',value:r=>r.approved?'تأییدشده':'تأییدنشده',minWidth:'9rem'}
  ];
  readonly allColumnIds=this.columns.map(column=>column.id); readonly defaultColumnIds=[...this.allColumnIds];
  readonly selectedColumns=signal<readonly string[]>(this.prefs.load(LIST_ID,this.allColumnIds,this.defaultColumnIds));
  readonly visibleColumns=computed(()=>this.columns.filter(column=>this.selectedColumns().includes(column.id)));
  readonly filteredRows=computed(()=>{const f=this.appliedFilters();return this.commentService.comments().filter(row=>(!f.name||row.authorName.includes(f.name))&&(!f.mobile||row.authorMobile.includes(f.mobile)));});
  readonly tableRows=computed(()=>sortInternalListRows(filterByInternalListColumns(this.filteredRows(),this.columns,this.selectedColumns(),this.columnSearches()),this.columns,this.tableSort()));
  readonly pageRows=computed(()=>this.tableRows().slice((this.page()-1)*this.pageSize,this.page()*this.pageSize));
  readonly totalPages=computed(()=>Math.max(1,Math.ceil(this.tableRows().length/this.pageSize)));

  canExport(){return this.commentService.canExport(this.roles.getPreviewRole());}
  newsTitle(id:number){return this.newsService.newsItem(id)?.title??'خبر حذف‌شده';}
  visible(id:string){return this.selectedColumns().includes(id);} onlyVisible(id:string){return this.visible(id)&&this.selectedColumns().length===1;} value(e:Event){return(e.target as HTMLInputElement).value;} number(v:number){return new Intl.NumberFormat('fa-IR').format(v);} cellValue(column:InternalListColumn<Fish24NewsComment>,row:Fish24NewsComment){return column.value(row);} statusClass(approved:boolean){return approved?'status-approved':'status-pending';}
  applyFilters(e:Event){e.preventDefault();const filters={name:this.draftFilters.name.trim(),mobile:this.draftFilters.mobile.trim()};this.appliedFilters.set(filters);this.prefs.saveFilters(LIST_ID,filters);this.page.set(1);} showAll(){this.draftFilters={...DEFAULT_FILTERS};this.appliedFilters.set(DEFAULT_FILTERS);this.prefs.resetFilters(LIST_ID);this.page.set(1);}
  toggleColumn(id:string,e:Event){const checked=(e.target as HTMLInputElement).checked;const next=checked?[...this.selectedColumns(),id]:this.selectedColumns().filter(item=>item!==id);if(!next.length)return;this.selectedColumns.set(this.prefs.save(LIST_ID,next,this.allColumnIds));if(!checked)this.searchColumn(id,'');}
  restoreColumns(){this.selectedColumns.set(this.prefs.reset(LIST_ID,this.allColumnIds,this.defaultColumnIds));this.columnSearches.set({});this.tableSort.set({columnId:null,direction:null});}
  searchColumn(id:string,query:string){this.columnSearches.update(value=>({...value,[id]:query}));this.page.set(1);} sort(id:string){this.tableSort.update(value=>nextInternalListSort(value,id));} sortMark(id:string){const sort=this.tableSort();return sort.columnId===id?(sort.direction==='asc'?'↑':'↓'):'↕';}
  setApproval(row:Fish24NewsComment,approved:boolean){const result=this.commentService.setApproval(this.roles.getPreviewRole(),row.id,approved);this.toast.show(result.ok?(approved?'دیدگاه تأیید شد.':'دیدگاه بدون حذف، تأییدنشده و پنهان شد.'):result.error,result.ok?'success':'error');}
  openResponse(row:Fish24NewsComment){this.responseTarget.set(row);this.responseDraft=row.response??'';this.responseError.set('');} closeResponse(){this.responseTarget.set(null);this.responseDraft='';this.responseError.set('');}
  saveResponse(e:Event){e.preventDefault();const target=this.responseTarget();if(!target)return;const result=this.commentService.saveResponse(this.roles.getPreviewRole(),target.id,this.responseDraft,this.roleLabel());if(!result.ok){this.responseError.set(result.error);return;}this.closeResponse();this.toast.show('پاسخ متنی ذخیره شد.','success');}
  exportRows(){if(!this.canExport()){this.toast.show('نقش پشتیبانی مجوز خروجی Excel ندارد.','error');return;}const columns=this.visibleColumns();const rows=this.filteredRows().map(row=>columns.map(column=>column.exportValue?column.exportValue(row):column.value(row)==null?null:String(column.value(row))));this.xlsx.export('fish24-news-comments.xlsx',columns.map(column=>column.label),rows);this.toast.show(`${this.number(rows.length)} دیدگاه برای Excel آماده شد.`,'success');}
  private roleLabel(){const role=this.roles.getPreviewRole();return role==='super-admin'?'مدیر سامانه':role==='sales-expert'?'کارشناس فروش':'کارشناس پشتیبانی';}
  private loadFilters(){return this.prefs.loadFilters<CommentFilters>(LIST_ID,DEFAULT_FILTERS,value=>{if(typeof value!=='object'||value===null)return null;const candidate=value as Partial<CommentFilters>;return typeof candidate.name==='string'&&typeof candidate.mobile==='string'?{name:candidate.name,mobile:candidate.mobile}:null;});}
}
