import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserFavoriteDish } from '../../entities/user-favorite-dish.entity';
import { Dish } from '../../entities/dish.entity';
import { CreateFavoriteDishDto } from './dto/create-favorite-dish.dto';
import { ResponseCode, ResponseMessageVi } from 'src/common';

@Injectable()
export class FavoriteDishService {
  constructor(
    @InjectRepository(UserFavoriteDish)
    private favoriteDishRepository: Repository<UserFavoriteDish>,
    @InjectRepository(Dish)
    private dishRepository: Repository<Dish>,
  ) {}

  /**
   * Thêm món ăn vào danh sách yêu thích
   */
  async addFavoriteDish(userId: number, createFavoriteDishDto: CreateFavoriteDishDto): Promise<UserFavoriteDish> {
    const { dish_id } = createFavoriteDishDto;

    const dish = await this.dishRepository.findOne({ where: { id: dish_id } });
    if (!dish) {
      throw new NotFoundException(ResponseMessageVi[ResponseCode.C00100]);
    }

    const existing = await this.favoriteDishRepository.findOne({
      where: { user_id: userId, dish_id },
    });

    if (existing) {
      throw new ConflictException(ResponseMessageVi[ResponseCode.C00166]);
    }

    // Tạo mới
    const favorite = this.favoriteDishRepository.create({
      user_id: userId,
      dish_id,
    });

    return await this.favoriteDishRepository.save(favorite);
  }

  /**
   * Xóa món ăn khỏi danh sách yêu thích
   */
  async removeFavoriteDish(userId: number, dishId: number): Promise<void> {
    const favorite = await this.favoriteDishRepository.findOne({
      where: { user_id: userId, dish_id: dishId },
    });

    if (!favorite) {
      throw new NotFoundException(ResponseMessageVi[ResponseCode.C00167]);
    }

    await this.favoriteDishRepository.delete({
      user_id: userId,
      dish_id: dishId,
    });
  }

  /**
   * Lấy danh sách món ăn yêu thích của user
   */
  async getFavoriteDishes(userId: number): Promise<UserFavoriteDish[]> {
    return await this.favoriteDishRepository.find({
      where: { user_id: userId },
      relations: ['dish'],
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Kiểm tra món ăn có trong danh sách yêu thích không
   */
  async checkIfFavorite(userId: number, dishId: number): Promise<boolean> {
    const favorite = await this.favoriteDishRepository.findOne({
      where: { user_id: userId, dish_id: dishId },
    });

    return !!favorite;
  }

  /**
   * Lấy thông tin chi tiết một món ăn yêu thích
   */
  async getFavoriteDishByDishId(userId: number, dishId: number): Promise<UserFavoriteDish> {
    const favorite = await this.favoriteDishRepository.findOne({
      where: { user_id: userId, dish_id: dishId },
      relations: ['dish'],
    });

    if (!favorite) {
      throw new NotFoundException('Không tìm thấy món ăn yêu thích');
    }

    return favorite;
  }
}

