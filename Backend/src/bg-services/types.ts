import { Project, User, EmailStatus, Prisma } from 'generated/prisma';

export interface ProjectWithAssignee extends Project {
    assignee: User | null;
}

export interface EmailQueueItem {
    id: string;
    to: string;
    subject: string;
    template: string;
    context: string;
    status: EmailStatus;
    error?: string | null;
    createdAt: Date;
    processedAt?: Date | null;
    retries: number;
}

export interface EmailContext {
    projectName: string;
    endDate: string;
    updatedAt?: string;
}