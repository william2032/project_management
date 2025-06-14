import { IsOptional, IsString, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CompleteProjectDto {
  @IsString()
  @IsOptional()
  status: string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  completedAt: Date;
}
