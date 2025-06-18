/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { $Enums, Project } from 'generated/prisma';
import { EmailService } from '../email/email.service';
import EmailStatus = $Enums.EmailStatus;
import Status = $Enums.Status;

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async create(dto: CreateProjectDto) {
    try {
      const projectData = {
        title: dto.title,
        description: dto.description,
        status: dto.status || Status.pending,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        ...(dto.assigneeId && { userId: dto.assigneeId }),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await this.prisma.project.create({
        data: projectData,
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      console.log('Created project:', result);
      return result;
    } catch (error) {
      console.error('Error creating project:', error);
      throw new InternalServerErrorException('Failed to create project');
    }
  }

  async findAll() {
    try {
      return await this.prisma.project.findMany({
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw new InternalServerErrorException('Failed to fetch projects');
    }
  }

  async findOne(id: string) {
    try {
      const project = await this.prisma.project.findUnique({
        where: { id },
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!project) {
        throw new NotFoundException(`Project with ID ${id} not found`);
      }
      return project;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error fetching project:', error);
      throw new InternalServerErrorException('Failed to fetch project');
    }
  }

  async update(id: string, updateProjectDto: UpdateProjectDto) {
    try {
      const project = await this.prisma.project.findUnique({
        where: { id },
      });

      if (!project) {
        throw new NotFoundException(`Project with ID ${id} not found`);
      }

      // Prepare update data
      const updateData: any = {
        ...updateProjectDto,
        updatedAt: new Date(),
      };

      // Handle endDate conversion
      if (updateProjectDto.endDate) {
        updateData.endDate = new Date(updateProjectDto.endDate);
      }

      // Handle assignee assignment
      if (updateProjectDto.assigneeId) {
        const assignee = await this.prisma.user.findUnique({
          where: { id: updateProjectDto.assigneeId },
          select: { id: true, email: true, name: true },
        });

        if (!assignee) {
          throw new NotFoundException('Assignee not found');
        }

        // Check if user is already assigned to another project
        const existingAssignment = await this.prisma.project.findFirst({
          where: {
            userId: updateProjectDto.assigneeId,
            id: { not: id }, // Exclude current project
          },
        });

        if (existingAssignment) {
          throw new BadRequestException(
            'User is already assigned to another project',
          );
        }

        updateData.userId = updateProjectDto.assigneeId;
        delete updateData.assigneeId; // Remove this as it's not a valid database field

        // Send assignment email
        try {
          const emailSent = await this.emailService.sendProjectAssignmentEmail(
            assignee,
            project.title,
          );
          updateData.emailStatus = emailSent
            ? EmailStatus.SENT
            : EmailStatus.NOT_SENT;
        } catch (emailError) {
          console.error('Error sending assignment email:', emailError);
          updateData.emailStatus = EmailStatus.FAILED;
        }
      }

      return await this.prisma.project.update({
        where: { id },
        data: updateData,
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error('Error updating project:', error);
      throw new InternalServerErrorException('Failed to update project');
    }
  }

  async remove(id: string): Promise<Project> {
    try {
      const project = await this.prisma.project.findUnique({
        where: { id },
      });

      if (!project) {
        throw new NotFoundException(`Project with ID ${id} not found`);
      }

      return await this.prisma.project.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error deleting project:', error);
      throw new InternalServerErrorException('Failed to delete project');
    }
  }

  async assignProject(id: string, userId: string): Promise<any> {
    try {
      // Check if project exists
      const project = await this.prisma.project.findUnique({
        where: { id },
      });

      if (!project) {
        throw new NotFoundException(`Project with ID ${id} not found`);
      }

      // Check if user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Check if user is already assigned to another project
      const existingAssignment = await this.prisma.project.findFirst({
        where: {
          userId: userId,
          id: { not: id }, // Exclude current project
        },
      });

      if (existingAssignment) {
        throw new BadRequestException(
          'User is already assigned to another project',
        );
      }

      const updatedProject = await this.prisma.project.update({
        where: { id },
        data: {
          userId: userId,
          updatedAt: new Date(),
        },
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Send assignment email
      try {
        const emailSent = await this.emailService.sendProjectAssignmentEmail(
          user,
          project.title,
        );

        // Update email status
        await this.prisma.project.update({
          where: { id },
          data: {
            emailStatus: emailSent ? EmailStatus.SENT : EmailStatus.NOT_SENT,
          },
        });
      } catch (emailError) {
        console.error('Error sending assignment email:', emailError);
        await this.prisma.project.update({
          where: { id },
          data: { emailStatus: EmailStatus.FAILED },
        });
      }

      return {
        success: true,
        message: 'Project assigned successfully',
        data: updatedProject,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error('Error assigning project:', error);
      throw new InternalServerErrorException('Failed to assign project');
    }
  }

  async getUserProjects(userId: string): Promise<Project[]> {
    try {
      // First verify the user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Return projects for this user
      return await this.prisma.project.findMany({
        where: { userId },
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error fetching user projects:', error);
      throw new InternalServerErrorException('Failed to fetch user projects');
    }
  }

  async markAsComplete(projectId: string, userId: string): Promise<Project> {
    try {
      // First check if the project exists and is assigned to the user
      const project = await this.prisma.project.findFirst({
        where: {
          id: projectId,
          userId: userId,
        },
        include: {
          assignedTo: true,
        },
      });

      if (!project) {
        throw new NotFoundException('Project not found or not assigned to you');
      }

      // Update the project status
      const updatedProject = await this.prisma.project.update({
        where: { id: projectId },
        data: {
          status: Status.completed,
          updatedAt: new Date(),
        },
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Send completion email
      try {
        const assigneeName = updatedProject.assignedTo?.name ?? 'Unknown User';
        await this.emailService.sendProjectCompletionEmail(
          updatedProject.title,
          assigneeName,
        );
      } catch (emailError) {
        console.error('Error sending completion email:', emailError);
      }

      return updatedProject;
    } catch (error) {
      console.error('Detailed error completing project:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to complete project: ${error.message}`,
      );
    }
  }
}
