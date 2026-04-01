import { IsString, IsEmail, IsOptional, MaxLength } from "class-validator";

/**
 * DTO for creating a contact request from the landing page contact form.
 * This endpoint is public (no JWT required).
 */
export class CreateContactRequestDto {
  @IsString()
  @MaxLength(100)
  first_name: string;

  @IsString()
  @MaxLength(100)
  last_name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsString()
  @MaxLength(100)
  project_type: string;

  @IsString()
  @MaxLength(5000)
  message: string;
}
