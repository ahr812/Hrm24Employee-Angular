import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Fish24RichTextEditorComponent } from './rich-text-editor.component';

describe('Fish24RichTextEditorComponent', () => {
  let fixture: ComponentFixture<Fish24RichTextEditorComponent>;
  let component: Fish24RichTextEditorComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Fish24RichTextEditorComponent] }).compileComponents();
    fixture = TestBed.createComponent(Fish24RichTextEditorComponent);
    component = fixture.componentInstance;
    component.content = '<h2>فارسی and English ۱۲۳</h2><p dir="rtl" style="text-align: right"><strong>پررنگ</strong> <em>مورب</em> <u>زیرخط</u></p><ul><li><p>سطح یک</p><ul><li><p>سطح دو</p></li></ul></li></ul><blockquote>نقل قول</blockquote><table><tbody><tr><td><p>سلول</p></td></tr></tbody></table>';
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => component.ngOnDestroy());

  it('round-trips bilingual content, direction, nested lists, marks, quote, and table structure', () => {
    const html = component.editor!.getHTML();
    expect(html).toContain('فارسی and English ۱۲۳');
    expect(html).toContain('<strong>');
    expect(html).toContain('<em>');
    expect(html).toContain('<u>');
    expect(html).toContain('dir="rtl"');
    expect(html).toContain('text-align: right');
    expect((html.match(/<ul/g) ?? []).length).toBe(2);
    expect(html).toContain('<blockquote');
    expect(html).toContain('<table');
  });

  it('supports undo and redo through editor history', () => {
    component.editor!.commands.setContent('<p>اول</p>');
    component.editor!.chain().focus().insertContent(' دوم').run();
    expect(component.editor!.getText()).toContain('دوم');
    component.command('undo');
    expect(component.editor!.getText()).not.toContain('دوم');
    component.command('redo');
    expect(component.editor!.getText()).toContain('دوم');
  });

  it('clears marks and block formatting without removing text', () => {
    component.editor!.commands.setContent('<h2><strong>عنوان قالب‌دار</strong></h2>');
    component.editor!.commands.selectAll();
    component.command('clear');
    const html = component.editor!.getHTML();
    expect(html).toContain('عنوان قالب‌دار');
    expect(html).not.toContain('<strong>');
    expect(html).not.toContain('<h2>');
  });

  it('inserts, edits, validates, and removes links', () => {
    component.editor!.commands.setContent('<p>پیوند نمونه</p>');
    component.editor!.commands.selectAll();
    spyOn(window, 'prompt').and.returnValues('https://fish24.ir/one', 'https://fish24.ir/two', 'javascript:alert(1)');
    component.setLink();
    expect(component.editor!.getHTML()).toContain('https://fish24.ir/one');
    component.setLink();
    expect(component.editor!.getHTML()).toContain('https://fish24.ir/two');
    component.setLink();
    expect(component.imageError()).toContain('http');
    component.editor!.commands.selectAll();
    component.command('unlink');
    expect(component.editor!.getHTML()).not.toContain('<a');
  });

  it('runs table row, column, and deletion operations', () => {
    component.editor!.commands.setContent('<table><tbody><tr><td><p>یک</p></td><td><p>دو</p></td></tr></tbody></table>');
    component.editor!.commands.setTextSelection(4);
    component.command('row');
    component.command('column');
    let html = component.editor!.getHTML();
    expect((html.match(/<tr/g) ?? []).length).toBe(2);
    expect((html.match(/<td/g) ?? []).length).toBe(6);
    component.command('deleteRow');
    component.command('deleteColumn');
    html = component.editor!.getHTML();
    expect((html.match(/<tr/g) ?? []).length).toBe(1);
    expect((html.match(/<td/g) ?? []).length).toBe(2);
    component.command('deleteTable');
    expect(component.editor!.getHTML()).not.toContain('<table');
  });

  it('inserts a validated embedded image and rejects unsupported or oversized files', async () => {
    component.editor!.commands.setContent('<p></p>');
    const pngInput = document.createElement('input');
    Object.defineProperty(pngInput, 'files', { value: [new File(['image'], 'sample.png', { type: 'image/png' })] });
    component.insertImage({ target: pngInput } as unknown as Event);
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(component.editor!.getHTML()).toContain('data:image/png;base64');
    expect(component.editor!.getHTML()).toContain('sample.png');

    const svgInput = document.createElement('input');
    Object.defineProperty(svgInput, 'files', { value: [new File(['x'], 'bad.svg', { type: 'image/svg+xml' })] });
    component.insertImage({ target: svgInput } as unknown as Event);
    expect(component.imageError()).toContain('JPG');

    const largeInput = document.createElement('input');
    Object.defineProperty(largeInput, 'files', { value: [new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' })] });
    component.insertImage({ target: largeInput } as unknown as Event);
    expect(component.imageError()).toContain('۵ مگابایت');
  });

  it('handles Word-style HTML and plain-text paste through the editor schema', () => {
    const htmlData = new DataTransfer();
    htmlData.setData('text/html', '<p class="MsoNormal"><strong>Word فارسی</strong></p><script>alert(1)</script>');
    htmlData.setData('text/plain', 'Word فارسی');
    component.editor!.view.dispatchEvent(new ClipboardEvent('paste', { clipboardData: htmlData, bubbles: true }));
    expect(component.editor!.getHTML()).toContain('<strong>Word فارسی</strong>');
    expect(component.editor!.getHTML()).not.toContain('script');

    component.editor!.commands.clearContent();
    const textData = new DataTransfer();
    textData.setData('text/plain', 'خط اول\nخط دوم ۱۲۳');
    component.editor!.view.dispatchEvent(new ClipboardEvent('paste', { clipboardData: textData, bubbles: true }));
    expect(component.editor!.getText()).toContain('خط اول');
    expect(component.editor!.getText()).toContain('خط دوم ۱۲۳');
  });

  it('uses non-submit accessible toolbar controls', () => {
    const buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    expect(buttons.length).toBeGreaterThan(10);
    expect(buttons.every(button => button.type === 'button')).toBeTrue();
    expect(fixture.nativeElement.querySelector('[role="toolbar"]')).toBeTruthy();
  });
});
