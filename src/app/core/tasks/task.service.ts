import { Injectable, inject, signal, computed } from '@angular/core';
import { OrganizationService } from '../organization/organization.service';

export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'pending' | 'in-progress' | 'done';

export interface Task {
    id: string;
    title: string;
    description: string;
    priority: TaskPriority;
    status: TaskStatus;
    dueDate: string;
    createdAt: string;
    orgId: string;
}

@Injectable({ providedIn: 'root' })
export class TaskService {
    private readonly STORAGE_KEY = 'hrm24_tasks';
    private orgService = inject(OrganizationService);

    tasks = signal<Task[]>(this.loadTasks());

    filteredTasks = computed(() => {
        const orgId = this.orgService.activeOrg().id;
        return this.tasks().filter(t => t.orgId === orgId);
    });

    stats = computed(() => {
        const orgId = this.orgService.activeOrg().id;
        const all = this.tasks().filter(t => t.orgId === orgId);
        return {
            total: all.length,
            pending: all.filter(t => t.status === 'pending').length,
            inProgress: all.filter(t => t.status === 'in-progress').length,
            done: all.filter(t => t.status === 'done').length,
            highPriority: all.filter(t => t.priority === 'high' && t.status !== 'done').length
        };
    });

    private loadTasks(): Task[] {
        if (typeof localStorage === 'undefined') return [];
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    }

    private saveTasks(): void {
        if (typeof localStorage === 'undefined') return;
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.tasks()));
        } catch (error) {
            console.error('Error saving tasks:', error);
        }
    }

    addTask(task: Omit<Task, 'id' | 'createdAt' | 'orgId'>): void {
        const newTask: Task = {
            ...task,
            id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
            orgId: this.orgService.activeOrg().id
        };
        this.tasks.update(current => [newTask, ...current]);
        this.saveTasks();
    }

    updateTask(id: string, updates: Partial<Task>): void {
        this.tasks.update(current =>
            current.map(t => t.id === id ? { ...t, ...updates } : t)
        );
        this.saveTasks();
    }

    deleteTask(id: string): void {
        this.tasks.update(current => current.filter(t => t.id !== id));
        this.saveTasks();
    }

    toggleStatus(id: string): void {
        this.tasks.update(current =>
            current.map(t => {
                if (t.id !== id) return t;
                const nextStatus: Record<TaskStatus, TaskStatus> = {
                    'pending': 'in-progress',
                    'in-progress': 'done',
                    'done': 'pending'
                };
                return { ...t, status: nextStatus[t.status] };
            })
        );
        this.saveTasks();
    }

    reorderTasks(reordered: Task[]): void {
        this.tasks.set(reordered);
        this.saveTasks();
    }
}