import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/User.entity';
import { RegisterDto, LoginDto } from './auth.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { HttpException, HttpStatus } from '@nestjs/common';
import * as dayjs from 'dayjs';
import { Logger } from '@nestjs/common';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  private readonly logger = new Logger('AuthService');

  async register(body: RegisterDto) {
    try {
      const { password, email, ...rest } = body;

      const existingUser = await this.userRepository.findOne({
        where: { email },
      });

      if (existingUser) {
        throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
      }

      const saltRounds = 10;

      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const user = await this.userRepository.save({
        ...rest,
        email,
        password: hashedPassword,
      });

      return user;
    } catch (error) {
      this.logger.error(error);
      if (error.status) {
        throw new HttpException(error.message, error.status);
      }
      throw new HttpException(
        'Failed to register user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async login(body: LoginDto) {
    try {
      const { email, password } = body;

      const user = await this.userRepository.findOne({
        where: { email },
      });

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      const { name, birthDate } = user;

      const isMatched = await bcrypt.compare(password, user?.password);

      if (!isMatched) {
        throw new HttpException('Invalid password', HttpStatus.BAD_REQUEST);
      }

      const age = dayjs().diff(birthDate, 'year');

      const payload = {
        email,
        name,
        age,
      };

      const token = this.jwtService.sign(payload);

      return {
        data: {
          token,
        },
      };
    } catch (error) {
      this.logger.error(error);
      if (error.status) {
        throw new HttpException(error.message, error.status);
      }
      throw new HttpException(
        'Failed to login',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
