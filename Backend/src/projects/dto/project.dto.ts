import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsDate, IsDateString } from 'class-validator';
import { Status } from '../../../generated/prisma';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsDateString()
  endDate?: string | null;
}

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string | null;

  @IsEnum(Status)
  @IsOptional()
  status?: Status;
}

export class AssignProjectDto {
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;
} 