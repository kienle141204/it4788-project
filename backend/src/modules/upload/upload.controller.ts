import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { CloudinaryService } from './cloudinary.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { memoryStorage } from 'multer';

@ApiTags('Upload')
@Controller('api/upload')
export class UploadController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('file')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req, file, cb) => {
        // Cho phép tất cả các loại file
        cb(null, true);
      },
    }),
  )
  @ApiOperation({
    summary: 'Upload file lên Cloudinary',
    description:
      'API này cho phép upload file (ảnh, video, tài liệu) lên Cloudinary và trả về URL của file. Yêu cầu đăng nhập.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File cần upload (ảnh, video, hoặc tài liệu)',
        },
        folder: {
          type: 'string',
          description: 'Thư mục lưu trữ trên Cloudinary (tùy chọn)',
          example: 'avatars',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Upload file thành công',
    example: {
      success: true,
      message: 'Upload file thành công',
      data: {
        url: 'https://res.cloudinary.com/your-cloud/image/upload/v1234567890/example.jpg',
        public_id: 'example',
        secure_url:
          'https://res.cloudinary.com/your-cloud/image/upload/v1234567890/example.jpg',
        format: 'jpg',
        width: 1920,
        height: 1080,
        bytes: 123456,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'File không hợp lệ hoặc quá lớn (tối đa 10MB)' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập hoặc token không hợp lệ' })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    const folder = req.body?.folder;
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file để upload');
    }

    try {
      const result = await this.cloudinaryService.uploadFile(file, folder);

      return {
        success: true,
        message: 'Upload file thành công',
        data: {
          url: result.secure_url,
          public_id: result.public_id,
          secure_url: result.secure_url,
          format: result.format,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
          resource_type: result.resource_type,
        },
      };
    } catch (error) {
      throw new BadRequestException(
        `Lỗi khi upload file: ${error.message || 'Unknown error'}`,
      );
    }
  }
}

