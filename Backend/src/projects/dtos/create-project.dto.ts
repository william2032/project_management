import { IsNotEmpty, IsString, IsDateString } from 'class-validator';

import { Transform } from 'class-transformer';

// DTO for creating a project, used in POST /projects
export class CreateProjectDto {
  @IsString({ message: 'Project name is string' })
  @IsNotEmpty({ message: 'Project name is required' })
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  @Transform(({ value }) => value?.trim())
  title: string;

  @IsString({ message: 'Description must be a string' })
  @IsNotEmpty({ message: 'Description is required' })
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  @Transform(({ value }) => value?.trim())
  description: string;

  @IsDateString({}, { message: 'End date must be a valid ISO date string' })
  @IsNotEmpty({ message: 'End date is required' })
  endDate: string;
}
