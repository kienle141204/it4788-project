// Định nghĩa mã lỗi chuẩn dùng xuyên suốt hệ thống (NestJS)
// Ghi chú: Giữ nội dung ngắn gọn, chuyên nghiệp, phục vụ hiển thị/ghi log.

export enum ErrorCode {
  SUCCESS = 'SUCCESS',
  BAD_REQUEST = 'BAD_REQUEST',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMITED = 'RATE_LIMITED',
  DATABASE_ERROR = 'DATABASE_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

// Thông điệp tiếng Việt mặc định cho từng mã lỗi
export const ErrorMessageVi: Record<ErrorCode, string> = {
  [ErrorCode.SUCCESS]: 'Thành công',
  [ErrorCode.BAD_REQUEST]: 'Yêu cầu không hợp lệ',
  [ErrorCode.VALIDATION_ERROR]: 'Dữ liệu không hợp lệ',
  [ErrorCode.UNAUTHORIZED]: 'Chưa xác thực',
  [ErrorCode.FORBIDDEN]: 'Không có quyền truy cập',
  [ErrorCode.NOT_FOUND]: 'Không tìm thấy',
  [ErrorCode.CONFLICT]: 'Xung đột dữ liệu',
  [ErrorCode.RATE_LIMITED]: 'Vượt quá giới hạn yêu cầu',
  [ErrorCode.DATABASE_ERROR]: 'Lỗi cơ sở dữ liệu',
  [ErrorCode.INTERNAL_ERROR]: 'Lỗi hệ thống',
};

// Kiểu dữ liệu phản hồi lỗi thống nhất
export interface ErrorResponseBody {
  code: ErrorCode;
  message: string;
  details?: unknown;
}

// Mã lỗi nghiệp vụ theo bảng yêu cầu (định dạng 5 chữ số dạng chuỗi)
export enum ResponseCode {
  C00005 = '00005',
  C00006 = '00006',
  C00007 = '00007',
  C00008 = '00008',
  C00009 = '00009',
  C00011 = '00011',
  C00012 = '00012',
  C00017 = '00017',
  C00019 = '00019',
  C00021 = '00021',
  C00022 = '00022',
  C00023 = '00023',
  C00024 = '00024',
  C00025 = '00025',
  C00026 = '00026',
  C00027 = '00027',
  C00028 = '00028',
  C00029 = '00029',
  C00032 = '00032',
  C00035 = '00035',
}

// Thông điệp tiếng Việt cho từng mã nghiệp vụ
export const ResponseMessageVi: Record<ResponseCode, string> = {
  [ResponseCode.C00005]: 'Vui lòng cung cấp đầy đủ thông tin để gửi mã.',
  [ResponseCode.C00006]: 'Truy cập bị từ chối. Không có token được cung cấp.',
  [ResponseCode.C00007]: 'ID người dùng không hợp lệ.',
  [ResponseCode.C00008]: 'Đã xảy ra lỗi máy chủ nội bộ, vui lòng thử lại.',
  [ResponseCode.C00009]:'Không thể tìm thấy người dùng đã xác minh với mã và ID được cung cấp. Hãy đảm bảo rằng tài khoản đã được xác minh và kích hoạt.',
  [ResponseCode.C00011]: 'Phiên của bạn đã hết hạn, vui lòng đăng nhập lại.',
  [ResponseCode.C00012]: 'Token không hợp lệ. Token có thể đã hết hạn.',
  [ResponseCode.C00017]: 'Truy cập bị từ chối. Bạn không có quyền truy cập.',
  [ResponseCode.C00019]: 'Truy cập bị từ chối. Bạn không có quyền truy cập.',
  [ResponseCode.C00021]: 'Truy cập bị từ chối. Bạn không có quyền truy cập.',
  [ResponseCode.C00022]: 'Không có ID được cung cấp trong tham số. Vui lòng nhập một ID.',
  [ResponseCode.C00023]: 'ID được cung cấp không phải là một đối tượng ID hợp lệ.',
  [ResponseCode.C00024]: 'Quá nhiều yêu cầu.',
  [ResponseCode.C00025]: 'Vui lòng cung cấp tất cả các trường bắt buộc!',
  [ResponseCode.C00026]: 'Vui lòng cung cấp một địa chỉ email hợp lệ!',
  [ResponseCode.C00027]: 'Vui lòng cung cấp mật khẩu dài hơn 6 ký tự và ngắn hơn 20 ký tự.',
  [ResponseCode.C00028]: 'Vui lòng cung cấp một tên dài hơn 3 ký tự và ngắn hơn 30 ký tự.',
  [ResponseCode.C00029]: 'Vui lòng cung cấp một địa chỉ email hợp lệ!',
  [ResponseCode.C00032]: 'Một tài khoản với địa chỉ email này đã tồn tại.',
  [ResponseCode.C00035]: 'Bạn đã đăng ký thành công.',
};

// Tiện ích tạo body lỗi theo mã nghiệp vụ
export function buildResponseError(
  code: ResponseCode,
  details?: unknown,
): ErrorResponseBody {
  return {
    code: ErrorCode.BAD_REQUEST,
    message: ResponseMessageVi[code],
    details,
  };
}


