import { Component, inject, signal, computed, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { ChatService, ChatConversation, ChatMessage } from '../../core/chat/chat.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [FormsModule, IconComponent],
  template: `
    <div class="max-w-[95%] mx-auto h-[calc(100vh-8rem)] animate-fade-in-up">
      
      <!-- Header -->
      <div class="flex items-center gap-4 mb-6">
        <div class="w-14 h-14 rounded-xl bg-blue-400/10 flex items-center justify-center flex-shrink-0">
          <ui-icon name="message-circle" [size]="36" class="text-blue-400"></ui-icon>
        </div>
        <div>
          <h1 class="text-3xl font-bold text-primary mb-1">پیام‌رسان داخلی</h1>
          <p class="text-lg text-muted">پیام به همکاران یا مدیران</p>
        </div>
      </div>

      <div class="bg-surface rounded-2xl border border-border overflow-hidden flex h-full dark:bg-slate-800 dark:border-slate-700 shadow-lg">
        
        <!-- Sidebar -->
        <div [class]="getSidebarClass()">
          
          <div class="p-4 border-b border-border dark:border-slate-700">
            <div class="relative">
              <ui-icon name="search" [size]="18" class="absolute right-3 top-1/2 -translate-y-1/2 text-muted"></ui-icon>
              <input 
                type="text" 
                [ngModel]="searchQuery()"
                (ngModelChange)="searchQuery.set($event)"
                placeholder="جستجو در همکاران و پیام‌ها..."
                class="w-full pr-10 pl-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm">
            </div>
          </div>

          <div class="flex-1 overflow-y-auto">
            @for (conv of filteredConversations(); track conv.userId) {
              <div 
                (click)="selectConversation(conv.userId)"
                [class]="getConversationItemClass(conv)"
                class="flex items-center gap-3 p-4 hover:bg-background transition-colors cursor-pointer border-b border-border/50 dark:hover:bg-slate-700/50 dark:border-slate-700/50">
                
                <div class="relative flex-shrink-0">
                  <img [src]="getAvatar(conv.userId)" alt="{{ conv.userName }}" class="w-12 h-12 rounded-full object-cover">
                  @if (conv.isOnline) {
                    <span class="absolute bottom-0 left-0 w-3.5 h-3.5 bg-success border-2 border-surface dark:border-slate-800 rounded-full"></span>
                  }
                </div>

                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between mb-1">
                    <p class="font-bold text-sm text-foreground dark:text-slate-100 truncate">{{ conv.userName }}</p>
                    <span class="text-xs text-muted flex-shrink-0">{{ formatTime(conv.lastMessageTime) }}</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <p class="text-xs text-muted truncate">{{ conv.lastMessage }}</p>
                    @if (conv.unreadCount > 0) {
                      <span class="flex-shrink-0 w-5 h-5 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {{ toFa(conv.unreadCount) }}
                      </span>
                    }
                  </div>
                  <p class="text-[10px] text-muted/70 mt-0.5">{{ conv.userRole }}</p>
                </div>
              </div>
            }
            @if (filteredConversations().length === 0) {
              <div class="p-8 text-center text-muted text-sm">
                <ui-icon name="search" [size]="32" class="mx-auto mb-2 opacity-50"></ui-icon>
                <p>مکالمه‌ای یافت نشد</p>
              </div>
            }
          </div>
        </div>

        <!-- Main Chat Area -->
        <div [class]="getMainAreaClass()">
          
          @if (selectedConversation()) {
            
            <div class="p-4 border-b border-border dark:border-slate-700 flex items-center justify-between bg-surface dark:bg-slate-800">
              <div class="flex items-center gap-3">
                @if (isMobile()) {
                  <button 
                    type="button"
                    (click)="clearSelection()"
                    class="p-2 rounded-lg hover:bg-background transition-colors dark:hover:bg-slate-700 ml-2">
                    <ui-icon name="chevron-right" [size]="20" class="text-muted"></ui-icon>
                  </button>
                }
                <div class="relative">
                  <img [src]="getAvatar(selectedConversation()!.userId)" alt="{{ selectedConversation()!.userName }}" class="w-10 h-10 rounded-full object-cover">
                  @if (selectedConversation()!.isOnline) {
                    <span class="absolute bottom-0 left-0 w-3 h-3 bg-success border-2 border-surface dark:border-slate-800 rounded-full"></span>
                  }
                </div>
                <div>
                  <p class="font-bold text-foreground dark:text-slate-100">{{ selectedConversation()!.userName }}</p>
                  <p class="text-xs text-muted">{{ selectedConversation()!.isOnline ? 'آنلاین' : 'آخرین بازدید: ' + toFa(selectedConversation()!.lastSeen) }}</p>
                </div>
              </div>
            </div>

            <div #messagesContainer class="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50 dark:bg-slate-900/50">
              @for (msg of filteredMessages(); track msg.id) {
                <div [class]="getMessageClass(msg)">
                  @if (msg.senderId !== 'current-user') {
                    <img [src]="getAvatar(msg.senderId)" alt="" class="w-8 h-8 rounded-full object-cover flex-shrink-0 ml-2">
                  }
                  <div [class]="getMessageBubbleClass(msg)">
                    <p class="text-sm">{{ msg.content }}</p>
                    <p class="text-[10px] mt-1 opacity-70 text-left">{{ formatTime(msg.timestamp) }}</p>
                  </div>
                  @if (msg.senderId === 'current-user') {
                    <img src="images/avatar3.jpg" alt="من" class="w-8 h-8 rounded-full object-cover flex-shrink-0 mr-2">
                  }
                </div>
              }
              @if (filteredMessages().length === 0 && searchQuery().trim()) {
                <div class="text-center py-8 text-muted text-sm">
                  <ui-icon name="search" [size]="32" class="mx-auto mb-2 opacity-50"></ui-icon>
                  <p>پیامی با این عبارت یافت نشد</p>
                </div>
              }
            </div>

            <div class="p-4 border-t border-border dark:border-slate-700 bg-surface dark:bg-slate-800">
              <form (ngSubmit)="sendMessage()" class="flex items-end gap-3">
                <div class="flex-1">
                  <textarea 
                    [(ngModel)]="newMessage"
                    name="message"
                    rows="1"
                    placeholder="پیام خود را بنویسید..."
                    class="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm"
                    (keydown.enter)="onEnterKey($event)"></textarea>
                </div>
                <button 
                  type="submit"
                  [disabled]="!newMessage.trim()"
                  class="p-3 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0">
                  <ui-icon name="send" [size]="20"></ui-icon>
                </button>
              </form>
            </div>

          } @else {
            
            <div class="flex-1 flex flex-col items-center justify-center text-muted p-8">
              <ui-icon name="message-circle" [size]="64" class="mb-4 opacity-30"></ui-icon>
              <p class="text-lg font-medium mb-2">یک مکالمه را انتخاب کنید</p>
              <p class="text-sm">از لیست سمت راست، یک همکار را برای شروع گفتگو انتخاب کنید.</p>
            </div>

          }
        </div>

      </div>
    </div>
  `,
  styles: [`
    @keyframes fade-in-up {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; }
  `]
})
export class ChatComponent implements AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  chatService = inject(ChatService);

  searchQuery = signal('');
  newMessage = '';
  selectedConversation = signal<ChatConversation | null>(null);
  private shouldScrollToBottom = false;

  conversations = this.chatService.conversations;

  private avatarMap: Record<string, string> = {
    'current-user': 'images/avatar3.jpg',
    'manager-1': 'images/avatar6.jpg',
    'hr-1': 'images/avatar5.jpg',
    'colleague-1': 'images/avatar4.jpg'
  };

  getAvatar(userId: string): string {
    return this.avatarMap[userId] || 'images/avatar3.jpg';
  }

  filteredConversations = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return this.conversations();
    return this.conversations().filter(c =>
      c.userName.toLowerCase().includes(q) ||
      c.lastMessage.toLowerCase().includes(q) ||
      c.userRole.toLowerCase().includes(q)
    );
  });

  filteredMessages = computed(() => {
    const conv = this.selectedConversation();
    if (!conv) return [];
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return conv.messages;
    return conv.messages.filter(m => m.content.toLowerCase().includes(q));
  });

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom && this.messagesContainer) {
      this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      this.shouldScrollToBottom = false;
    }
  }

  selectConversation(userId: string): void {
    this.chatService.setActiveConversation(userId);
    this.selectedConversation.set(this.chatService.activeConversation());
    this.shouldScrollToBottom = true;
  }

  clearSelection(): void {
    this.selectedConversation.set(null);
    this.chatService.activeConversationId.set(null);
  }

  sendMessage(): void {
    if (!this.newMessage.trim()) return;
    this.chatService.sendMessage(this.newMessage);
    this.newMessage = '';
    this.selectedConversation.set(this.chatService.activeConversation());
    this.shouldScrollToBottom = true;
  }

  onEnterKey(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (!keyboardEvent.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  formatTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `${this.toFa(minutes)} دقیقه پیش`;
    if (hours < 24) return `${this.toFa(hours)} ساعت پیش`;
    if (days < 7) return `${this.toFa(days)} روز پیش`;
    return this.toFa(date.toLocaleDateString('fa-IR'));
  }

  isMobile(): boolean {
    return typeof window !== 'undefined' && window.innerWidth < 768;
  }

  getMessageClass(msg: ChatMessage): string {
    return msg.senderId === 'current-user' ? 'flex justify-end items-end' : 'flex justify-start items-end';
  }

  getMessageBubbleClass(msg: ChatMessage): string {
    if (msg.senderId === 'current-user') {
      return 'bg-primary text-white px-4 py-2.5 rounded-2xl rounded-bl-md max-w-[75%] shadow-sm';
    }
    return 'bg-surface border border-border dark:bg-slate-700 dark:border-slate-600 text-foreground dark:text-slate-100 px-4 py-2.5 rounded-2xl rounded-br-md max-w-[75%] shadow-sm';
  }

  getSidebarClass(): string {
    if (this.selectedConversation() && this.isMobile()) return 'hidden w-full md:w-80 lg:w-96 border-l border-border flex flex-col dark:border-slate-700';
    return 'w-full md:w-80 lg:w-96 border-l border-border flex flex-col dark:border-slate-700';
  }

  getMainAreaClass(): string {
    if (!this.selectedConversation() && this.isMobile()) return 'hidden flex-1 flex flex-col';
    return 'flex-1 flex flex-col';
  }

  getConversationItemClass(conv: ChatConversation): string {
    if (this.selectedConversation()?.userId === conv.userId) return 'bg-primary/5';
    return '';
  }

  toFa(num: number | string): string {
    return String(num).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
  }
}