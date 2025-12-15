
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

// Mã lỗi nghiệp vụ cho các chức năng hiện có trong hệ thống
export enum ResponseCode {
  // Authentication & User Management
  C00005 = '00005', // Vui lòng cung cấp đầy đủ thông tin để gửi mã
  C00006 = '00006', // Truy cập bị từ chối. Không có token được cung cấp
  C00007 = '00007', // ID người dùng không hợp lệ
  C00008 = '00008', // Đã xảy ra lỗi máy chủ nội bộ, vui lòng thử lại
  C00009 = '00009', // Không thể tìm thấy người dùng đã xác minh với mã và ID được cung cấp
  C00011 = '00011', // Phiên của bạn đã hết hạn, vui lòng đăng nhập lại
  C00012 = '00012', // Token không hợp lệ. Token có thể đã hết hạn
  C00017 = '00017', // Truy cập bị từ chối. Bạn không có quyền truy cập
  C00025 = '00025', // Vui lòng cung cấp tất cả các trường bắt buộc!
  C00026 = '00026', // Vui lòng cung cấp một địa chỉ email hợp lệ!
  C00027 = '00027', // Vui lòng cung cấp mật khẩu dài hơn 6 ký tự và ngắn hơn 20 ký tự
  C00028 = '00028', // Vui lòng cung cấp một tên dài hơn 3 ký tự và ngắn hơn 30 ký tự
  C00032 = '00032', // Một tài khoản với địa chỉ email này đã tồn tại
  C00035 = '00035', // Bạn đã đăng ký thành công
  C00036 = '00036', // Không tìm thấy tài khoản với địa chỉ email này
  C00043 = '00043', // Email của bạn chưa được kích hoạt, vui lòng đăng ký trước
  C00044 = '00044', // Email của bạn chưa được xác minh, vui lòng xác minh email của bạn
  C00045 = '00045', // Bạn đã nhập một email hoặc mật khẩu không hợp lệ
  C00047 = '00047', // Bạn đã đăng nhập thành công
  C00048 = '00048', // Mã đã được gửi đến email của bạn thành công
  C00050 = '00050', // Đăng xuất thành công
  C00052 = '00052', // Không thể tìm thấy người dùng
  C00053 = '00053', // Vui lòng gửi một mã xác nhận
  C00054 = '00054', // Mã bạn nhập không khớp với mã chúng tôi đã gửi đến email của bạn
  C00055 = '00055', // Token không hợp lệ. Token có thể đã hết hạn
  C00056 = '00056', // Mã OTP đã hết hạn. Vui lòng gửi lại mã mới
  C00058 = '00058', // Địa chỉ email của bạn đã được xác minh thành công
  C00059 = '00059', // Vui lòng cung cấp token làm mới
  C00061 = '00061', // Token được cung cấp không khớp với người dùng, vui lòng đăng nhập
  C00062 = '00062', // Token đã hết hạn, vui lòng đăng nhập
  C00063 = '00063', // Không thể xác minh token, vui lòng đăng nhập
  C00065 = '00065', // Token đã được làm mới thành công
  C00086 = '00086', // Thông tin hồ sơ của bạn đã được thay đổi thành công
  C00089 = '00089', // Thông tin người dùng đã được lấy thành công

  // Dish Management
  C00100 = '00100', // Không tìm thấy món ăn
  C00101 = '00101', // Tạo món ăn thành công
  C00102 = '00102', // Lấy danh sách món ăn thành công
  C00103 = '00103', // Lấy thông tin món ăn thành công
  C00104 = '00104', // Tìm kiếm món ăn thành công
  C00105 = '00105', // Lấy top món ăn theo rating thành công
  C00106 = '00106', // Lấy top món ăn được thêm vào menu thành công
  C00107 = '00107', // Lấy dinh dưỡng của món ăn thành công

  // Recipe Management
  C00110 = '00110', // Không tìm thấy công thức
  C00111 = '00111', // Tạo công thức thành công
  C00112 = '00112', // Lấy danh sách công thức thành công
  C00113 = '00113', // Lấy thông tin công thức thành công
  C00114 = '00114', // Cập nhật công thức thành công
  C00115 = '00115', // Xóa công thức thành công
  C00116 = '00116', // Bạn đã tạo công thức cho món ăn này rồi
  C00117 = '00117', // Bạn không có quyền chỉnh sửa công thức này
  C00118 = '00118', // Bạn không có quyền xóa công thức này
  C00119 = '00119', // Không tìm thấy món ăn để tạo công thức
  C00120 = '00120', // Lấy công thức theo món ăn thành công
  C00121 = '00121', // Lấy công thức của user thành công
  C00122 = '00122', // Lấy công thức phổ biến thành công
  C00123 = '00123', // Tìm kiếm công thức thành công

  // Menu Management
  C00130 = '00130', // Không tìm thấy menu
  C00131 = '00131', // Tạo menu thành công
  C00132 = '00132', // Lấy danh sách menu thành công
  C00133 = '00133', // Lấy thông tin menu thành công
  C00134 = '00134', // Thêm món ăn vào menu thành công
  C00135 = '00135', // Cập nhật món ăn trong menu thành công
  C00136 = '00136', // Xóa món ăn khỏi menu thành công
  C00137 = '00137', // Xóa menu thành công
  C00138 = '00138', // Bạn không có quyền tạo menu cho gia đình này
  C00139 = '00139', // Bạn không có quyền chỉnh sửa menu này
  C00140 = '00140', // Bạn không có quyền xóa menu này
  C00141 = '00141', // Món ăn này đã có trong menu
  C00142 = '00142', // Không tìm thấy món ăn trong menu
  C00143 = '00143', // Không tìm thấy gia đình

  // Dish Review Management
  C00150 = '00150', // Không tìm thấy đánh giá
  C00151 = '00151', // Tạo đánh giá thành công
  C00152 = '00152', // Lấy đánh giá thành công
  C00153 = '00153', // Lấy thống kê đánh giá thành công
  C00154 = '00154', // Cập nhật đánh giá thành công
  C00155 = '00155', // Xóa đánh giá thành công
  C00156 = '00156', // Bạn đã đánh giá món ăn này rồi
  C00157 = '00157', // Bạn không có quyền chỉnh sửa đánh giá này
  C00158 = '00158', // Bạn không có quyền xóa đánh giá này
  C00159 = '00159', // Đánh giá không hợp lệ (rating phải từ 1-5)

  // Favorite Dish Management
  C00160 = '00160', // Không tìm thấy món ăn yêu thích
  C00161 = '00161', // Thêm món ăn vào danh sách yêu thích thành công
  C00162 = '00162', // Lấy danh sách món ăn yêu thích thành công
  C00163 = '00163', // Lấy thông tin món ăn yêu thích thành công
  C00164 = '00164', // Xóa món ăn khỏi danh sách yêu thích thành công
  C00165 = '00165', // Kiểm tra món ăn yêu thích thành công
  C00166 = '00166', // Món ăn đã có trong danh sách yêu thích
  C00167 = '00167', // Món ăn không có trong danh sách yêu thích

  // Consumption History Management
  C00170 = '00170', // Không tìm thấy bản ghi lịch sử tiêu thụ
  C00171 = '00171', // Bạn không có quyền truy cập dữ liệu này
  C00172 = '00172', // Bạn chưa thuộc gia đình nào
  C00173 = '00173', // Bạn không thuộc gia đình này
  C00174 = '00174', // Bạn không có quyền truy cập thống kê gia đình
  C00175 = '00175', // Tạo mới bản ghi lịch sử tiêu thụ thành công
  C00176 = '00176', // Lấy ra toàn bộ lịch sử tiêu thụ thành công
  C00177 = '00177', // Lấy ra bản ghi lịch sử tiêu thụ theo ID thành công
  C00178 = '00178', // Cập nhật bản ghi lịch sử tiêu thụ thành công
  C00179 = '00179', // Xóa bản ghi lịch sử tiêu thụ thành công
  C00180 = '00180', // Ghi log tiêu thụ thành công
  C00181 = '00181', // Lấy ra thống kê tiêu thụ theo tháng trong năm thành công
  C00182 = '00182', // Lấy ra top nguyên liệu/món ăn được tiêu thụ nhiều nhất thành công
  C00183 = '00183', // Lấy thống kê tiêu thụ theo tháng trong năm của gia đình thành công
  C00184 = '00184', // Lấy top nguyên liệu/món ăn được tiêu thụ nhiều nhất trong gia đình thành công
  C00185 = '00185', // Lấy ra thống kê tiêu thụ theo user thành công
  C00186 = '00186', // Lấy ra thống kê tiêu thụ theo family thành công

  // Family Management
  C00190 = '00190', // Không tìm thấy gia đình
  C00191 = '00191', // Bạn không phải chủ hay admin
  C00192 = '00192', // Bạn không phải thành viên của gia đình này
  C00193 = '00193', // Mã mời không hợp lệ
  C00194 = '00194', // Bạn đã là thành viên của gia đình này
  C00195 = '00195', // Bạn là chủ nhóm duy nhất. Vui lòng xóa nhóm hoặc chuyển quyền chủ nhóm trước khi rời
  C00196 = '00196', // Bạn là chủ nhóm. Vui lòng chuyển quyền chủ nhóm cho người khác trước khi rời
  C00197 = '00197', // Tạo gia đình thành công
  C00198 = '00198', // Thêm thành viên vào gia đình thành công
  C00199 = '00199', // Gia nhập gia đình thành công
  C00200 = '00200', // Rời khỏi gia đình thành công
  C00201 = '00201', // Lấy danh sách gia đình thành công
  C00202 = '00202', // Lấy thông tin gia đình thành công
  C00203 = '00203', // Lấy danh sách thành viên thành công
  C00204 = '00204', // Lấy mã mời thành công
  C00205 = '00205', // Cập nhật gia đình thành công
  C00206 = '00206', // Xóa gia đình thành công
  C00207 = '00207', // Lấy các nhóm gia đình có người dùng là thành viên thành công
}

// Thông điệp tiếng Việt cho từng mã nghiệp vụ
export const ResponseMessageVi: Record<ResponseCode, string> = {
  // Authentication & User Management
  [ResponseCode.C00005]: 'Vui lòng cung cấp đầy đủ thông tin để gửi mã.',
  [ResponseCode.C00006]: 'Truy cập bị từ chối. Không có token được cung cấp.',
  [ResponseCode.C00007]: 'ID người dùng không hợp lệ.',
  [ResponseCode.C00008]: 'Đã xảy ra lỗi máy chủ nội bộ, vui lòng thử lại.',
  [ResponseCode.C00009]: 'Không thể tìm thấy người dùng đã xác minh với mã và ID được cung cấp. Hãy đảm bảo rằng tài khoản đã được xác minh và kích hoạt.',
  [ResponseCode.C00011]: 'Phiên của bạn đã hết hạn, vui lòng đăng nhập lại.',
  [ResponseCode.C00012]: 'Token không hợp lệ. Token có thể đã hết hạn.',
  [ResponseCode.C00017]: 'Truy cập bị từ chối. Bạn không có quyền truy cập.',
  [ResponseCode.C00025]: 'Vui lòng cung cấp tất cả các trường bắt buộc!',
  [ResponseCode.C00026]: 'Vui lòng cung cấp một địa chỉ email hợp lệ!',
  [ResponseCode.C00027]: 'Vui lòng cung cấp mật khẩu dài hơn 6 ký tự và ngắn hơn 20 ký tự.',
  [ResponseCode.C00028]: 'Vui lòng cung cấp một tên dài hơn 3 ký tự và ngắn hơn 30 ký tự.',
  [ResponseCode.C00032]: 'Một tài khoản với địa chỉ email này đã tồn tại.',
  [ResponseCode.C00035]: 'Bạn đã đăng ký thành công.',
  [ResponseCode.C00036]: 'Không tìm thấy tài khoản với địa chỉ email này.',
  [ResponseCode.C00043]: 'Email của bạn chưa được kích hoạt, vui lòng đăng ký trước.',
  [ResponseCode.C00044]: 'Email của bạn chưa được xác minh, vui lòng xác minh email của bạn.',
  [ResponseCode.C00045]: 'Bạn đã nhập một email hoặc mật khẩu không hợp lệ.',
  [ResponseCode.C00047]: 'Bạn đã đăng nhập thành công.',
  [ResponseCode.C00048]: 'Mã đã được gửi đến email của bạn thành công.',
  [ResponseCode.C00050]: 'Đăng xuất thành công.',
  [ResponseCode.C00052]: 'Không thể tìm thấy người dùng.',
  [ResponseCode.C00053]: 'Vui lòng gửi một mã xác nhận.',
  [ResponseCode.C00054]: 'Mã bạn nhập không khớp với mã chúng tôi đã gửi đến email của bạn. Vui lòng kiểm tra lại.',
  [ResponseCode.C00055]: 'Token không hợp lệ. Token có thể đã hết hạn.',
  [ResponseCode.C00056]: 'Mã OTP đã hết hạn. Vui lòng gửi lại mã mới.',
  [ResponseCode.C00058]: 'Địa chỉ email của bạn đã được xác minh thành công.',
  [ResponseCode.C00059]: 'Vui lòng cung cấp token làm mới.',
  [ResponseCode.C00061]: 'Token được cung cấp không khớp với người dùng, vui lòng đăng nhập.',
  [ResponseCode.C00062]: 'Token đã hết hạn, vui lòng đăng nhập.',
  [ResponseCode.C00063]: 'Không thể xác minh token, vui lòng đăng nhập.',
  [ResponseCode.C00065]: 'Token đã được làm mới thành công.',
  [ResponseCode.C00086]: 'Thông tin hồ sơ của bạn đã được thay đổi thành công.',
  [ResponseCode.C00089]: 'Thông tin người dùng đã được lấy thành công.',

  // Dish Management
  [ResponseCode.C00100]: 'Không tìm thấy món ăn.',
  [ResponseCode.C00101]: 'Tạo món ăn thành công.',
  [ResponseCode.C00102]: 'Lấy danh sách món ăn thành công.',
  [ResponseCode.C00103]: 'Lấy thông tin món ăn thành công.',
  [ResponseCode.C00104]: 'Tìm kiếm món ăn thành công.',
  [ResponseCode.C00105]: 'Lấy top món ăn theo rating thành công.',
  [ResponseCode.C00106]: 'Lấy top món ăn được thêm vào menu thành công.',
  [ResponseCode.C00107]: 'Lấy dinh dưỡng của món ăn thành công.',

  // Recipe Management
  [ResponseCode.C00110]: 'Không tìm thấy công thức.',
  [ResponseCode.C00111]: 'Tạo công thức thành công.',
  [ResponseCode.C00112]: 'Lấy danh sách công thức thành công.',
  [ResponseCode.C00113]: 'Lấy thông tin công thức thành công.',
  [ResponseCode.C00114]: 'Cập nhật công thức thành công.',
  [ResponseCode.C00115]: 'Xóa công thức thành công.',
  [ResponseCode.C00116]: 'Bạn đã tạo công thức cho món ăn này rồi.',
  [ResponseCode.C00117]: 'Bạn không có quyền chỉnh sửa công thức này.',
  [ResponseCode.C00118]: 'Bạn không có quyền xóa công thức này.',
  [ResponseCode.C00119]: 'Không tìm thấy món ăn để tạo công thức.',
  [ResponseCode.C00120]: 'Lấy công thức theo món ăn thành công.',
  [ResponseCode.C00121]: 'Lấy công thức của user thành công.',
  [ResponseCode.C00122]: 'Lấy công thức phổ biến thành công.',
  [ResponseCode.C00123]: 'Tìm kiếm công thức thành công.',

  // Menu Management
  [ResponseCode.C00130]: 'Không tìm thấy menu.',
  [ResponseCode.C00131]: 'Tạo menu thành công.',
  [ResponseCode.C00132]: 'Lấy danh sách menu thành công.',
  [ResponseCode.C00133]: 'Lấy thông tin menu thành công.',
  [ResponseCode.C00134]: 'Thêm món ăn vào menu thành công.',
  [ResponseCode.C00135]: 'Cập nhật món ăn trong menu thành công.',
  [ResponseCode.C00136]: 'Xóa món ăn khỏi menu thành công.',
  [ResponseCode.C00137]: 'Xóa menu thành công.',
  [ResponseCode.C00138]: 'Bạn không có quyền tạo menu cho gia đình này.',
  [ResponseCode.C00139]: 'Bạn không có quyền chỉnh sửa menu này.',
  [ResponseCode.C00140]: 'Bạn không có quyền xóa menu này.',
  [ResponseCode.C00141]: 'Món ăn này đã có trong menu.',
  [ResponseCode.C00142]: 'Không tìm thấy món ăn trong menu.',
  [ResponseCode.C00143]: 'Không tìm thấy gia đình.',

  // Dish Review Management
  [ResponseCode.C00150]: 'Không tìm thấy đánh giá.',
  [ResponseCode.C00151]: 'Tạo đánh giá thành công.',
  [ResponseCode.C00152]: 'Lấy đánh giá thành công.',
  [ResponseCode.C00153]: 'Lấy thống kê đánh giá thành công.',
  [ResponseCode.C00154]: 'Cập nhật đánh giá thành công.',
  [ResponseCode.C00155]: 'Xóa đánh giá thành công.',
  [ResponseCode.C00156]: 'Bạn đã đánh giá món ăn này rồi.',
  [ResponseCode.C00157]: 'Bạn không có quyền chỉnh sửa đánh giá này.',
  [ResponseCode.C00158]: 'Bạn không có quyền xóa đánh giá này.',
  [ResponseCode.C00159]: 'Đánh giá không hợp lệ (rating phải từ 1-5).',

  // Favorite Dish Management
  [ResponseCode.C00160]: 'Không tìm thấy món ăn yêu thích.',
  [ResponseCode.C00161]: 'Thêm món ăn vào danh sách yêu thích thành công.',
  [ResponseCode.C00162]: 'Lấy danh sách món ăn yêu thích thành công.',
  [ResponseCode.C00163]: 'Lấy thông tin món ăn yêu thích thành công.',
  [ResponseCode.C00164]: 'Xóa món ăn khỏi danh sách yêu thích thành công.',
  [ResponseCode.C00165]: 'Kiểm tra món ăn yêu thích thành công.',
  [ResponseCode.C00166]: 'Món ăn đã có trong danh sách yêu thích.',
  [ResponseCode.C00167]: 'Món ăn không có trong danh sách yêu thích.',

  // Consumption History Management
  [ResponseCode.C00170]: 'Không tìm thấy bản ghi lịch sử tiêu thụ.',
  [ResponseCode.C00171]: 'Bạn không có quyền truy cập dữ liệu này.',
  [ResponseCode.C00172]: 'Bạn chưa thuộc gia đình nào.',
  [ResponseCode.C00173]: 'Bạn không thuộc gia đình này.',
  [ResponseCode.C00174]: 'Bạn không có quyền truy cập thống kê gia đình.',
  [ResponseCode.C00175]: 'Tạo mới bản ghi lịch sử tiêu thụ thành công.',
  [ResponseCode.C00176]: 'Lấy ra toàn bộ lịch sử tiêu thụ thành công.',
  [ResponseCode.C00177]: 'Lấy ra bản ghi lịch sử tiêu thụ theo ID thành công.',
  [ResponseCode.C00178]: 'Cập nhật bản ghi lịch sử tiêu thụ thành công.',
  [ResponseCode.C00179]: 'Xóa bản ghi lịch sử tiêu thụ thành công.',
  [ResponseCode.C00180]: 'Ghi log tiêu thụ thành công.',
  [ResponseCode.C00181]: 'Lấy ra thống kê tiêu thụ theo tháng trong năm thành công.',
  [ResponseCode.C00182]: 'Lấy ra top nguyên liệu/món ăn được tiêu thụ nhiều nhất thành công.',
  [ResponseCode.C00183]: 'Lấy thống kê tiêu thụ theo tháng trong năm của gia đình thành công.',
  [ResponseCode.C00184]: 'Lấy top nguyên liệu/món ăn được tiêu thụ nhiều nhất trong gia đình thành công.',
  [ResponseCode.C00185]: 'Lấy ra thống kê tiêu thụ theo user thành công.',
  [ResponseCode.C00186]: 'Lấy ra thống kê tiêu thụ theo family thành công.',
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

// Tiện ích tạo response thành công
export function buildSuccessResponse(
  code: ResponseCode,
  data?: unknown,
  details?: unknown,
): { success: boolean; message: string; data?: unknown; details?: unknown } {
  return {
    success: true,
    message: ResponseMessageVi[code],
    data,
    details,
  };
}
