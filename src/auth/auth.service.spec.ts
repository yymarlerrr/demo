import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { User } from '../entities/User.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { AuthModule } from './auth.module';
import { ValidationPipe } from '@nestjs/common';
import { INestApplication } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { LoginDto, RegisterDto } from './auth.dto';
import { ArgumentMetadata } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { HttpException, HttpStatus } from '@nestjs/common';

class CustomValidationPipe extends ValidationPipe {
  transform(value: any, metadata: ArgumentMetadata) {
    console.log('ValidationPipe is called with value:', value);
    return super.transform(value, metadata);
  }
}

describe('AuthService', () => {
  let app: INestApplication;
  let authService: AuthService;
  let userRepository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRootAsync({
          useFactory: () => ({
            type: 'sqlite',
            database: ':memory:',
            entities: [User],
            synchronize: true,
          }),
        }),
        TypeOrmModule.forFeature([User]),
      ],
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mockedJwtToken'),
          },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new CustomValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    authService = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));

    const hashedPassword = await bcrypt.hash('password', 10);

    await userRepository.save({
      email: 'test@test.com',
      password: hashedPassword,
      name: 'Test',
      birthDate: new Date('1990-01-01'),
    });
  });

  describe('login', () => {
    it('normal case', async () => {
      const result = await authService.login({
        email: 'test@test.com',
        password: 'password',
      });

      expect(result).toBeDefined();
      expect(result.data.token).toBeDefined();
    });

    it('wrong password', async () => {
      try {
        await authService.login({
          email: 'test@test.com',
          password: 'wrong_password',
        });
      } catch (error) {
        expect(error.status).toBe(400);
        expect(error.response).toBe('Invalid password');
      }
    });

    it('wrong user', async () => {
      try {
        await authService.login({
          email: 'wrong@test.com',
          password: 'password',
        });
      } catch (error) {
        expect(error.status).toBe(404);
        expect(error.response).toBe('User not found');
      }
    });

    it('invalid email or password', async () => {
      const dto = plainToInstance(LoginDto, {
        email: '',
        password: '',
      });
      const errors = await validate(dto);
      const messages = errors.flatMap((error) => {
        return error.constraints ? Object.values(error.constraints) : [];
      });

      expect(messages).toEqual([
        'email must be longer than or equal to 1 characters',
        'email must be an email',
        'password must be longer than or equal to 1 characters',
      ]);
    });

    it('should throw HttpException with INTERNAL_SERVER_ERROR on login failure', async () => {
      jest.spyOn(userRepository, 'findOne').mockImplementation(() => {
        throw new Error('Database error');
      });
      try {
        await authService.login({
          email: 'test@example.com',
          password: 'password',
        });
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        expect(error.response).toBe('Failed to login');
      }
    });
  });

  describe('register', () => {
    it('normal case', async () => {
      const user = {
        email: 'test2@test.com',
        password: 'password',
        name: 'Test',
        birthDate: new Date('1990-01-01'),
      };

      const result = await authService.register(user);

      expect(result).toEqual(
        expect.objectContaining({
          name: 'Test',
          birthDate: new Date('1990-01-01'),
          email: 'test2@test.com',
          password: expect.any(String),
          id: expect.any(Number),
          deletedAt: null,
        }),
      );
    });

    it('duplicate email', async () => {
      try {
        await authService.register({
          email: 'test@test.com',
          password: 'password',
          name: 'Test',
          birthDate: new Date('1990-01-01'),
        });
      } catch (error) {
        expect(error.status).toBe(400);
        expect(error.response).toBe('User already exists');
      }
    });

    it('invalid data format', async () => {
      const dto = plainToInstance(RegisterDto, {
        email: '',
        password: '',
        name: '',
        birthDate: '',
      });

      const errors = await validate(dto);
      const messages = errors.flatMap((error) => {
        return error.constraints ? Object.values(error.constraints) : [];
      });

      expect(messages).toEqual([
        'email must be longer than or equal to 1 characters',
        'email must be an email',
        'password must be longer than or equal to 1 characters',
        'name must be longer than or equal to 1 characters',
        'birthDate must be a valid ISO 8601 date string',
      ]);
    });

    it('show throw HttpException with BAD_REQUEST on register failure', async () => {
      jest.spyOn(userRepository, 'save').mockImplementation(() => {
        throw new Error('Database error');
      });

      try {
        await authService.register({
          email: 'test1@test.com',
          password: 'password',
          name: 'Test',
          birthDate: new Date('1990-01-01'),
        });
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.status).toBe(500);
        expect(error.response).toBe('Failed to register user');
      }
    });
  });
});
