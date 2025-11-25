import { Test, TestingModule } from '@nestjs/testing';
import { ShoppingItemController } from './shopping-item.controller';
import { ShoppingItemService } from './shopping-item.service';

describe('ShoppingItemController', () => {
  let controller: ShoppingItemController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShoppingItemController],
      providers: [ShoppingItemService],
    }).compile();

    controller = module.get<ShoppingItemController>(ShoppingItemController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
