export interface EmailContext {
  projectName: string;
  // endDate: string;
  updatedAt?: string;
  userName?: string;
  projectUrl?: string;
  message?: string;
}

export interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  context: EmailContext;
}
