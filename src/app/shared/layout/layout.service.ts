import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LayoutService {
    private _isSidebarOpen = signal<boolean>(true);

    isSidebarOpen = this._isSidebarOpen.asReadonly();

    toggleSidebar(): void {
        this._isSidebarOpen.update(v => !v);
    }

    openSidebar(): void {
        this._isSidebarOpen.set(true);
    }

    closeSidebar(): void {
        this._isSidebarOpen.set(false);
    }
}