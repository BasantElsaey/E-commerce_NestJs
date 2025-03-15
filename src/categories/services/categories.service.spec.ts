import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { getModelToken } from '@nestjs/sequelize';
import { Category } from '../models/category.model';
import { User } from '../../users/models/user.model';
import { Roles } from '../../utility/common/enums/user-roles.enum';
import { ConflictException } from '@nestjs/common';



describe('CategoriesService', () => {
  let service: CategoriesService;
  let categoryModel: any;


  const mockUser: Partial<User> = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashedpassword',
    roles: [Roles.ADMIN],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: getModelToken(Category),
          useValue: {
            count: jest.fn().mockResolvedValue(0),
            bulkCreate: jest.fn().mockResolvedValue([]),
            findOne: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({ id: 1, title: 'Test', description: 'Test desc', userId: 1 }),
          },
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    categoryModel = module.get(getModelToken(Category));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize default categories on module init', async () => {
    await service.onModuleInit();
    expect(categoryModel.count).toHaveBeenCalled();
    expect(categoryModel.bulkCreate).toHaveBeenCalledWith([
      { title: 'Electronics', description: 'Electronic devices', userId: 1 },
      { title: 'Clothing', description: 'Fashion and apparel', userId: 2 },
      { title: 'Books', description: 'Books and literature', userId: 3 },
    ]);
  });

  it('should create a category', async () => {
    const createCategoryDto = { title: 'Test', description: 'Test desc' };
    const result = await service.create(createCategoryDto, mockUser as User);
    expect(categoryModel.create).toHaveBeenCalled();
    expect(result).toEqual({ id: 1, title: 'Test', description: 'Test desc', userId: 1 });
  });

  it('should throw ConflictException if category already exists', async () => {
    const createCategoryDto = { title: 'Test', description: 'Test desc' };
    jest.spyOn(categoryModel, 'findOne').mockResolvedValue({ id: 1, title: 'Test', description: 'Test desc', userId: 1 });
    await expect(service.create(createCategoryDto, mockUser as User)).rejects.toThrow(ConflictException);
    
  }
  )
});