
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

  // Member Management
  C00210 = '00210', // Không tìm thấy gia đình
  C00211 = '00211', // Bạn không thể thêm người này vào trong gia đình
  C00212 = '00212', // Người này đã có trong gia đình
  C00213 = '00213', // Không tìm thấy thành viên
  C00214 = '00214', // Người này chưa thuộc bất kì gia đình nào
  C00215 = '00215', // Không tìm thấy nhóm gia đình
  C00216 = '00216', // Bạn không có quyền thay đổi vai trò của người này
  C00217 = '00217', // Bạn không thể xóa thành viên khỏi gia đình này
  C00219 = '00219', // Thêm thành viên vào gia đình thành công
  C00220 = '00220', // Cập nhật vai trò thành viên thành công
  C00221 = '00221', // Xóa thành viên khỏi gia đình thành công
  C00222 = '00222', // Lấy danh sách thành viên thành công
  C00223 = '00223', // Lấy thông tin thành viên thành công

  // Refrigerator Management
  C00230 = '00230', // Không tìm thấy tủ lạnh
  C00231 = '00231', // Bạn không thể tạo vì không phải là chủ hộ
  C00232 = '00232', // Tủ lạnh cho hộ này đã tồn tại
  C00233 = '00233', // Bạn không thể gán chủ sở hữu khác chính mình
  C00234 = '00234', // Bạn không có quyền truy cập tủ lạnh này
  C00235 = '00235', // Bạn không có quyền thêm món ăn vào tủ này
  C00236 = '00236', // Không tìm thấy nguyên liệu
  C00237 = '00237', // Không tìm thấy món ăn trong tủ lạnh
  C00238 = '00238', // Không tìm thấy nguyên liệu trong tủ lạnh
  C00239 = '00239', // Tạo tủ lạnh thành công
  C00240 = '00240', // Lấy danh sách tủ lạnh thành công
  C00241 = '00241', // Lấy thông tin tủ lạnh thành công
  C00242 = '00242', // Cập nhật tủ lạnh thành công
  C00243 = '00243', // Xóa tủ lạnh thành công
  C00244 = '00244', // Thêm món ăn vào tủ lạnh thành công
  C00245 = '00245', // Cập nhật món ăn trong tủ lạnh thành công
  C00246 = '00246', // Xóa món ăn khỏi tủ lạnh thành công
  C00247 = '00247', // Thêm nguyên liệu vào tủ lạnh thành công
  C00248 = '00248', // Cập nhật nguyên liệu trong tủ lạnh thành công
  C00249 = '00249', // Xóa nguyên liệu khỏi tủ lạnh thành công
  C00250 = '00250', // Gợi ý món ăn thành công

  // Shopping List Management
  C00260 = '00260', // Không tìm thấy danh sách mua sắm
  C00261 = '00261', // Bạn không thể tạo cho người này
  C00262 = '00262', // Bạn không có quyền giao nhiệm vụ cho người khác
  C00263 = '00263', // Bạn không có quyền truy cập danh sách mua sắm này
  C00264 = '00264', // Tạo danh sách mua sắm thành công
  C00265 = '00265', // Lấy danh sách mua sắm thành công
  C00266 = '00266', // Lấy thông tin danh sách mua sắm thành công
  C00267 = '00267', // Cập nhật danh sách mua sắm thành công
  C00268 = '00268', // Xóa danh sách mua sắm thành công

  // Shopping Statistics Management
  C00270 = '00270', // Bạn không có quyền truy cập thống kê của gia đình này
  C00271 = '00271', // Lấy thống kê chi phí theo tháng thành công
  C00272 = '00272', // Lấy số lượng item đã check thành công
  C00273 = '00273', // Lấy thống kê thành công

  // Nutrient Management
  C00280 = '00280', // Không tìm thấy dinh dưỡng
  C00281 = '00281', // Lấy danh sách dinh dưỡng thành công
  C00282 = '00282', // Lấy thông tin dinh dưỡng thành công
  C00283 = '00283', // Lấy dinh dưỡng của món ăn thành công

  // Notification Management
  C00290 = '00290', // Không tìm thấy thông báo
  C00291 = '00291', // Bạn không có quyền truy cập thông báo này
  C00292 = '00292', // Lấy danh sách thông báo thành công
  C00293 = '00293', // Lấy thông báo chưa đọc thành công
  C00294 = '00294', // Lấy số lượng thông báo chưa đọc thành công
  C00295 = '00295', // Đánh dấu thông báo đã đọc thành công
  C00296 = '00296', // Đánh dấu tất cả thông báo đã đọc thành công
  C00297 = '00297', // Xóa thông báo thành công
  C00298 = '00298', // Xóa tất cả thông báo thành công

  // Ingredient Management
  C00300 = '00300', // Không tìm thấy nguyên liệu
  C00301 = '00301', // Danh mục không tồn tại
  C00302 = '00302', // Địa chỉ không tồn tại
  C00303 = '00303', // Tạo nguyên liệu thành công
  C00304 = '00304', // Lấy danh sách nguyên liệu thành công
  C00305 = '00305', // Lấy thông tin nguyên liệu thành công
  C00306 = '00306', // Cập nhật nguyên liệu thành công
  C00307 = '00307', // Xóa nguyên liệu thành công
  C00308 = '00308', // Tìm kiếm nguyên liệu thành công

  // Market Management
  C00310 = '00310', // Latitude và longitude là bắt buộc
  C00311 = '00311', // Latitude hoặc longitude không hợp lệ
  C00312 = '00312', // Lấy danh sách cửa hàng thành công

  // User Management (additional)
  C00320 = '00320', // Email hoặc số điện thoại đã tồn tại
  C00321 = '00321', // Email đã được sử dụng bởi người dùng khác
  C00322 = '00322', // Số điện thoại đã được sử dụng bởi người dùng khác
  C00323 = '00323', // Cập nhật thông tin người dùng thành công
  C00324 = '00324', // Xóa người dùng thành công

  // Upload Management
  C00330 = '00330', // Vui lòng chọn file để upload
  C00331 = '00331', // Upload file thành công
  C00332 = '00332', // Xóa file thành công
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

  // Family Management
  [ResponseCode.C00190]: 'Không tìm thấy gia đình.',
  [ResponseCode.C00191]: 'Bạn không phải chủ hay admin.',
  [ResponseCode.C00192]: 'Bạn không phải thành viên của gia đình này.',
  [ResponseCode.C00193]: 'Mã mời không hợp lệ.',
  [ResponseCode.C00194]: 'Bạn đã là thành viên của gia đình này.',
  [ResponseCode.C00195]: 'Bạn là chủ nhóm duy nhất. Vui lòng xóa nhóm hoặc chuyển quyền chủ nhóm trước khi rời.',
  [ResponseCode.C00196]: 'Bạn là chủ nhóm. Vui lòng chuyển quyền chủ nhóm cho người khác trước khi rời.',
  [ResponseCode.C00197]: 'Tạo gia đình thành công.',
  [ResponseCode.C00198]: 'Thêm thành viên vào gia đình thành công.',
  [ResponseCode.C00199]: 'Gia nhập gia đình thành công.',
  [ResponseCode.C00200]: 'Rời khỏi gia đình thành công.',
  [ResponseCode.C00201]: 'Lấy danh sách gia đình thành công.',
  [ResponseCode.C00202]: 'Lấy thông tin gia đình thành công.',
  [ResponseCode.C00203]: 'Lấy danh sách thành viên thành công.',
  [ResponseCode.C00204]: 'Lấy mã mời thành công.',
  [ResponseCode.C00205]: 'Cập nhật gia đình thành công.',
  [ResponseCode.C00206]: 'Xóa gia đình thành công.',
  [ResponseCode.C00207]: 'Lấy các nhóm gia đình có người dùng là thành viên thành công.',

  // Member Management
  [ResponseCode.C00210]: 'Không tìm thấy gia đình.',
  [ResponseCode.C00211]: 'Bạn không thể thêm người này vào trong gia đình.',
  [ResponseCode.C00212]: 'Người này đã có trong gia đình.',
  [ResponseCode.C00213]: 'Không tìm thấy thành viên.',
  [ResponseCode.C00214]: 'Người này chưa thuộc bất kì gia đình nào.',
  [ResponseCode.C00215]: 'Không tìm thấy nhóm gia đình.',
  [ResponseCode.C00216]: 'Bạn không có quyền thay đổi vai trò của người này.',
  [ResponseCode.C00217]: 'Bạn không thể xóa thành viên khỏi gia đình này.',
  [ResponseCode.C00219]: 'Thêm thành viên vào gia đình thành công.',
  [ResponseCode.C00220]: 'Cập nhật vai trò thành viên thành công.',
  [ResponseCode.C00221]: 'Xóa thành viên khỏi gia đình thành công.',
  [ResponseCode.C00222]: 'Lấy danh sách thành viên thành công.',
  [ResponseCode.C00223]: 'Lấy thông tin thành viên thành công.',

  // Refrigerator Management
  [ResponseCode.C00230]: 'Không tìm thấy tủ lạnh.',
  [ResponseCode.C00231]: 'Bạn không thể tạo vì không phải là chủ hộ.',
  [ResponseCode.C00232]: 'Tủ lạnh cho hộ này đã tồn tại.',
  [ResponseCode.C00233]: 'Bạn không thể gán chủ sở hữu khác chính mình.',
  [ResponseCode.C00234]: 'Bạn không có quyền truy cập tủ lạnh này.',
  [ResponseCode.C00235]: 'Bạn không có quyền thêm món ăn vào tủ này.',
  [ResponseCode.C00236]: 'Không tìm thấy nguyên liệu.',
  [ResponseCode.C00237]: 'Không tìm thấy món ăn trong tủ lạnh.',
  [ResponseCode.C00238]: 'Không tìm thấy nguyên liệu trong tủ lạnh.',
  [ResponseCode.C00239]: 'Tạo tủ lạnh thành công.',
  [ResponseCode.C00240]: 'Lấy danh sách tủ lạnh thành công.',
  [ResponseCode.C00241]: 'Lấy thông tin tủ lạnh thành công.',
  [ResponseCode.C00242]: 'Cập nhật tủ lạnh thành công.',
  [ResponseCode.C00243]: 'Xóa tủ lạnh thành công.',
  [ResponseCode.C00244]: 'Thêm món ăn vào tủ lạnh thành công.',
  [ResponseCode.C00245]: 'Cập nhật món ăn trong tủ lạnh thành công.',
  [ResponseCode.C00246]: 'Xóa món ăn khỏi tủ lạnh thành công.',
  [ResponseCode.C00247]: 'Thêm nguyên liệu vào tủ lạnh thành công.',
  [ResponseCode.C00248]: 'Cập nhật nguyên liệu trong tủ lạnh thành công.',
  [ResponseCode.C00249]: 'Xóa nguyên liệu khỏi tủ lạnh thành công.',
  [ResponseCode.C00250]: 'Gợi ý món ăn thành công.',

  // Shopping List Management
  [ResponseCode.C00260]: 'Không tìm thấy danh sách mua sắm.',
  [ResponseCode.C00261]: 'Bạn không thể tạo cho người này.',
  [ResponseCode.C00262]: 'Bạn không có quyền giao nhiệm vụ cho người khác.',
  [ResponseCode.C00263]: 'Bạn không có quyền truy cập danh sách mua sắm này.',
  [ResponseCode.C00264]: 'Tạo danh sách mua sắm thành công.',
  [ResponseCode.C00265]: 'Lấy danh sách mua sắm thành công.',
  [ResponseCode.C00266]: 'Lấy thông tin danh sách mua sắm thành công.',
  [ResponseCode.C00267]: 'Cập nhật danh sách mua sắm thành công.',
  [ResponseCode.C00268]: 'Xóa danh sách mua sắm thành công.',

  // Shopping Statistics Management
  [ResponseCode.C00270]: 'Bạn không có quyền truy cập thống kê của gia đình này.',
  [ResponseCode.C00271]: 'Lấy thống kê chi phí theo tháng thành công.',
  [ResponseCode.C00272]: 'Lấy số lượng item đã check thành công.',
  [ResponseCode.C00273]: 'Lấy thống kê thành công.',

  // Nutrient Management
  [ResponseCode.C00280]: 'Không tìm thấy dinh dưỡng.',
  [ResponseCode.C00281]: 'Lấy danh sách dinh dưỡng thành công.',
  [ResponseCode.C00282]: 'Lấy thông tin dinh dưỡng thành công.',
  [ResponseCode.C00283]: 'Lấy dinh dưỡng của món ăn thành công.',

  // Notification Management
  [ResponseCode.C00290]: 'Không tìm thấy thông báo.',
  [ResponseCode.C00291]: 'Bạn không có quyền truy cập thông báo này.',
  [ResponseCode.C00292]: 'Lấy danh sách thông báo thành công.',
  [ResponseCode.C00293]: 'Lấy thông báo chưa đọc thành công.',
  [ResponseCode.C00294]: 'Lấy số lượng thông báo chưa đọc thành công.',
  [ResponseCode.C00295]: 'Đánh dấu thông báo đã đọc thành công.',
  [ResponseCode.C00296]: 'Đánh dấu tất cả thông báo đã đọc thành công.',
  [ResponseCode.C00297]: 'Xóa thông báo thành công.',
  [ResponseCode.C00298]: 'Xóa tất cả thông báo thành công.',

  // Ingredient Management
  [ResponseCode.C00300]: 'Không tìm thấy nguyên liệu.',
  [ResponseCode.C00301]: 'Danh mục không tồn tại.',
  [ResponseCode.C00302]: 'Địa chỉ không tồn tại.',
  [ResponseCode.C00303]: 'Tạo nguyên liệu thành công.',
  [ResponseCode.C00304]: 'Lấy danh sách nguyên liệu thành công.',
  [ResponseCode.C00305]: 'Lấy thông tin nguyên liệu thành công.',
  [ResponseCode.C00306]: 'Cập nhật nguyên liệu thành công.',
  [ResponseCode.C00307]: 'Xóa nguyên liệu thành công.',
  [ResponseCode.C00308]: 'Tìm kiếm nguyên liệu thành công.',

  // Market Management
  [ResponseCode.C00310]: 'Latitude và longitude là bắt buộc.',
  [ResponseCode.C00311]: 'Latitude hoặc longitude không hợp lệ.',
  [ResponseCode.C00312]: 'Lấy danh sách cửa hàng thành công.',

  // User Management (additional)
  [ResponseCode.C00320]: 'Email hoặc số điện thoại đã tồn tại.',
  [ResponseCode.C00321]: 'Email đã được sử dụng bởi người dùng khác.',
  [ResponseCode.C00322]: 'Số điện thoại đã được sử dụng bởi người dùng khác.',
  [ResponseCode.C00323]: 'Cập nhật thông tin người dùng thành công.',
  [ResponseCode.C00324]: 'Xóa người dùng thành công.',

  // Upload Management
  [ResponseCode.C00330]: 'Vui lòng chọn file để upload.',
  [ResponseCode.C00331]: 'Upload file thành công.',
  [ResponseCode.C00332]: 'Xóa file thành công.',
};

// Thông điệp tiếng Anh cho từng mã nghiệp vụ
export const ResponseMessageEn: Record<ResponseCode, string> = {
  // Authentication & User Management
  [ResponseCode.C00005]: 'Please provide complete information to send code.',
  [ResponseCode.C00006]: 'Access denied. No token provided.',
  [ResponseCode.C00007]: 'Invalid user ID.',
  [ResponseCode.C00008]: 'Internal server error occurred, please try again.',
  [ResponseCode.C00009]: 'Cannot find verified user with provided code and ID. Please ensure the account has been verified and activated.',
  [ResponseCode.C00011]: 'Your session has expired, please login again.',
  [ResponseCode.C00012]: 'Invalid token. Token may have expired.',
  [ResponseCode.C00017]: 'Access denied. You do not have permission.',
  [ResponseCode.C00025]: 'Please provide all required fields!',
  [ResponseCode.C00026]: 'Please provide a valid email address!',
  [ResponseCode.C00027]: 'Please provide a password longer than 6 characters and shorter than 20 characters.',
  [ResponseCode.C00028]: 'Please provide a name longer than 3 characters and shorter than 30 characters.',
  [ResponseCode.C00032]: 'An account with this email address already exists.',
  [ResponseCode.C00035]: 'You registered successfully.',
  [ResponseCode.C00036]: 'Account with this email address not found.',
  [ResponseCode.C00043]: 'Your email has not been activated, please register first.',
  [ResponseCode.C00044]: 'Your email has not been verified, please verify your email.',
  [ResponseCode.C00045]: 'You entered an invalid email or password.',
  [ResponseCode.C00047]: 'You logged in successfully.',
  [ResponseCode.C00048]: 'Code has been sent to your email successfully.',
  [ResponseCode.C00050]: 'Logged out successfully.',
  [ResponseCode.C00052]: 'User not found.',
  [ResponseCode.C00053]: 'Please send a verification code.',
  [ResponseCode.C00054]: 'The code you entered does not match the code we sent to your email. Please check again.',
  [ResponseCode.C00055]: 'Invalid token. Token may have expired.',
  [ResponseCode.C00056]: 'OTP code has expired. Please request a new code.',
  [ResponseCode.C00058]: 'Your email address has been verified successfully.',
  [ResponseCode.C00059]: 'Please provide refresh token.',
  [ResponseCode.C00061]: 'The provided token does not match the user, please login.',
  [ResponseCode.C00062]: 'Token has expired, please login.',
  [ResponseCode.C00063]: 'Cannot verify token, please login.',
  [ResponseCode.C00065]: 'Token has been refreshed successfully.',
  [ResponseCode.C00086]: 'Your profile information has been changed successfully.',
  [ResponseCode.C00089]: 'User information retrieved successfully.',

  // Dish Management
  [ResponseCode.C00100]: 'Dish not found.',
  [ResponseCode.C00101]: 'Dish created successfully.',
  [ResponseCode.C00102]: 'Dish list retrieved successfully.',
  [ResponseCode.C00103]: 'Dish information retrieved successfully.',
  [ResponseCode.C00104]: 'Dish search completed successfully.',
  [ResponseCode.C00105]: 'Top rated dishes retrieved successfully.',
  [ResponseCode.C00106]: 'Top menu dishes retrieved successfully.',
  [ResponseCode.C00107]: 'Dish nutrition retrieved successfully.',

  // Recipe Management
  [ResponseCode.C00110]: 'Recipe not found.',
  [ResponseCode.C00111]: 'Recipe created successfully.',
  [ResponseCode.C00112]: 'Recipe list retrieved successfully.',
  [ResponseCode.C00113]: 'Recipe information retrieved successfully.',
  [ResponseCode.C00114]: 'Recipe updated successfully.',
  [ResponseCode.C00115]: 'Recipe deleted successfully.',
  [ResponseCode.C00116]: 'You have already created a recipe for this dish.',
  [ResponseCode.C00117]: 'You do not have permission to edit this recipe.',
  [ResponseCode.C00118]: 'You do not have permission to delete this recipe.',
  [ResponseCode.C00119]: 'Dish not found to create recipe.',
  [ResponseCode.C00120]: 'Recipes by dish retrieved successfully.',
  [ResponseCode.C00121]: 'User recipes retrieved successfully.',
  [ResponseCode.C00122]: 'Popular recipes retrieved successfully.',
  [ResponseCode.C00123]: 'Recipe search completed successfully.',

  // Menu Management
  [ResponseCode.C00130]: 'Menu not found.',
  [ResponseCode.C00131]: 'Menu created successfully.',
  [ResponseCode.C00132]: 'Menu list retrieved successfully.',
  [ResponseCode.C00133]: 'Menu information retrieved successfully.',
  [ResponseCode.C00134]: 'Dish added to menu successfully.',
  [ResponseCode.C00135]: 'Menu dish updated successfully.',
  [ResponseCode.C00136]: 'Dish removed from menu successfully.',
  [ResponseCode.C00137]: 'Menu deleted successfully.',
  [ResponseCode.C00138]: 'You do not have permission to create menu for this family.',
  [ResponseCode.C00139]: 'You do not have permission to edit this menu.',
  [ResponseCode.C00140]: 'You do not have permission to delete this menu.',
  [ResponseCode.C00141]: 'This dish is already in the menu.',
  [ResponseCode.C00142]: 'Dish not found in menu.',
  [ResponseCode.C00143]: 'Family not found.',

  // Dish Review Management
  [ResponseCode.C00150]: 'Review not found.',
  [ResponseCode.C00151]: 'Review created successfully.',
  [ResponseCode.C00152]: 'Review retrieved successfully.',
  [ResponseCode.C00153]: 'Review statistics retrieved successfully.',
  [ResponseCode.C00154]: 'Review updated successfully.',
  [ResponseCode.C00155]: 'Review deleted successfully.',
  [ResponseCode.C00156]: 'You have already reviewed this dish.',
  [ResponseCode.C00157]: 'You do not have permission to edit this review.',
  [ResponseCode.C00158]: 'You do not have permission to delete this review.',
  [ResponseCode.C00159]: 'Invalid review (rating must be 1-5).',

  // Favorite Dish Management
  [ResponseCode.C00160]: 'Favorite dish not found.',
  [ResponseCode.C00161]: 'Dish added to favorites successfully.',
  [ResponseCode.C00162]: 'Favorite dishes list retrieved successfully.',
  [ResponseCode.C00163]: 'Favorite dish information retrieved successfully.',
  [ResponseCode.C00164]: 'Dish removed from favorites successfully.',
  [ResponseCode.C00165]: 'Favorite dish check completed successfully.',
  [ResponseCode.C00166]: 'Dish is already in favorites.',
  [ResponseCode.C00167]: 'Dish is not in favorites.',

  // Consumption History Management
  [ResponseCode.C00170]: 'Consumption record not found.',
  [ResponseCode.C00171]: 'You do not have permission to access this data.',
  [ResponseCode.C00172]: 'You are not a member of any family.',
  [ResponseCode.C00173]: 'You are not a member of this family.',
  [ResponseCode.C00174]: 'You do not have permission to access family statistics.',
  [ResponseCode.C00175]: 'Consumption record created successfully.',
  [ResponseCode.C00176]: 'Consumption history retrieved successfully.',
  [ResponseCode.C00177]: 'Consumption record retrieved successfully.',
  [ResponseCode.C00178]: 'Consumption record updated successfully.',
  [ResponseCode.C00179]: 'Consumption record deleted successfully.',
  [ResponseCode.C00180]: 'Consumption logged successfully.',
  [ResponseCode.C00181]: 'Monthly consumption statistics retrieved successfully.',
  [ResponseCode.C00182]: 'Top consumed items retrieved successfully.',
  [ResponseCode.C00183]: 'Family monthly consumption statistics retrieved successfully.',
  [ResponseCode.C00184]: 'Top consumed items in family retrieved successfully.',
  [ResponseCode.C00185]: 'User consumption statistics retrieved successfully.',
  [ResponseCode.C00186]: 'Family consumption statistics retrieved successfully.',

  // Family Management
  [ResponseCode.C00190]: 'Family not found.',
  [ResponseCode.C00191]: 'You are not the owner or admin.',
  [ResponseCode.C00192]: 'You are not a member of this family.',
  [ResponseCode.C00193]: 'Invalid invitation code.',
  [ResponseCode.C00194]: 'You are already a member of this family.',
  [ResponseCode.C00195]: 'You are the only owner. Please delete the group or transfer ownership before leaving.',
  [ResponseCode.C00196]: 'You are the owner. Please transfer ownership to someone else before leaving.',
  [ResponseCode.C00197]: 'Family created successfully.',
  [ResponseCode.C00198]: 'Member added to family successfully.',
  [ResponseCode.C00199]: 'Joined family successfully.',
  [ResponseCode.C00200]: 'Left family successfully.',
  [ResponseCode.C00201]: 'Family list retrieved successfully.',
  [ResponseCode.C00202]: 'Family information retrieved successfully.',
  [ResponseCode.C00203]: 'Family members list retrieved successfully.',
  [ResponseCode.C00204]: 'Invitation code retrieved successfully.',
  [ResponseCode.C00205]: 'Family updated successfully.',
  [ResponseCode.C00206]: 'Family deleted successfully.',
  [ResponseCode.C00207]: 'User families retrieved successfully.',

  // Member Management
  [ResponseCode.C00210]: 'Family not found.',
  [ResponseCode.C00211]: 'You cannot add this person to the family.',
  [ResponseCode.C00212]: 'This person is already in the family.',
  [ResponseCode.C00213]: 'Member not found.',
  [ResponseCode.C00214]: 'This person is not a member of any family.',
  [ResponseCode.C00215]: 'Family group not found.',
  [ResponseCode.C00216]: 'You do not have permission to change this person\'s role.',
  [ResponseCode.C00217]: 'You cannot remove members from this family.',
  [ResponseCode.C00219]: 'Member added to family successfully.',
  [ResponseCode.C00220]: 'Member role updated successfully.',
  [ResponseCode.C00221]: 'Member removed from family successfully.',
  [ResponseCode.C00222]: 'Members list retrieved successfully.',
  [ResponseCode.C00223]: 'Member information retrieved successfully.',

  // Refrigerator Management
  [ResponseCode.C00230]: 'Refrigerator not found.',
  [ResponseCode.C00231]: 'You cannot create because you are not the household owner.',
  [ResponseCode.C00232]: 'Refrigerator for this household already exists.',
  [ResponseCode.C00233]: 'You cannot assign ownership to someone other than yourself.',
  [ResponseCode.C00234]: 'You do not have permission to access this refrigerator.',
  [ResponseCode.C00235]: 'You do not have permission to add dishes to this refrigerator.',
  [ResponseCode.C00236]: 'Ingredient not found.',
  [ResponseCode.C00237]: 'Dish not found in refrigerator.',
  [ResponseCode.C00238]: 'Ingredient not found in refrigerator.',
  [ResponseCode.C00239]: 'Refrigerator created successfully.',
  [ResponseCode.C00240]: 'Refrigerator list retrieved successfully.',
  [ResponseCode.C00241]: 'Refrigerator information retrieved successfully.',
  [ResponseCode.C00242]: 'Refrigerator updated successfully.',
  [ResponseCode.C00243]: 'Refrigerator deleted successfully.',
  [ResponseCode.C00244]: 'Dish added to refrigerator successfully.',
  [ResponseCode.C00245]: 'Refrigerator dish updated successfully.',
  [ResponseCode.C00246]: 'Dish removed from refrigerator successfully.',
  [ResponseCode.C00247]: 'Ingredient added to refrigerator successfully.',
  [ResponseCode.C00248]: 'Refrigerator ingredient updated successfully.',
  [ResponseCode.C00249]: 'Ingredient removed from refrigerator successfully.',
  [ResponseCode.C00250]: 'Dish suggestions retrieved successfully.',

  // Shopping List Management
  [ResponseCode.C00260]: 'Shopping list not found.',
  [ResponseCode.C00261]: 'You cannot create for this person.',
  [ResponseCode.C00262]: 'You do not have permission to assign tasks to others.',
  [ResponseCode.C00263]: 'You do not have permission to access this shopping list.',
  [ResponseCode.C00264]: 'Shopping list created successfully.',
  [ResponseCode.C00265]: 'Shopping list retrieved successfully.',
  [ResponseCode.C00266]: 'Shopping list information retrieved successfully.',
  [ResponseCode.C00267]: 'Shopping list updated successfully.',
  [ResponseCode.C00268]: 'Shopping list deleted successfully.',

  // Shopping Statistics Management
  [ResponseCode.C00270]: 'You do not have permission to access this family\'s statistics.',
  [ResponseCode.C00271]: 'Monthly cost statistics retrieved successfully.',
  [ResponseCode.C00272]: 'Checked items count retrieved successfully.',
  [ResponseCode.C00273]: 'Statistics retrieved successfully.',

  // Nutrient Management
  [ResponseCode.C00280]: 'Nutrient not found.',
  [ResponseCode.C00281]: 'Nutrient list retrieved successfully.',
  [ResponseCode.C00282]: 'Nutrient information retrieved successfully.',
  [ResponseCode.C00283]: 'Dish nutrition retrieved successfully.',

  // Notification Management
  [ResponseCode.C00290]: 'Notification not found.',
  [ResponseCode.C00291]: 'You do not have permission to access this notification.',
  [ResponseCode.C00292]: 'Notifications list retrieved successfully.',
  [ResponseCode.C00293]: 'Unread notifications retrieved successfully.',
  [ResponseCode.C00294]: 'Unread notifications count retrieved successfully.',
  [ResponseCode.C00295]: 'Notification marked as read successfully.',
  [ResponseCode.C00296]: 'All notifications marked as read successfully.',
  [ResponseCode.C00297]: 'Notification deleted successfully.',
  [ResponseCode.C00298]: 'All notifications deleted successfully.',

  // Ingredient Management
  [ResponseCode.C00300]: 'Ingredient not found.',
  [ResponseCode.C00301]: 'Category does not exist.',
  [ResponseCode.C00302]: 'Place does not exist.',
  [ResponseCode.C00303]: 'Ingredient created successfully.',
  [ResponseCode.C00304]: 'Ingredient list retrieved successfully.',
  [ResponseCode.C00305]: 'Ingredient information retrieved successfully.',
  [ResponseCode.C00306]: 'Ingredient updated successfully.',
  [ResponseCode.C00307]: 'Ingredient deleted successfully.',
  [ResponseCode.C00308]: 'Ingredient search completed successfully.',

  // Market Management
  [ResponseCode.C00310]: 'Latitude and longitude are required.',
  [ResponseCode.C00311]: 'Invalid latitude or longitude.',
  [ResponseCode.C00312]: 'Store list retrieved successfully.',

  // User Management (additional)
  [ResponseCode.C00320]: 'Email or phone number already exists.',
  [ResponseCode.C00321]: 'Email is already used by another user.',
  [ResponseCode.C00322]: 'Phone number is already used by another user.',
  [ResponseCode.C00323]: 'User information updated successfully.',
  [ResponseCode.C00324]: 'User deleted successfully.',

  // Upload Management
  [ResponseCode.C00330]: 'Please select a file to upload.',
  [ResponseCode.C00331]: 'File uploaded successfully.',
  [ResponseCode.C00332]: 'File deleted successfully.',
};

// Tiện ích tạo body lỗi theo mã nghiệp vụ
export function buildResponseError(
  code: ResponseCode,
  details?: unknown,
): ErrorResponseBody & { resultCode: string; resultMessage: { en: string; vn: string } } {
  return {
    code: ErrorCode.BAD_REQUEST,
    message: ResponseMessageVi[code],
    details,
    resultCode: code,
    resultMessage: {
      en: ResponseMessageEn[code],
      vn: ResponseMessageVi[code],
    },
  };
}

// Tiện ích tạo response thành công
export function buildSuccessResponse(
  code: ResponseCode,
  data?: unknown,
  details?: unknown,
): { 
  success: boolean; 
  message: string; 
  resultCode: string;
  resultMessage: { en: string; vn: string };
  data?: unknown; 
  details?: unknown;
} {
  return {
    success: true,
    message: ResponseMessageVi[code],
    resultCode: code,
    resultMessage: {
      en: ResponseMessageEn[code],
      vn: ResponseMessageVi[code],
    },
    data,
    details,
  };
}
