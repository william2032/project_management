import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Request,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @Roles('admin')
  create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(createProjectDto);
  }

  @Get()
  @Roles('admin')
  findAll() {
    return this.projectsService.findAll();
  }

  @Get(':id')
  @Roles('admin')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(+id);
  }

  @Patch(':id')
  @Roles('admin')
  update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
    return this.projectsService.update(+id, updateProjectDto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.projectsService.remove(+id);
  }

  @Patch(':id/assign/:userId')
  @Roles('admin')
  async assignProject(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    console.log('=== ASSIGNMENT REQUEST ===');
    console.log('1. Project ID:', id);
    console.log('2. User ID:', userId);
    
    try {
      const result = await this.projectsService.assignProject(id, userId);
      console.log('3. Assignment successful:', result);
      return result;
    } catch (error) {
      console.error('4. Assignment failed:', error);
      throw error;
    }
  }

  @Patch(':id/complete')
  async markAsComplete(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    console.log('=== COMPLETE PROJECT REQUEST ===');
    console.log('1. Project ID:', id);
    console.log('2. User ID:', req.user.userId);
    
    try {
      // Ensure userId is a number
      const userId = parseInt(req.user.userId, 10);
      if (isNaN(userId)) {
        throw new Error('Invalid user ID');
      }

      const result = await this.projectsService.markAsComplete(id, userId);
      console.log('3. Project marked as complete:', result);
      return result;
    } catch (error) {
      console.error('4. Failed to mark project as complete:', error);
      throw error;
    }
  }
}
