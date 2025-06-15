import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { Status } from '../../../generated/prisma';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;
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

  @IsEnum(Status)
  @IsOptional()
  status?: Status;
} 