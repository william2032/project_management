import { IsInt, IsNotEmpty } from 'class-validator';

export class AssignProjectDto {
  @IsInt({ message: 'Project ID must be an integer' })
  @IsNotEmpty()
  projectId: number; // ID of the project to assign

  @IsInt({ message: 'User ID must be an integer' })
  @IsNotEmpty()
  userId: number; // ID of the user to assign to
}
