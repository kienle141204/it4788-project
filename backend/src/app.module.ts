import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { FamilyModule } from './modules/family/family.module';
import { MemberModule } from './modules/member/member.module';
import { ShoppingListModule } from './modules/shopping-list/shopping-list.module';
import { ShoppingItemModule } from './modules/shopping-item/shopping-item.module';
import { DishModule } from './modules/dish/dish.module';
import { RecipeModule } from './modules/recipe/recipe.module';
import { MenuModule } from './modules/menu/menu.module';
import { IngredientModule } from './modules/ingredient/ingredient.module';
import { RefrigeratorModule } from './modules/refrigerator/refrigerator.module';
import { NutrientModule } from './modules/nutrient/nutrient.module';

@Module({
  imports: [
    // Cấu hình biến môi trường (toàn cục)
    ConfigModule.forRoot({ isGlobal: true }),

    // Kết nối MySQL qua TypeORM, đọc từ biến môi trường
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const dbConfig = {
          type: 'mysql' as const,
          host: config.get<string>('DB_HOST'),
          port: Number(config.get<string>('DB_PORT')),
          username: config.get<string>('DB_USER'),
          password: config.get<string>('DB_PASS'),
          database: config.get<string>('DB_NAME'),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: false,
          logging: true, // Bật logging để debug
          // Cấu hình timezone
          timezone: '+07:00', // GMT+7 (Vietnam timezone)
          // Cấu hình SSL để tắt hoàn toàn
          extra: {
            ssl: false,
            // Connection options hợp lệ cho MySQL2
            connectionLimit: 10,
            // Thêm timezone cho MySQL2
            timezone: '+07:00',
          },
        };
        console.log('Database config:', {
          host: dbConfig.host,
          port: dbConfig.port,
          database: dbConfig.database,
          username: dbConfig.username,
          timezone: dbConfig.timezone,
          extra_ssl: dbConfig.extra.ssl,
        });
        return dbConfig;
      },
    }),
    
    UserModule,
    AuthModule,
    FamilyModule,
    MemberModule,
    ShoppingListModule,
    ShoppingItemModule,
    DishModule,
    RecipeModule,
    MenuModule,
    IngredientModule,
    RefrigeratorModule,
    NutrientModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
