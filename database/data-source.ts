import { join } from 'path';
import { DataSource } from 'typeorm';
import 'dotenv/config';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env['DB_HOST'],
  port: parseInt(process.env['DB_PORT'] || '3306'),
  username: process.env['DB_USERNAME'],
  password: process.env['DB_PASSWORD'],
  database: process.env['DB_DATABASE'],
  entities: [join(__dirname, '../src/entities/*.entity.ts')],
  migrations: [join(__dirname, '/migrations/*.ts')],
});
