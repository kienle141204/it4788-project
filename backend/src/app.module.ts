import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    // Cấu hình biến môi trường (toàn cục)
    ConfigModule.forRoot({ isGlobal: true }),

    // Kết nối MySQL qua TypeORM, đọc từ biến môi trường
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const sslCaPath = config.get<string>('DB_SSL_CA_PATH');
        const extra = sslCaPath
          ? {
              ssl: {
                rejectUnauthorized: true,
                ca: require('fs').readFileSync(sslCaPath, 'utf8'),
              },
            }
          : {
              // Tạm thời cho phép nếu chưa có CA (khuyến nghị bật verify ở production)
              ssl: { rejectUnauthorized: false },
            };

        return {
          type: 'mysql',
          host: config.get<string>('DB_HOST'),
          port: Number(config.get<string>('DB_PORT')),
          username: config.get<string>('DB_USER'),
          password: config.get<string>('DB_PASS'),
          database: config.get<string>('DB_NAME'),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: false,
          ssl: true,
          extra,
        };
      },
    }),

    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
