import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TicketAttachmentPickerComponent } from './ticket-attachment-picker.component';

describe('TicketAttachmentPickerComponent', () => {
  let fixture: ComponentFixture<TicketAttachmentPickerComponent>;
  let component: TicketAttachmentPickerComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TicketAttachmentPickerComponent] }).compileComponents();
    fixture = TestBed.createComponent(TicketAttachmentPickerComponent);
    component = fixture.componentInstance;
    component.inputId = 'test-ticket-files';
    fixture.detectChanges();
  });

  it('keeps the real file input accessible but visually hidden behind a non-submit button', () => {
    const input = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(input.id).toBe('test-ticket-files');
    expect(input.classList).toContain('sr-only');
    expect(input.getAttribute('aria-label')).toBe('افزودن فایل');
    expect(button.type).toBe('button');
    expect(button.textContent).toContain('افزودن فایل');
  });

  it('renders readable file metadata and an accessible remove action', () => {
    component.files = [new File([new Uint8Array([1, 2, 3])], 'very-long-demo-attachment-name.pdf', { type: 'application/pdf' })];
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('very-long-demo-attachment-name.pdf');
    expect(fixture.nativeElement.querySelector('[aria-label="حذف فایل very-long-demo-attachment-name.pdf"]')).toBeTruthy();
  });

  it('emits selected files and clears the native input value', () => {
    const selected = new File([new Uint8Array([7])], 'proof.pdf', { type: 'application/pdf' });
    let emitted: readonly File[] = [];
    component.filesSelected.subscribe(files => emitted = files);
    const input = { files: [selected], value: 'C:\\fakepath\\proof.pdf' } as unknown as HTMLInputElement;
    component.select({ target: input } as unknown as Event);
    expect(emitted).toEqual([selected]);
    expect(input.value).toBe('');
  });
});
