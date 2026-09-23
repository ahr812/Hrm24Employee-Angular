import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NewsDraft, Fish24NewsPreviewService } from '../../../../core/fish24/news/fish24-news-preview.service';
import { Fish24RolePreviewService } from '../../../../core/fish24/dev/fish24-role-preview.service';
import { Fish24RichTextEditorComponent } from '../../../../shared/fish24/news/rich-text-editor.component';
import { NewsImagePickerComponent } from '../../../../shared/fish24/news/news-image-picker.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { ToastService } from '../../../../shared/ui/toast/toast.service';

@Component({
  selector: 'app-internal-news-form',
  standalone: true,
  imports: [FormsModule, RouterLink, Fish24RichTextEditorComponent, NewsImagePickerComponent, IconComponent],
  template: `
    <div class="mx-auto max-w-7xl space-y-5 animate-fade-in-up" dir="rtl">
      <header class="flex flex-wrap items-center justify-between gap-3"><div class="flex items-center gap-3"><span class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10"><ui-icon name="edit" [size]="25" class="text-primary"></ui-icon></span><div><h1 class="text-2xl font-black text-primary sm:text-3xl">{{editingId?'ویرایش خبر':'خبر جدید'}}</h1><p class="text-sm text-muted">محتوای خبری پیش‌نمایش داخلی Fish24</p></div></div><a routerLink="/fish24/internal/news" class="secondary">بازگشت به لیست</a></header>
      <form class="space-y-5" (submit)="save($event)">
        <div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <main class="space-y-5"><section class="card space-y-4 p-4 sm:p-5"><h2 class="section-title">محتوای اصلی</h2><label class="label">عنوان خبر *<input class="input" name="title" [(ngModel)]="draft.title" (input)="titleChanged()"></label><label class="label">توضیحات کوتاه *<textarea class="input min-h-24 py-2" name="shortDescription" [(ngModel)]="draft.shortDescription"></textarea></label><div><span class="label mb-2">محتوای خبر *</span><app-fish24-rich-text-editor [content]="draft.contentHtml" (contentChange)="draft.contentHtml=$event"></app-fish24-rich-text-editor></div></section>
            <section class="card grid gap-4 p-4 sm:grid-cols-2 sm:p-5"><h2 class="section-title sm:col-span-2">تنظیمات SEO</h2><label class="label sm:col-span-2">اسلاگ *<input class="input text-left" dir="ltr" name="slug" [(ngModel)]="draft.slug" (input)="slugManual=true"></label><label class="label">Alt تصویر<input class="input" name="imageAlt" [(ngModel)]="draft.imageAlt"></label><label class="label">Title تصویر<input class="input" name="imageTitle" [(ngModel)]="draft.imageTitle"></label><label class="label sm:col-span-2">کلمات کلیدی<input class="input" name="keywords" [(ngModel)]="draft.keywords"></label><label class="label sm:col-span-2">توضیحات متا<textarea class="input min-h-24 py-2" name="metaDescription" [(ngModel)]="draft.metaDescription"></textarea></label></section>
          </main>
          <aside class="space-y-5"><section class="card p-4 sm:p-5"><h2 class="section-title">دسته‌بندی‌ها *</h2><div class="mt-3 max-h-72 space-y-2 overflow-y-auto">@for(category of service.categories();track category.id){<label class="category-choice" [class.inactive]="!category.active"><input type="checkbox" class="accent-primary" [checked]="draft.categoryIds.includes(category.id)" [disabled]="!category.active&&!originalCategoryIds.includes(category.id)" (change)="toggleCategory(category.id,$event)"><span class="min-w-0 flex-1">{{category.name}}</span>@if(!category.active){<span class="rounded-full bg-muted/15 px-2 py-1 text-[10px] font-bold text-muted">غیرفعال{{originalCategoryIds.includes(category.id)?'؛ رابطه موجود':''}}</span>}</label>}</div><p class="mt-3 text-xs leading-6 text-muted">دسته غیرفعال جدید قابل انتخاب نیست. رابطه غیرفعال موجود تا حذف صریح شما حفظ می‌شود.</p></section>
            <section class="card p-4 sm:p-5"><h2 class="section-title">تصویر اصلی</h2><div class="mt-3"><app-news-image-picker inputId="news-main-image" [value]="draft.mainImageUrl" [alt]="draft.imageAlt" (valueChange)="draft.mainImageUrl=$event"></app-news-image-picker></div></section>
            <section class="card space-y-4 p-4 sm:p-5"><h2 class="section-title">انتشار و ترتیب</h2><label class="label">وضعیت<select class="input" name="active" [(ngModel)]="draft.active"><option [ngValue]="true">فعال</option><option [ngValue]="false">غیرفعال</option></select></label><label class="label">ترتیب نمایش<input class="input" type="number" min="0" step="1" name="order" [(ngModel)]="draft.order"></label></section>
          </aside>
        </div>
        @if(error()){<p role="alert" class="rounded-xl bg-danger/10 p-4 text-sm font-bold text-danger">{{error()}}</p>}
        <div class="sticky bottom-3 z-10 flex justify-end gap-2 rounded-xl border border-border bg-surface/95 p-3 shadow-lg backdrop-blur dark:border-slate-700"><a routerLink="/fish24/internal/news" class="secondary">انصراف</a><button type="submit" class="primary">ذخیره خبر</button></div>
      </form>
    </div>
  `,
  styles: [`.card{border:1px solid rgb(var(--color-border));border-radius:1rem;background:rgb(var(--color-surface));box-shadow:0 1px 3px rgb(15 23 42/.08)}.section-title{font-size:1.05rem;font-weight:900}.label{display:block;font-size:.8rem;font-weight:800}.input{display:block;width:100%;min-height:2.75rem;margin-top:.4rem;border:1px solid rgb(var(--color-border));border-radius:.75rem;background:rgb(var(--color-background));padding-inline:.75rem;outline:none}.input:focus{border-color:rgb(var(--color-primary));box-shadow:0 0 0 2px rgb(var(--color-primary)/.15)}.primary,.secondary{display:inline-flex;min-height:2.65rem;align-items:center;justify-content:center;border-radius:.75rem;padding-inline:1rem;font-size:.8rem;font-weight:800}.primary{background:rgb(var(--color-primary));color:#fff}.secondary{border:1px solid rgb(var(--color-border))}.category-choice{display:flex;align-items:center;gap:.6rem;border:1px solid rgb(var(--color-border));border-radius:.75rem;padding:.7rem;font-size:.78rem;font-weight:700}.category-choice.inactive{border-style:dashed;background:rgb(var(--color-muted)/.05)} `]
})
export class InternalNewsFormComponent {
  readonly service=inject(Fish24NewsPreviewService);private readonly roles=inject(Fish24RolePreviewService);private readonly route=inject(ActivatedRoute);private readonly router=inject(Router);private readonly toast=inject(ToastService);
  readonly editingId=Number(this.route.snapshot.paramMap.get('id'))||null;readonly error=signal('');slugManual=Boolean(this.editingId);originalCategoryIds:readonly number[]=[];
  draft:NewsDraft=this.emptyDraft();
  constructor(){if(this.editingId){const item=this.service.newsItem(this.editingId);if(item){this.originalCategoryIds=[...item.categoryIds];this.draft={title:item.title,slug:item.slug,shortDescription:item.shortDescription,contentHtml:item.contentHtml,categoryIds:[...item.categoryIds],mainImageUrl:item.mainImageUrl,imageAlt:item.imageAlt,imageTitle:item.imageTitle,keywords:item.keywords,metaDescription:item.metaDescription,order:item.order,active:item.active};}else{this.error.set('خبر یافت نشد.');}}}
  titleChanged(){if(!this.slugManual)this.draft.slug=this.service.normalizeSlug(this.draft.title);}toggleCategory(id:number,e:Event){const checked=(e.target as HTMLInputElement).checked;this.draft.categoryIds=checked?Array.from(new Set([...this.draft.categoryIds,id])):this.draft.categoryIds.filter(value=>value!==id);}
  save(e:Event){e.preventDefault();const result=this.editingId?this.service.updateNews(this.roles.getPreviewRole(),this.editingId,this.draft):this.service.createNews(this.roles.getPreviewRole(),this.draft);if(!result.ok){this.error.set(result.error);return;}this.toast.show('خبر در پیش‌نمایش ذخیره شد.','success');this.router.navigate(['/fish24/internal/news',result.value.id]);}
  private emptyDraft():NewsDraft{return{title:'',slug:'',shortDescription:'',contentHtml:'',categoryIds:[],mainImageUrl:'',imageAlt:'',imageTitle:'',keywords:'',metaDescription:'',order:0,active:true};}
}
