import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsISO8601,
  IsDateString,
  IsUUID,
} from 'class-validator';
import { Status } from '../../../generated/prisma';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsISO8601()
  @IsNotEmpty({ message: 'endDate should not be empty' })
  @IsDateString()
  endDate!: string;

  @IsString()
  @IsOptional()
  assigneeId?: string;

  @IsString()
  @IsOptional()
  status?: Status;
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
  endDate?: string;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @IsEnum(Status)
  @IsOptional()
  status?: Status;
}
