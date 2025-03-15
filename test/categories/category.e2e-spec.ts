import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module'; 

jest.mock('../../src/users/models/user.model', () => ({ 
  User: class MockUser {},
}));

describe('CategoriesController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/categories (GET) - should return categories', () => {
    return request(app.getHttpServer())
      .get('/categories')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('categories');
        expect(res.body).toHaveProperty('total');
      });
  });

  it('/categories (POST) - should create a category', () => {
    const createCategoryDto = { title: 'Test Category', description: 'Test Description' };
    return request(app.getHttpServer())
      .post('/categories')
      .send(createCategoryDto)
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body.title).toBe('Test Category');
      });
  });

  afterAll(async () => {
    await app.close();
  });
});