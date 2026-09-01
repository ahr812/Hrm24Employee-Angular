import { Directive, HostListener, output } from '@angular/core';

@Directive({
    selector: '[appEscToClose]',
    standalone: true
})
export class EscToCloseDirective {
    escPressed = output<void>();

    @HostListener('document:keydown.escape')
    onEscapeKey(): void {
        this.escPressed.emit();
    }
}