import { Injectable, NotFoundException, UnauthorizedException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShoppingList } from '../../entities/shopping-list.entity';
import { ShoppingItem } from '../../entities/shopping-item.entity';
import { CreateShoppingListDto } from './dto/create-shopping-list.dto';
import { UpdateShoppingListDto } from './dto/update-shopping-list.dto';
import { FamilyService } from '../family/family.service';
import { MemberService } from '../member/member.service';
import { JwtUser } from 'src/common/types/user.type';
import { ResponseCode, ResponseMessageVi } from 'src/common/errors/error-codes';
import { NotificationsService } from '../notifications/notifications.service';
import { FirebaseService } from '../../firebase/firebase.service';
import { User } from '../../entities/user.entity';

@Injectable()
export class ShoppingListService {
  constructor(
    @InjectRepository(ShoppingList)
    private readonly shoppingListRepo: Repository<ShoppingList>,

    @InjectRepository(ShoppingItem)
    private readonly shoppingItemRepo: Repository<ShoppingItem>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly familyService: FamilyService,
    private readonly memberService: MemberService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
    private readonly firebaseService: FirebaseService,
  ) { }


  /** Tạo mới Shopping List */
  async create(dto: CreateShoppingListDto, user: JwtUser): Promise<ShoppingList> {
    // Clone dto để không mutate
    const data: Partial<CreateShoppingListDto> = { ...dto };

    // Nếu không chỉ định owner_id thì tự tạo
    if (!data.owner_id) {
      data.owner_id = user.id;
      const list = this.shoppingListRepo.create(data);
      const savedList = await this.shoppingListRepo.save(list);

      // Gửi thông báo cho tất cả thành viên trong gia đình (nếu có family_id)
      if (savedList.family_id) {
        try {
          const creator = await this.userRepository.findOne({ where: { id: user.id } });
          const creatorName = creator?.full_name || `User ${user.id}`;

          const family = await this.familyService.getFamilyById(savedList.family_id);

          // Lấy tất cả thành viên trong gia đình
          const allMembers = await this.memberService.getMembersByFamily(savedList.family_id);

          // Gửi thông báo cho tất cả thành viên
          for (const member of allMembers) {
            if (member.user_id !== user.id) { // Không gửi cho chính người tạo
              await this.notificationsService.createNotification(
                member.user_id,
                'Danh sách mua sắm mới đã được tạo',
                `${creatorName} đã tạo danh sách mua sắm mới cho gia đình ${family.name}`,
              );
            }
          }

          // Gửi thông báo cho chủ nhóm nếu chủ nhóm không phải là thành viên
          const isOwnerMember = allMembers.some(m => m.user_id === family.owner_id);
          if (!isOwnerMember && family.owner_id !== user.id) {
            await this.notificationsService.createNotification(
              family.owner_id,
              'Danh sách mua sắm mới đã được tạo',
              `${creatorName} đã tạo danh sách mua sắm mới cho gia đình ${family.name}`,
            );
          }
        } catch (error) {
          // Log lỗi nhưng không throw để không ảnh hưởng đến việc tạo shopping list
          console.error('Error sending notification for shopping list creation:', error);
        }
      }

      return savedList;
    }

    // Nếu chỉ định owner khác user
    if (data.owner_id !== user.id) {
      if (!data.family_id) {
        throw new UnauthorizedException(ResponseMessageVi[ResponseCode.C00261]);
      }

      const family = await this.familyService.getFamilyById(data.family_id);

      // Kiểm tra user có phải là manager không
      const members = await this.memberService.getMembersByFamily(data.family_id);
      const currentMember = members.find(member => member.user_id === user.id);
      const isManager = currentMember?.role === 'manager';

      // Chỉ manager mới có quyền giao task
      if (!isManager) {
        throw new UnauthorizedException(ResponseMessageVi[ResponseCode.C00262]);
      }
    }

    const list = this.shoppingListRepo.create(data);
    const savedList = await this.shoppingListRepo.save(data);

    // Gửi thông báo cho tất cả thành viên trong gia đình (nếu có family_id)
    if (savedList.family_id) {
      try {
        const creator = await this.userRepository.findOne({ where: { id: user.id } });
        const creatorName = creator?.full_name || `User ${user.id}`;

        const family = await this.familyService.getFamilyById(savedList.family_id);

        // Lấy tất cả thành viên trong gia đình
        const allMembers = await this.memberService.getMembersByFamily(savedList.family_id);

        // Gửi thông báo cho tất cả thành viên
        for (const member of allMembers) {
          await this.notificationsService.createNotification(
            member.user_id,
            'Danh sách mua sắm mới đã được tạo',
            `${creatorName} đã tạo danh sách mua sắm mới cho gia đình ${family.name}`,
          );
        }

        // Gửi thông báo cho chủ nhóm nếu chủ nhóm không phải là thành viên
        const isOwnerMember = allMembers.some(m => m.user_id === family.owner_id);
        if (!isOwnerMember && family.owner_id !== user.id) {
          await this.notificationsService.createNotification(
            family.owner_id,
            'Danh sách mua sắm mới đã được tạo',
            `${creatorName} đã tạo danh sách mua sắm mới cho gia đình ${family.name}`,
          );
        }

        // Nếu owner_id khác với người tạo, gửi thông báo cho owner
        if (savedList.owner_id && savedList.owner_id !== user.id) {
          const owner = await this.userRepository.findOne({ where: { id: savedList.owner_id } });
          if (owner) {
            await this.notificationsService.createNotification(
              savedList.owner_id,
              'Bạn có danh sách mua sắm mới',
              `${creatorName} đã tạo danh sách mua sắm và giao cho bạn`,
            );
          }
        }
      } catch (error) {
        // Log lỗi nhưng không throw để không ảnh hưởng đến việc tạo shopping list
        console.error('Error sending notification for shopping list creation:', error);
      }
    } else {
      // Nếu không có family_id nhưng có owner_id khác người tạo, gửi thông báo cho owner
      if (savedList.owner_id && savedList.owner_id !== user.id) {
        try {
          const creator = await this.userRepository.findOne({ where: { id: user.id } });
          const creatorName = creator?.full_name || `User ${user.id}`;

          await this.notificationsService.createNotification(
            savedList.owner_id,
            'Bạn có danh sách mua sắm mới',
            `${creatorName} đã tạo danh sách mua sắm và giao cho bạn`,
          );
        } catch (error) {
          console.error('Error sending notification for shopping list creation:', error);
        }
      }
    }

    return savedList;
  }

  /** Lấy toàn bộ danh sách (kèm owner, family, items) */
  async findAll(): Promise<ShoppingList[]> {
    return await this.shoppingListRepo.find({
      relations: ['owner', 'family', 'items', 'items.ingredient'],
      order: { created_at: 'DESC' },
    });
  }

  // Lấy ra toàn bộ các danh sách của bản thân
  async myShoppingList(user: JwtUser): Promise<ShoppingList[]> {
    return await this.shoppingListRepo.find({
      where: { owner_id: user.id },
      relations: ['family', 'items', 'items.ingredient'],
      order: { created_at: 'DESC' },
    });
  }

  // Lấy ra toàn bộ các danh sách các danh sách mua sắm đã được share trong gia đình
  async myFamilyShared(family_id: number, user: JwtUser): Promise<ShoppingList[]> {
    // Admin có thể xem tất cả families
    if (user.role !== 'admin') {
      // Lấy tất cả thành viên của family
      const members = await this.memberService.getMembersByFamily(family_id);

      // Kiểm tra user có thuộc family không
      const isMember = members.some(member => member.user_id === user.id);
      if (!isMember) {
        throw new UnauthorizedException(ResponseMessageVi[ResponseCode.C00173]);
      }
    }

    // Lấy các shopping list được chia sẻ trong family với owner info
    const lists = await this.shoppingListRepo.find({
      where: { family_id, is_shared: true },
      relations: ['family', 'owner', 'items', 'items.ingredient'],
      order: { created_at: 'DESC' },
    });

    // Format shopping_date đúng timezone (Vietnam +07:00)
    // Convert date to local date string (YYYY-MM-DD) to avoid timezone issues
    return lists.map(list => {
      if (list.shopping_date) {
        // Get date object
        const date = new Date(list.shopping_date);
        // Format as YYYY-MM-DD using local timezone
        // Use getFullYear, getMonth, getDate to get local date components
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        // Create new object with formatted date string
        return {
          ...list,
          shopping_date: `${year}-${month}-${day}` as any,
        };
      }
      return list;
    });
  }

  /** Lấy 1 danh sách theo id */
  async findOne(id: number, user: JwtUser): Promise<ShoppingList> {
    const list = await this.shoppingListRepo.findOne({
      where: { id },
      relations: ['family', 'items', 'items.ingredient'],
    });

    if (!list) {
      throw new NotFoundException(ResponseMessageVi[ResponseCode.C00260]);
    }

    if (user.role !== 'admin' && list.owner_id !== user.id) {
      throw new UnauthorizedException(ResponseMessageVi[ResponseCode.C00269]);
    }

    return list;
  }

  // Share danh sách mua sắm
  async shareShoppingList(id: number, user: JwtUser): Promise<ShoppingList> {
    const list = await this.findOne(id, user);

    list.is_shared = true;

    const savedList = await this.shoppingListRepo.save(list);

    // Gửi thông báo cho tất cả thành viên trong gia đình
    if (savedList.family_id) {
      try {
        const sharer = await this.userRepository.findOne({ where: { id: user.id } });
        const sharerName = sharer?.full_name || `User ${user.id}`;
        const family = await this.familyService.getFamilyById(savedList.family_id);
        const allMembers = await this.memberService.getMembersByFamily(savedList.family_id);

        const notificationTitle = 'Danh sách mua sắm mới được chia sẻ';
        const notificationBody = `${sharerName} đã chia sẻ danh sách mua sắm với gia đình ${family.name}`;

        // Collect user IDs to send notifications
        const userIdsToNotify: number[] = [];

        // Gửi thông báo cho tất cả thành viên (trừ người share)
        for (const member of allMembers) {
          if (member.user_id !== user.id) {
            // Tạo notification trong database + gửi qua WebSocket
            await this.notificationsService.createNotification(
              member.user_id,
              notificationTitle,
              notificationBody,
            );
            userIdsToNotify.push(member.user_id);
          }
        }

        // Gửi cho owner nếu owner không phải là thành viên
        const isOwnerMember = allMembers.some(m => m.user_id === family.owner_id);
        if (!isOwnerMember && family.owner_id !== user.id) {
          await this.notificationsService.createNotification(
            family.owner_id,
            notificationTitle,
            notificationBody,
          );
          userIdsToNotify.push(family.owner_id);
        }

        // Gửi push notification trực tiếp qua Firebase đến tất cả devices
        if (userIdsToNotify.length > 0) {
          try {
            const pushResult = await this.firebaseService.sendToMultipleUsers(
              userIdsToNotify,
              notificationTitle,
              notificationBody,
              {
                type: 'shopping_list_shared',
                shoppingListId: savedList.id.toString(),
                familyId: savedList.family_id.toString(),
              },
            );
            console.log(
              `[ShoppingListService] 📤 Direct Firebase push sent: ${pushResult.success} success, ${pushResult.failed} failed`,
            );
          } catch (firebaseError) {
            console.error('[ShoppingListService] ⚠️ Direct Firebase push error:', firebaseError);
          }
        }
      } catch (error) {
        // Log lỗi nhưng không throw để không ảnh hưởng đến việc share
        console.error('Error sending notification for shopping list share:', error);
      }
    }

    return savedList;
  }



  /** Cập nhật danh sách */
  async update(id: number, updateDto: UpdateShoppingListDto, user: JwtUser): Promise<ShoppingList> {
    const list = await this.findOne(id, user);

    Object.assign(list, updateDto);
    return await this.shoppingListRepo.save(list);
  }

  /** Xóa danh sách */
  async remove(id: number, user: JwtUser): Promise<void> {
    const list = await this.findOne(id, user);

    // Xóa tất cả items trong list trước
    await this.shoppingItemRepo.delete({ list_id: id });

    // Sau đó xóa list
    await this.shoppingListRepo.remove(list);
  }

  /** Tính toán lại tổng chi phí của shopping list dựa trên items */
  async recalculateShoppingListCost(listId: number): Promise<ShoppingList> {
    const list = await this.shoppingListRepo.findOne({
      where: { id: listId },
      relations: ['items'],
    });

    if (!list) {
      throw new NotFoundException(ResponseMessageVi[ResponseCode.C00260]);
    }

    // Tính tổng: SUM(price * stock / 1000) cho tất cả items
    // price là đơn giá /kg, stock là gram => chia 1000 để ra đơn vị đồng
    let totalCost = 0;
    if (list.items && list.items.length > 0) {
      totalCost = list.items.reduce((sum, item) => {
        const price = Number(item.price) || 0;
        const stock = Number(item.stock) || 0;
        // price/kg * gram / 1000 = giá cuối cùng
        return sum + (price * stock / 1000);
      }, 0);
    }

    // Làm tròn 2 chữ số thập phân
    list.cost = Number(totalCost.toFixed(2));

    return await this.shoppingListRepo.save(list);
  }
}
