import {
  BadRequestException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateProjectDto,
  UpdateProjectDto,
  AssignProjectDto,
} from './dto/project.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(createProjectDto: CreateProjectDto) {
    try {
      console.log('Creating project with data:', {
        ...createProjectDto,
        endDateType: typeof createProjectDto.endDate,
        endDateValue: createProjectDto.endDate,
      });

      const endDate = createProjectDto.endDate
        ? new Date(createProjectDto.endDate)
        : null;

      console.log('Date processing:', {
        rawEndDate: createProjectDto.endDate,
        parsedEndDate: endDate,
        parsedEndDateType: endDate ? typeof endDate : 'null',
        parsedEndDateValue: endDate ? endDate.toISOString() : null,
      });

      const projectData = {
        title: createProjectDto.title,
        description: createProjectDto.description,
        endDate,
        status: 'in_progress' as const,
      };
      console.log('Final project data:', {
        ...projectData,
        endDateType: typeof projectData.endDate,
        endDateValue: projectData.endDate
          ? projectData.endDate.toISOString()
          : null,
      });

      const result = await this.prisma.project.create({
        data: projectData,
      });

      console.log('Created project:', {
        ...result,
        endDateType: typeof result.endDate,
        endDateValue: result.endDate ? result.endDate.toISOString() : null,
      });

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

  async findOne(id: number) {
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

  async assignProject(assignProjectDto: AssignProjectDto) {
    try {
      const projectId = parseInt(assignProjectDto.projectId, 10);
      const userId = parseInt(assignProjectDto.userId, 10);

      if (isNaN(projectId) || isNaN(userId)) {
        throw new BadRequestException('Invalid project or user ID');
      }

      // Check if project exists
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new NotFoundException(`Project with ID ${projectId} not found`);
      }

      // Check if user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          project: true,
        },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Check if user already has a project
      if (user.project) {
        throw new BadRequestException('User already as assigned project');
      }
      // Check if project is already assigned to someone else
      const existingAssignment = await this.prisma.project.findFirst({
        where: {
          id: projectId,
          userId: { not: null },
        },
      });

      if (existingAssignment) {
        throw new BadRequestException(
          'Project is already assigned to another user',
        );
      }

      //Assign project to user
      // await this.prisma.user.update({
      //   where: { id: projectId },
      //   data: {
      //     id: userId,
      //     status: 'in_progress',
      //   },
      // });

      return await this.prisma.project.update({
        where: { id: projectId },
        data: {
          userId: userId,
          status: 'in_progress',
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

  async update(id: number, updateProjectDto: UpdateProjectDto) {
    try {
      const project = await this.prisma.project.findUnique({
        where: { id },
      });

      if (!project) {
        throw new NotFoundException(`Project with ID ${id} not found`);
      }

      return await this.prisma.project.update({
        where: { id },
        data: {
          ...updateProjectDto,
          endDate: updateProjectDto.endDate
            ? new Date(updateProjectDto.endDate)
            : undefined,
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
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error updating project:', error);
      throw new InternalServerErrorException('Failed to update project');
    }
  }

  async remove(id: number) {
    try {
      const project = await this.prisma.project.findUnique({
        where: { id },
      });

      if (!project) {
        throw new NotFoundException(`Project with ID ${id} not found`);
      }

      // The project will be automatically unassigned from the user due to the foreign key constraint
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

  //get the assigned project for user
  async getAssignedProject(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        project: true, // Include the related project
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user.project;
  }

  //mark project as completed
  async completeProject(projectId: number, userId: number) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        assignedTo: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check if user has this project assigned
    if (!project.assignedTo || project.assignedTo.id !== userId) {
      throw new BadRequestException('Project not assigned to this user');
    }

    // Update project status to completed
    return this.prisma.project.update({
      where: { id: projectId },
      data: {
        status: 'completed',
      },
    });
  }
}
