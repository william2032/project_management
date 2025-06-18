import { Status, User } from 'generated/prisma';

export interface Project {
  id: string;
  name: string;
  description: string;
  endDate?: Date;
  status: Status;
  assignedUser?: User;
}

export interface ProjectResponse {
  id: string;
  name: string;
  description: string;
  endDate?: Date;
  status: Status;
  assignedUser?: {
    id: string;
    name: string;
    email: string;
    profileImage?: string;
  };
}
