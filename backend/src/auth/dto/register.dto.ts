import {
  IsString,
  IsOptional,
  IsEmail,
  MinLength,
  Matches,
} from 'class-validator';

export class RegisterDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @Matches(/^\+?[0-9]{8,15}$/, {
    message: 'Phone number is invalid',
  })
  phone?: string;

  @IsString()
  name: string;

  @IsString()
  @MinLength(6)
  password: string;
}
