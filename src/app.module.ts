import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { dirname } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ...(configService.get<string>('NODE_ENV') === 'dev'
          ? {
              autoLoadEntities: true,
              timezone: 'Z',
              type: 'mysql',
              host: configService.get<string>('DB_HOST'),
              port: configService.get<number>('DB_PORT'),
              username: configService.get<string>('DB_USERNAME'),
              password: configService.get<string>('DB_PASSWORD'),
              database: configService.get<string>('DB_DATABASE'),
              synchronize: false,
              logging: false,
            }
          : {
              type: 'sqlite',
              database: ':memory:',
              autoLoadEntities: true,
              synchronize: true,
            }),
      }),
    }),
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
