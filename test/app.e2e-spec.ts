import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dirname } from 'path';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    await request(app.getHttpServer()).post('/auth/register').send({
      email: 'test@test.com',
      password: 'password',
      name: 'test',
      birthDate: '1990-01-01',
    });
  });

  it('POST /auth/register normal case', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'test2@test.com',
        password: 'password',
        name: 'test',
        birthDate: '1990-01-01',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toMatchObject({
          email: 'test2@test.com',
          name: 'test',
          birthDate: '1990-01-01',
        });
      });
  });

  it('POST /auth/register duplicate email', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'test@test.com',
        password: 'password',
        name: 'test',
        birthDate: '1990-01-01',
      })
      .expect(400)
      .expect((res) => {
        expect(res.body).toMatchObject({
          message: 'User already exists',
        });
      });
  });

  it('POST /auth/register wrong data format', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: '',
        password: 'password',
        name: 'test',
        birthDate: '1990-01-01',
      })
      .expect(400);
  });

  it('POST /auth/login normal case', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'test@test.com',
        password: 'password',
      })
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchObject({
          data: {
            token: expect.any(String),
          },
        });
      });
  });

  it('POST /auth/login wrong password', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'test@test.com',
        password: 'password1',
      })
      .expect(401)
      .expect((res) => {
        expect(res.body).toMatchObject({
          message: 'Invalid password',
        });
      });
  });

  it('POST /auth/login wrong email', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'testbbb@test.com',
        password: 'password',
      })
      .expect(404)
      .expect((res) => {
        expect(res.body).toMatchObject({
          message: 'User not found',
        });
      });
  });

  it('POST /auth/login wrong data format', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: '',
        password: 'password',
      })
      .expect(400);
  });

  afterAll(async () => {
    await app.close();
  });
});
