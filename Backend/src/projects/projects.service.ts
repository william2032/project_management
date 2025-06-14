import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dtos/create-project.dto';
import { AssignProjectDto } from './dtos/assign-project.dto';
import { CompleteProjectDto } from './dtos/complete-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  //create a new project
  async createProject(dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        endDate: new Date(dto.endDate),
        status: 'pending',
      },
    });
  }

  async assignProject(dto: AssignProjectDto) {
    //if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });
    if (!user) {
      throw new NotFoundException('User does not exist');
    }

    //if user already assigned to project
    if (user.assignedProjectId) {
      throw new BadRequestException('user is already assigned to project');
    }
    //if project exists
    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
    });
    if (!project) {
      throw new NotFoundException('project not found');
    }

    //update project and user with the assignment
    await this.prisma.$transaction([
      this.prisma.project.update({
        where: { id: dto.projectId },
        data: { assignedUser: { connect: { id: dto.userId } } },
      }),
      this.prisma.user.update({
        where: { id: dto.userId },
        data: { assignedProjectId: dto.projectId },
      }),
    ]);
    return { message: 'Project assigned successfully.' };
  }

  async deleteProject(id: number) {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new NotFoundException('project not found');
    }
    await this.prisma.project.delete({ where: { id } });
    return { message: 'Project deleted successfully.' };
  }

  //get the assigned project for user
  async getAssignedProject(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { assignedProject: true },
    });
    if (!user) {
      throw new NotFoundException('user not found');
    }
    return user.assignedProject || { message: 'No project assigned' };
  }

  //mark project as completed
  async completeProject(
    projectId: number,
    userId: number,
    dto: CompleteProjectDto,
  ) {
    {
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        include: { assignedUser: true },
      });
      if (!project) {
        throw new NotFoundException('project not found');
      }
      if (!project.assignedUser || project.assignedUser.id !== userId) {
        throw new BadRequestException('Project not assigned to this user');
      }

      //update project status to completed
      return this.prisma.project.update({
        where: { id: projectId },
        data: {
          status: 'compeleted',
          // completedAt: new Date(),
        },
      });
    }
  }
}
