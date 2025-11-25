import { Test, TestingModule } from '@nestjs/testing';
import { ShoppingItemService } from './shopping-item.service';

describe('ShoppingItemService', () => {
  let service: ShoppingItemService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ShoppingItemService],
    }).compile();

    service = module.get<ShoppingItemService>(ShoppingItemService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
