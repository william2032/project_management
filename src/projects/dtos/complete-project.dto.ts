import { IsOptional, IsString } from 'class-validator';

export class CompleteProjectDto {
  @IsString()
  @IsOptional()
  status: string;
}
