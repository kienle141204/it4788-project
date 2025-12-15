import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ResponseCode, ResponseMessageVi, ResponseMessageEn } from '../errors/error-codes';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let resultCode: string | null = null;
    let resultMessage: { en: string; vn: string } | null = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      // Lấy message từ exception
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        message = (exceptionResponse as any).message || exception.message || 'An error occurred';
      } else {
        message = exception.message || 'An error occurred';
      }

      // Tìm ResponseCode tương ứng với message
      resultCode = this.findResponseCodeByMessage(message);
      
      if (resultCode) {
        resultMessage = {
          en: ResponseMessageEn[resultCode as ResponseCode],
          vn: ResponseMessageVi[resultCode as ResponseCode],
        };
      } else {
        // Nếu không tìm thấy, tạo message mặc định
        resultMessage = {
          en: this.getDefaultErrorMessage(status),
          vn: message,
        };
      }
    } else {
      // Exception không phải HttpException
      message = exception instanceof Error ? exception.message : 'Internal server error';
      resultMessage = {
        en: 'Internal server error',
        vn: 'Lỗi máy chủ nội bộ',
      };
    }

    const errorResponse: any = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      error: HttpStatus[status] || 'Error',
    };

    // Thêm resultCode và resultMessage nếu có
    if (resultCode) {
      errorResponse.resultCode = resultCode;
    }
    if (resultMessage) {
      errorResponse.resultMessage = resultMessage;
    }

    response.status(status).json(errorResponse);
  }

  /**
   * Tìm ResponseCode dựa vào message (tiếng Việt)
   */
  private findResponseCodeByMessage(message: string): string | null {
    // Duyệt qua tất cả ResponseCode để tìm message khớp
    for (const [code, viMessage] of Object.entries(ResponseMessageVi)) {
      if (viMessage === message || message.includes(viMessage.replace('.', ''))) {
        return code;
      }
    }
    return null;
  }

  /**
   * Lấy error message mặc định theo status code
   */
  private getDefaultErrorMessage(status: number): string {
    const messages: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      409: 'Conflict',
      500: 'Internal Server Error',
    };
    return messages[status] || 'An error occurred';
  }
}

