import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, ViewChild, signal } from '@angular/core';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { TableKit } from '@tiptap/extension-table';
import TextAlign from '@tiptap/extension-text-align';

@Component({
  selector: 'app-fish24-rich-text-editor',
  standalone: true,
  template: `
    <div class="editor-frame" dir="rtl">
      <div class="toolbar" role="toolbar" aria-label="ابزارهای ویرایش محتوای خبر">
        <button type="button" title="واگرد (Ctrl+Z)" aria-label="واگرد" (click)="command('undo')">↶</button>
        <button type="button" title="بازانجام (Ctrl+Y)" aria-label="بازانجام" (click)="command('redo')">↷</button>
        <span class="separator"></span>
        <button type="button" title="پررنگ" aria-label="پررنگ" [class.active]="active('bold')" (click)="command('bold')"><b>ض</b></button>
        <button type="button" title="مورب" aria-label="مورب" [class.active]="active('italic')" (click)="command('italic')"><i>ک</i></button>
        <button type="button" title="زیرخط" aria-label="زیرخط" [class.active]="active('underline')" (click)="command('underline')"><u>ز</u></button>
        <button type="button" title="خط‌خورده" aria-label="خط‌خورده" [class.active]="active('strike')" (click)="command('strike')"><s>خ</s></button>
        <select aria-label="نوع پاراگراف" title="نوع پاراگراف" (change)="setBlock($event)">
          <option value="paragraph">پاراگراف</option><option value="1">عنوان ۱</option><option value="2">عنوان ۲</option><option value="3">عنوان ۳</option>
        </select>
        <button type="button" title="فهرست نشانه‌دار" aria-label="فهرست نشانه‌دار" [class.active]="active('bulletList')" (click)="command('bullet')">• فهرست</button>
        <button type="button" title="فهرست شماره‌دار" aria-label="فهرست شماره‌دار" [class.active]="active('orderedList')" (click)="command('ordered')">۱. فهرست</button>
        <button type="button" title="نقل‌قول" aria-label="نقل‌قول" [class.active]="active('blockquote')" (click)="command('quote')">❝</button>
        <span class="separator"></span>
        <button type="button" title="درج یا ویرایش پیوند" aria-label="درج یا ویرایش پیوند" (click)="setLink()">پیوند</button>
        <button type="button" title="حذف پیوند" aria-label="حذف پیوند" (click)="command('unlink')">حذف پیوند</button>
        <button type="button" title="درج تصویر در محتوا" aria-label="درج تصویر در محتوا" (click)="embeddedImage.click()">تصویر</button>
        <input #embeddedImage class="sr-only" type="file" accept=".jpg,.jpeg,.png,.webp" aria-label="انتخاب تصویر داخل محتوا" (change)="insertImage($event)">
        <button type="button" title="درج جدول" aria-label="درج جدول" (click)="command('table')">جدول</button>
        <button type="button" title="افزودن ردیف" aria-label="افزودن ردیف جدول" (click)="command('row')">+ ردیف</button>
        <button type="button" title="حذف ردیف" aria-label="حذف ردیف جدول" (click)="command('deleteRow')">− ردیف</button>
        <button type="button" title="افزودن ستون" aria-label="افزودن ستون جدول" (click)="command('column')">+ ستون</button>
        <button type="button" title="حذف ستون" aria-label="حذف ستون جدول" (click)="command('deleteColumn')">− ستون</button>
        <button type="button" title="حذف جدول" aria-label="حذف جدول" (click)="command('deleteTable')">حذف جدول</button>
        <span class="separator"></span>
        <button type="button" title="راست‌چین" aria-label="راست‌چین" (click)="align('right')">راست</button>
        <button type="button" title="وسط‌چین" aria-label="وسط‌چین" (click)="align('center')">وسط</button>
        <button type="button" title="چپ‌چین" aria-label="چپ‌چین" (click)="align('left')">چپ</button>
        <button type="button" title="جهت راست به چپ" aria-label="جهت راست به چپ" (click)="direction('rtl')">RTL</button>
        <button type="button" title="جهت چپ به راست" aria-label="جهت چپ به راست" (click)="direction('ltr')">LTR</button>
        <button type="button" title="پاک‌کردن قالب‌بندی" aria-label="پاک‌کردن قالب‌بندی" (click)="command('clear')">پاک‌سازی قالب</button>
      </div>
      <div #editorHost class="editor-host" aria-label="محتوای خبر"></div>
      @if (imageError()) { <p role="alert" class="error">{{ imageError() }}</p> }
    </div>
  `,
  styles: [`
    .editor-frame{overflow:hidden;border:1px solid rgb(var(--color-border));border-radius:1rem;background:rgb(var(--color-surface))}
    .toolbar{display:flex;flex-wrap:wrap;gap:.35rem;padding:.65rem;border-bottom:1px solid rgb(var(--color-border));background:rgb(var(--color-background)/.7)}
    .toolbar button,.toolbar select{min-height:2.25rem;border:1px solid rgb(var(--color-border));border-radius:.55rem;background:rgb(var(--color-surface));padding:.3rem .55rem;font-size:.75rem;font-weight:700;color:rgb(var(--color-foreground));transition:.15s}
    .toolbar button:hover,.toolbar button:focus-visible,.toolbar select:focus-visible,.toolbar button.active{border-color:rgb(var(--color-primary));background:rgb(var(--color-primary)/.1);color:rgb(var(--color-primary));outline:none;box-shadow:0 0 0 2px rgb(var(--color-primary)/.15)}
    .separator{width:1px;min-height:2rem;background:rgb(var(--color-border));margin-inline:.2rem}.editor-host{min-height:20rem}.error{padding:.6rem 1rem;color:rgb(var(--color-danger));font-size:.8rem;font-weight:700}
    :host ::ng-deep .ProseMirror{min-height:20rem;padding:1rem;line-height:2;outline:none;color:rgb(var(--color-foreground));overflow-wrap:anywhere}
    :host ::ng-deep .ProseMirror p.is-editor-empty:first-child::before{content:'محتوای خبر را بنویسید…';float:right;color:rgb(var(--color-muted));pointer-events:none;height:0}
    :host ::ng-deep .ProseMirror h1{font-size:1.7rem;font-weight:900}:host ::ng-deep .ProseMirror h2{font-size:1.4rem;font-weight:900}:host ::ng-deep .ProseMirror h3{font-size:1.15rem;font-weight:800}
    :host ::ng-deep .ProseMirror ul{list-style:disc;padding-inline-start:1.5rem}:host ::ng-deep .ProseMirror ol{list-style:decimal;padding-inline-start:1.5rem}
    :host ::ng-deep .ProseMirror blockquote{border-inline-start:4px solid rgb(var(--color-primary));background:rgb(var(--color-primary)/.06);padding:.5rem 1rem;border-radius:.5rem}
    :host ::ng-deep .ProseMirror a{color:rgb(var(--color-primary));text-decoration:underline}:host ::ng-deep .ProseMirror img{max-width:100%;height:auto;border-radius:.75rem;margin-block:.75rem}
    :host ::ng-deep .ProseMirror table{width:100%;border-collapse:collapse;margin-block:1rem}:host ::ng-deep .ProseMirror th,:host ::ng-deep .ProseMirror td{border:1px solid rgb(var(--color-border));padding:.5rem;min-width:4rem}
    @media(max-width:640px){.toolbar{gap:.25rem;padding:.5rem}.toolbar button,.toolbar select{font-size:.68rem;padding:.25rem .45rem}.editor-host,:host ::ng-deep .ProseMirror{min-height:16rem}}
  `]
})
export class Fish24RichTextEditorComponent implements AfterViewInit, OnDestroy {
  @Input() content = '';
  @Output() contentChange = new EventEmitter<string>();
  @ViewChild('editorHost', { static: true }) editorHost!: ElementRef<HTMLElement>;
  editor?: Editor;
  readonly imageError = signal('');

  ngAfterViewInit(): void {
    this.editor = new Editor({
      element: this.editorHost.nativeElement,
      content: this.content,
      textDirection: 'auto',
      extensions: [
        StarterKit.configure({ link: false, underline: false }),
        Underline,
        Link.configure({ openOnClick: false, autolink: true, defaultProtocol: 'https', protocols: ['http', 'https', 'mailto', 'tel'] }),
        Image.configure({ allowBase64: true, inline: false }),
        TableKit.configure({ table: { resizable: true, HTMLAttributes: { class: 'fish24-editor-table' } } }),
        TextAlign.configure({ types: ['heading', 'paragraph'] })
      ],
      editorProps: { attributes: { role: 'textbox', 'aria-multiline': 'true', 'aria-label': 'محتوای خبر', spellcheck: 'true' } },
      onUpdate: ({ editor }) => this.contentChange.emit(editor.getHTML())
    });
  }

  ngOnDestroy(): void { this.editor?.destroy(); }
  active(name: string): boolean { return Boolean(this.editor?.isActive(name)); }

  command(name: string): void {
    const editor = this.editor;
    if (!editor) return;
    const chain = editor.chain().focus();
    switch (name) {
      case 'undo': chain.undo().run(); break; case 'redo': chain.redo().run(); break;
      case 'bold': chain.toggleBold().run(); break; case 'italic': chain.toggleItalic().run(); break;
      case 'underline': chain.toggleUnderline().run(); break; case 'strike': chain.toggleStrike().run(); break;
      case 'bullet': chain.toggleBulletList().run(); break; case 'ordered': chain.toggleOrderedList().run(); break;
      case 'quote': chain.toggleBlockquote().run(); break; case 'unlink': chain.unsetLink().run(); break;
      case 'table': chain.insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(); break;
      case 'row': chain.addRowAfter().run(); break; case 'deleteRow': chain.deleteRow().run(); break;
      case 'column': chain.addColumnAfter().run(); break; case 'deleteColumn': chain.deleteColumn().run(); break;
      case 'deleteTable': chain.deleteTable().run(); break;
      case 'clear': chain.unsetAllMarks().clearNodes().run(); break;
    }
  }

  setBlock(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    if (value === 'paragraph') this.editor?.chain().focus().setParagraph().run();
    else this.editor?.chain().focus().toggleHeading({ level: Number(value) as 1 | 2 | 3 }).run();
  }
  align(value: 'left' | 'center' | 'right'): void { this.editor?.chain().focus().setTextAlign(value).run(); }
  direction(value: 'rtl' | 'ltr'): void { this.editor?.chain().focus().setTextDirection(value).run(); }

  setLink(): void {
    const previous = this.editor?.getAttributes('link')['href'] as string | undefined;
    const value = window.prompt('نشانی پیوند را وارد کنید:', previous ?? 'https://');
    if (value === null) return;
    const href = value.trim();
    if (!/^(https?:\/\/|mailto:|tel:)/i.test(href)) { this.imageError.set('نشانی پیوند باید با http، https، mailto یا tel آغاز شود.'); return; }
    this.imageError.set('');
    this.editor?.chain().focus().extendMarkRange('link').setLink({ href }).run();
  }

  insertImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { this.imageError.set('فقط تصویر JPG، PNG یا WebP مجاز است.'); return; }
    if (file.size > 5 * 1024 * 1024) { this.imageError.set('حجم تصویر نباید بیشتر از ۵ مگابایت باشد.'); return; }
    const reader = new FileReader();
    reader.onload = () => { this.imageError.set(''); this.editor?.chain().focus().setImage({ src: String(reader.result), alt: file.name, title: file.name }).run(); };
    reader.onerror = () => this.imageError.set('خواندن تصویر انجام نشد.');
    reader.readAsDataURL(file);
  }
}
