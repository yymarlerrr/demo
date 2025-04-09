import { IsEmail, IsString, IsDateString, Length } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  @Length(1, 255)
  email: string;

  @Length(1, 60)
  @IsString()
  password: string;

  @IsString()
  @Length(1, 85)
  name: string;

  @IsDateString()
  birthDate: Date;
}

export class LoginDto {
  @IsEmail()
  @Length(1, 255)
  email: string;

  @IsString()
  @Length(1, 60)
  password: string;
}
