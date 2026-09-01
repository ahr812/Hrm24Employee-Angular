import { Injectable, inject, signal, computed } from '@angular/core';
import { OrganizationService } from '../organization/organization.service';

export interface ChatMessage {
    id: string;
    senderId: string;
    senderName: string;
    senderAvatar: string;
    content: string;
    timestamp: Date;
    isRead: boolean;
    type: 'text' | 'file';
}

export interface ChatUser {
    id: string;
    name: string;
    avatar: string;
    role: string;
    isOnline: boolean;
    lastSeen: string;
}

export interface ChatConversation {
    userId: string;
    userName: string;
    userAvatar: string;
    userRole: string;
    isOnline: boolean;
    lastSeen: string;
    lastMessage: string;
    lastMessageTime: Date;
    unreadCount: number;
    messages: ChatMessage[];
}

@Injectable({ providedIn: 'root' })
export class ChatService {
    private readonly STORAGE_KEY = 'hrm24_chat';
    private orgService = inject(OrganizationService);

    conversations = signal<ChatConversation[]>(this.loadConversations());
    activeConversationId = signal<string | null>(null);
    currentUser = signal<ChatUser>({
        id: 'current-user',
        name: 'علی احمدی',
        avatar: '',
        role: 'کارشناس ارشد',
        isOnline: true,
        lastSeen: 'الآن'
    });

    activeConversation = computed(() => {
        const id = this.activeConversationId();
        if (!id) return null;
        return this.conversations().find(c => c.userId === id) || null;
    });

    totalUnread = computed(() => {
        return this.conversations().reduce((sum, c) => sum + c.unreadCount, 0);
    });

    private loadConversations(): ChatConversation[] {
        if (typeof localStorage === 'undefined') {
            return this.getDefaultConversations();
        }
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                return parsed.map((c: any) => ({
                    ...c,
                    lastMessageTime: new Date(c.lastMessageTime),
                    messages: c.messages.map((m: any) => ({
                        ...m,
                        timestamp: new Date(m.timestamp)
                    }))
                }));
            }
        } catch (error) {
            console.error('Error loading chat:', error);
        }
        return this.getDefaultConversations();
    }

    private saveConversations(): void {
        if (typeof localStorage === 'undefined') return;
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.conversations()));
        } catch (error) {
            console.error('Error saving chat:', error);
        }
    }

    private getDefaultConversations(): ChatConversation[] {
        return [
            {
                userId: 'manager-1',
                userName: 'مهندس رضایی',
                userAvatar: '',
                userRole: 'مدیر فنی',
                isOnline: true,
                lastSeen: 'الآن',
                lastMessage: 'گزارش پروژه رو تا فردا بفرست.',
                lastMessageTime: new Date(Date.now() - 3600000),
                unreadCount: 2,
                messages: [
                    {
                        id: 'msg-1',
                        senderId: 'manager-1',
                        senderName: 'مهندس رضایی',
                        senderAvatar: '',
                        content: 'سلام علی جان، خسته نباشی.',
                        timestamp: new Date(Date.now() - 7200000),
                        isRead: true,
                        type: 'text'
                    },
                    {
                        id: 'msg-2',
                        senderId: 'current-user',
                        senderName: 'علی احمدی',
                        senderAvatar: '',
                        content: 'سلام مهندس، ممنون. شما هم همینطور.',
                        timestamp: new Date(Date.now() - 7000000),
                        isRead: true,
                        type: 'text'
                    },
                    {
                        id: 'msg-3',
                        senderId: 'manager-1',
                        senderName: 'مهندس رضایی',
                        senderAvatar: '',
                        content: 'گزارش پروژه رو تا فردا بفرست.',
                        timestamp: new Date(Date.now() - 3600000),
                        isRead: false,
                        type: 'text'
                    }
                ]
            },
            {
                userId: 'hr-1',
                userName: 'خانم محمدی',
                userAvatar: '',
                userRole: 'منابع انسانی',
                isOnline: false,
                lastSeen: '۲ ساعت پیش',
                lastMessage: 'مرخصی شما تأیید شد.',
                lastMessageTime: new Date(Date.now() - 86400000),
                unreadCount: 0,
                messages: [
                    {
                        id: 'msg-4',
                        senderId: 'hr-1',
                        senderName: 'خانم محمدی',
                        senderAvatar: '',
                        content: 'مرخصی شما تأیید شد.',
                        timestamp: new Date(Date.now() - 86400000),
                        isRead: true,
                        type: 'text'
                    }
                ]
            },
            {
                userId: 'colleague-1',
                userName: 'رضا کریمی',
                userAvatar: '',
                userRole: 'توسعه‌دهنده',
                isOnline: true,
                lastSeen: 'الآن',
                lastMessage: 'کد رو ریویو کردم، اوکی بود.',
                lastMessageTime: new Date(Date.now() - 1800000),
                unreadCount: 1,
                messages: [
                    {
                        id: 'msg-5',
                        senderId: 'colleague-1',
                        senderName: 'رضا کریمی',
                        senderAvatar: '',
                        content: 'کد رو ریویو کردم، اوکی بود.',
                        timestamp: new Date(Date.now() - 1800000),
                        isRead: false,
                        type: 'text'
                    }
                ]
            }
        ];
    }

    sendMessage(content: string): void {
        const convId = this.activeConversationId();
        if (!convId || !content.trim()) return;

        const newMessage: ChatMessage = {
            id: `msg-${Date.now()}`,
            senderId: 'current-user',
            senderName: this.currentUser().name,
            senderAvatar: '',
            content: content.trim(),
            timestamp: new Date(),
            isRead: true,
            type: 'text'
        };

        this.conversations.update(convs =>
            convs.map(c => {
                if (c.userId !== convId) return c;
                return {
                    ...c,
                    lastMessage: content.trim(),
                    lastMessageTime: new Date(),
                    messages: [...c.messages, newMessage]
                };
            })
        );
        this.saveConversations();
    }

    markAsRead(userId: string): void {
        this.conversations.update(convs =>
            convs.map(c => {
                if (c.userId !== userId) return c;
                return {
                    ...c,
                    unreadCount: 0,
                    messages: c.messages.map(m => ({ ...m, isRead: true }))
                };
            })
        );
        this.saveConversations();
    }

    setActiveConversation(userId: string): void {
        this.activeConversationId.set(userId);
        this.markAsRead(userId);
    }

    getInitials(name: string): string {
        return name.split(' ').map(n => n[0]).join('').substring(0, 2);
    }
}