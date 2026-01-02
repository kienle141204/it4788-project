# TÀI LIỆU THIẾT KẾ GIAO DIỆN ỨNG DỤNG

## MỤC LỤC
1. [Thiết kế Low-fidelity / Mid-fidelity Prototype](#1-thiết-kế-low-fidelity--mid-fidelity-prototype)
2. [Xây dựng các màn hình giao diện High-fidelity](#2-xây-dựng-các-màn-hình-giao-diện-high-fidelity)
3. [Sơ đồ điều hướng giữa các màn hình](#3-sơ-đồ-điều-hướng-giữa-các-màn-hình)

---

## 1. THIẾT KẾ LOW-FIDELITY / MID-FIDELITY PROTOTYPE


**Lưu ý:** Use case này được tích hợp như một tính năng mở rộng (extend) trong quá trình "Lên lịch bữa ăn", giúp người dùng nhận gợi ý các món ăn có thể nấu dựa trên thực phẩm hiện có trong tủ lạnh.

---

## 2. XÂY DỰNG CÁC MÀN HÌNH GIAO DIỆN HIGH-FIDELITY

### 2.1. Use Case: Xác thực người dùng

#### 2.1.1. Màn hình Đăng nhập (`(auth)/login.tsx`)

**A. Cấu trúc Layout (Component Tree):**
```
View (container)
├── View (brandSection)
│   ├── View
│   │   └── Text (title: "Đăng nhập")
│   ├── View (label)
│   │   └── Text (labelText: "Email của bạn")
│   ├── View (inputWrapper)
│   │   ├── Ionicons (mail-outline icon)
│   │   └── TextInput (email)
│   ├── View (label)
│   │   └── Text (labelText: "Mật khẩu")
│   ├── View (inputWrapper)
│   │   ├── Ionicons (lock-closed-outline icon)
│   │   └── TextInput (password với secureTextEntry)
│   ├── View (linkContainer)
│   │   ├── Link (forgotPassword)
│   │   └── Link (register)
│   ├── View (loginButton)
│   │   └── TouchableOpacity (login button với loading state)
│   ├── View (dividerContainer)
│   │   ├── View (line)
│   │   ├── Text ("Đăng nhập bằng cách khác")
│   │   └── View (line)
│   └── View (loginSection)
│       ├── TouchableOpacity (Google login button)
│       └── TouchableOpacity (Facebook login button)
```

**B. Xây dựng Themes và Styles:**

Mục tiêu của việc xây dựng themes và styles là đảm bảo thiết kế nhất quán và hiện đại cho toàn bộ ứng dụng. Ứng dụng sử dụng hệ thống màu sắc với màu chủ đạo là xanh lá (#388E3C) làm Primary Color, được áp dụng cho các nút bấm và các phần tử tương tác chính. Màu Secondary Color là xám (#BDBDBD), được sử dụng cho các placeholder và vùng nhập liệu để tạo sự phân biệt rõ ràng với các phần tử chính.

Về typography, ứng dụng sử dụng font size trong khoảng từ 14px đến 24px tùy theo mức độ quan trọng của nội dung. Các tiêu đề và nút bấm được áp dụng font weight w600 hoặc bold để tạo sự nổi bật và dễ đọc.

Đối với các TextField (ô nhập liệu), thiết kế sử dụng nền màu xám nhạt (Colors.grey[200]) để tạo sự khác biệt với nền chính. Mỗi TextField được trang bị một prefixIcon (biểu tượng ở đầu) để chỉ rõ loại dữ liệu cần nhập, ví dụ như icon email cho trường email, icon khóa cho trường mật khẩu. TextField có focus state (styles.inputFocused) được áp dụng khi người dùng đang nhập liệu vào trường đó, tạo phản hồi trực quan cho người dùng. Mỗi TextField có label riêng phía trên để hướng dẫn người dùng nhập liệu. Trường mật khẩu sử dụng `secureTextEntry` để ẩn văn bản khi nhập.

Các nút bấm trong ứng dụng được thiết kế với border radius 30 để tạo góc bo tròn mềm mại, tạo cảm giác hiện đại và thân thiện. Nút bấm có padding vertical 16px để đảm bảo kích thước đủ lớn cho thao tác chạm. Khi nút ở trạng thái enabled (có thể sử dụng), nền của nút sẽ là màu xanh lá (Primary Color). Văn bản trên nút sử dụng màu trắng với font weight w600 để đảm bảo độ tương phản và dễ đọc. Nút đăng nhập hiển thị ActivityIndicator khi đang trong quá trình xử lý (loading state), thay thế cho văn bản "Đăng nhập" để người dùng biết ứng dụng đang xử lý yêu cầu.

Đối với nút đăng ký (Registration Button), thiết kế tuân theo các quy tắc tương tự với border radius 30 và padding vertical 16px, đảm bảo tính nhất quán trong toàn bộ giao diện.

**C. Xử lý các dữ liệu người dùng nhập vào và cử chỉ:**

Việc quản lý dữ liệu người dùng nhập vào được thực hiện thông qua việc sử dụng state management cho mỗi trường dữ liệu. Mỗi TextField được liên kết với một state riêng biệt để theo dõi giá trị người dùng nhập vào: `email` và `password`. Ứng dụng cũng sử dụng state `focusedInput` để theo dõi trường nào đang được focus, cho phép áp dụng style focus tương ứng.

Hệ thống validation được thực hiện khi người dùng nhấn nút "Đăng nhập". Ứng dụng kiểm tra cơ bản xem email và password có được nhập hay không. Nếu thiếu thông tin, một Alert sẽ được hiển thị với thông báo "Vui lòng nhập đầy đủ thông tin!". Lỗi validation được hiển thị thông qua Alert.alert để thông báo cho người dùng.

Khi người dùng nhấn nút "Đăng nhập", ứng dụng sẽ thực hiện các bước sau:
1. Kiểm tra email và password không rỗng
2. Hiển thị loading state (ActivityIndicator) trên nút
3. Gửi HTTP request đến API backend thông qua hàm `loginUSer` với dữ liệu email và password
4. Xử lý response từ server:
   - Nếu có lỗi (statusCode tồn tại), hiển thị Alert với thông báo lỗi từ server
   - Nếu thành công, lưu `access_token` và `refresh_token` vào AsyncStorage
   - Đăng ký push notification token với backend
   - Điều hướng người dùng đến màn hình `../(tabs)/home`
5. Tắt loading state sau khi hoàn tất

Màn hình login cung cấp các liên kết điều hướng: "Quên mật khẩu?" dẫn đến màn hình `/forgotPassword` và "Bạn chưa có tài khoản?" dẫn đến màn hình `/register`. Ngoài ra, màn hình còn có các nút đăng nhập bằng Google và Facebook, được hiển thị với divider "Đăng nhập bằng cách khác" để phân tách với phương thức đăng nhập chính.

#### 2.1.2. Màn hình Đăng ký (`(auth)/register.tsx`)

**A. Cấu trúc Layout:**
```
View (container)
├── View (brandSection)
│   ├── View
│   │   └── Text (title: "Đăng ký tài khoản")
│   ├── View (label)
│   │   └── Text (labelText: "Email của bạn")
│   ├── View (inputWrapper)
│   │   ├── Ionicons (mail-outline icon)
│   │   └── TextInput (email)
│   ├── View (label)
│   │   └── Text (labelText: "Số điện thoại")
│   ├── View (inputWrapper)
│   │   ├── Ionicons (call-outline icon)
│   │   └── TextInput (phone)
│   ├── View (label)
│   │   └── Text (labelText: "Mật khẩu")
│   ├── View (inputWrapper)
│   │   ├── Ionicons (lock-closed-outline icon)
│   │   └── TextInput (password với secureTextEntry)
│   ├── View (label)
│   │   └── Text (labelText: "Nhập lại mật khẩu")
│   ├── View (inputWrapper)
│   │   ├── Ionicons (lock-closed-outline icon)
│   │   └── TextInput (repassword với secureTextEntry)
│   └── View (loginButton)
│       └── TouchableOpacity (register button với loading state)
```

**B. Xây dựng Themes và Styles:**

Màn hình đăng ký sử dụng cùng hệ thống themes và styles như màn hình đăng nhập để đảm bảo tính nhất quán. Các TextField có cùng thiết kế với focus state (styles.inputFocused) khi người dùng đang nhập liệu. Mỗi TextField có label riêng phía trên để hướng dẫn người dùng nhập liệu. Các trường mật khẩu sử dụng `secureTextEntry` để ẩn văn bản khi nhập.

Nút đăng ký (Registration Button) được thiết kế với các đặc điểm tương tự như nút đăng nhập: border radius 30 để tạo góc bo tròn mềm mại, padding vertical 16px để đảm bảo kích thước đủ lớn cho thao tác chạm. Khi nút ở trạng thái enabled, nền sẽ là màu xanh lá (Primary Color). Văn bản trên nút sử dụng màu trắng với font weight w600 để đảm bảo độ tương phản và dễ đọc. Nút đăng ký hiển thị ActivityIndicator khi đang trong quá trình xử lý (loading state), và nút sẽ bị disable khi đang loading để tránh submit nhiều lần.

**C. Xử lý các dữ liệu người dùng nhập vào và cử chỉ:**

Màn hình đăng ký quản lý các trường dữ liệu: email, số điện thoại, mật khẩu và nhập lại mật khẩu. Mỗi trường dữ liệu được quản lý thông qua state riêng biệt để theo dõi giá trị người dùng nhập vào: `email`, `phone`, `password`, và `repassword`. Ứng dụng cũng sử dụng state `focusedInput` để theo dõi trường nào đang được focus, cho phép áp dụng style focus tương ứng.

Hệ thống validation được thực hiện khi người dùng nhấn nút "Đăng ký". Ứng dụng kiểm tra xem mật khẩu và mật khẩu nhập lại có khớp nhau hay không. Nếu không khớp, một Alert sẽ được hiển thị với thông báo "Mật khẩu không khớp". Lỗi validation được hiển thị thông qua Alert.alert để thông báo cho người dùng.

Khi người dùng nhấn nút "Đăng ký", ứng dụng sẽ thực hiện các bước sau:
1. Kiểm tra mật khẩu và mật khẩu nhập lại có khớp nhau
2. Hiển thị loading state (ActivityIndicator) trên nút và disable nút để tránh submit nhiều lần
3. Gửi HTTP request đến API backend thông qua hàm `registerUser` với dữ liệu email, phone_number (từ phone state), và password
4. Xử lý response từ server:
   - Nếu thành công, điều hướng người dùng đến màn hình `/verify` với tham số email
   - Nếu có lỗi, hiển thị Alert với thông báo "Đăng ký thất bại"
5. Tắt loading state sau khi hoàn tất

Đối với trường số điện thoại, TextInput sử dụng `keyboardType='phone-pad'` để hiển thị bàn phím số điện thoại, giúp người dùng nhập liệu dễ dàng hơn. Trường email sử dụng `keyboardType='email-address'` và `autoCapitalize='none'` để tối ưu trải nghiệm nhập liệu.

Nút "Quay lại" được xử lý thông qua phương thức `Navigator.pop` (hoặc tương đương `router.back()` trong React Native) để quay lại màn hình trước đó trong stack navigation, cho phép người dùng dễ dàng quay lại màn hình đăng nhập nếu cần.

### 2.2. Use Case: Quản lí nhóm

#### 2.2.1. Màn hình Danh sách Nhóm (`(group)/index.tsx`)

**A. Cấu trúc Layout (Component Tree):**
```
View (container)
├── StatusBar
├── View (header)
│   ├── TouchableOpacity (back button)
│   ├── Text (title: "Nhóm Mua Sắm")
│   └── TouchableOpacity (menu button)
├── [Loading State]
│   └── View (loadingContainer)
│       ├── ActivityIndicator
│       └── Text ("Đang tải...")
├── [Content State]
│   └── ScrollView (với RefreshControl)
│       ├── [Error State]
│       │   └── View (errorContainer)
│       │       ├── Ionicons (alert icon)
│       │       ├── Text (error message)
│       │       └── TouchableOpacity (retry button)
│       ├── [Empty State]
│       │   └── View (emptyState)
│       │       ├── Ionicons (people icon)
│       │       ├── Text ("Chưa có nhóm nào")
│       │       └── Text (subtext)
│       └── [Family List]
│           ├── TouchableOpacity (familyCard) [mapped]
│           │   ├── View (avatarContainer)
│           │   │   └── View (avatarPlaceholder) / Image
│           │   │       └── Ionicons (people icon)
│           │   ├── View (familyInfo)
│           │   │   ├── Text (familyName)
│           │   │   ├── Text (shoppingInfo: "Danh sách tuần này" hoặc "Đã mua X/Y món")
│           │   │   └── Text (memberCount: "X thành viên")
│           │   └── TouchableOpacity (menu button)
│           └── TouchableOpacity (FAB - create family)
└── Modals
    ├── ActionMenu (headerMenu)
    ├── ActionMenu (familyMenu)
    ├── InvitationModal
    ├── JoinFamilyModal
    └── Modal (createFamilyModal)
        ├── View (modalHeader)
        │   ├── Text ("Tạo gia đình mới")
        │   └── TouchableOpacity (close button)
        ├── View (inputContainer)
        │   ├── Text (label: "Tên gia đình *")
        │   └── TextInput (newFamilyName)
        ├── View (infoBox)
        │   └── Text (info text)
        └── TouchableOpacity (create button với loading state)
```

**B. Xây dựng Themes và Styles:**

Màn hình quản lí nhóm sử dụng hệ thống themes và styles nhất quán với toàn bộ ứng dụng. Header của màn hình được thiết kế với nền trắng, có border bottom màu xám nhạt để tạo sự phân tách rõ ràng với phần nội dung. Các card hiển thị thông tin nhóm được thiết kế với nền trắng, border radius 16 để tạo góc bo tròn mềm mại, và có shadow nhẹ để tạo độ sâu. Mỗi card có padding 16px và margin ngang 20px, margin dọc 8px để tạo khoảng cách hợp lý giữa các card.

Avatar của nhóm được hiển thị trong một container tròn với kích thước 60x60 pixels, nền xám nhạt, và được căn giữa hoàn hảo. Avatar placeholder hiển thị icon "people" màu orange khi nhóm không có avatar riêng. Floating Action Button (FAB) để tạo nhóm mới được đặt ở góc dưới bên phải màn hình, có kích thước 56x56 pixels, nền màu purple (hoặc primary color tùy theme), và có shadow đậm hơn để nổi bật và dễ nhận biết. FAB chỉ hiển thị khi có danh sách nhóm (không hiển thị trong empty state hoặc error state).

**C. Xử lý các dữ liệu người dùng nhập vào và cử chỉ:**

Màn hình quản lí nhóm tự động tải danh sách nhóm khi được mở thông qua hàm `fetchFamilies()`. Hàm này lấy danh sách nhóm từ API và tính toán thống kê cho mỗi nhóm (số thành viên, số món đồ trong tuần này, số món đã mua/tổng số món).

Màn hình hỗ trợ pull-to-refresh để người dùng có thể kéo xuống để làm mới danh sách nhóm. Khi người dùng thực hiện thao tác này, ứng dụng sẽ gửi request mới đến server để lấy danh sách nhóm cập nhật nhất. Màu của indicator refresh được thiết lập là màu purple để phù hợp với theme của ứng dụng.

Người dùng có thể tap vào card nhóm để xem chi tiết nhóm (điều hướng đến `/(group)/${family.id}`), hoặc tap vào nút menu (ellipsis-vertical icon) trên card để mở menu tùy chọn nhóm. Menu này được hiển thị dưới dạng ActionMenu với các tùy chọn: "Xem chi tiết", "Xem mã mời" (chỉ dành cho owner/manager), "Xóa nhóm" (chỉ dành cho owner), và "Rời nhóm".

Tap vào nút menu ở header sẽ mở menu header với các tùy chọn: "Tham gia nhóm" (mở JoinFamilyModal) và "Thông báo" (điều hướng đến màn hình notifications).

Tap vào FAB (Floating Action Button) ở góc dưới bên phải sẽ mở modal tạo nhóm mới. Trong modal này, người dùng nhập tên gia đình và nhấn nút "Tạo gia đình". Ứng dụng sẽ lấy thông tin user profile để lấy owner_id, sau đó gửi request tạo nhóm. Nếu thành công, modal sẽ đóng và danh sách nhóm được làm mới.

Khi rời nhóm hoặc xóa nhóm, ứng dụng sẽ hiển thị Alert xác nhận trước khi thực hiện. Nếu người dùng là owner duy nhất, sẽ có thông báo yêu cầu chuyển quyền hoặc xóa nhóm trước khi rời.

#### 2.2.2. Màn hình Chi tiết Nhóm (`(group)/[id].tsx`)

**A. Cấu trúc Layout (Component Tree):**
```
View (container)
├── StatusBar
├── View (header)
│   ├── TouchableOpacity (back button)
│   ├── Text (familyName/title)
│   └── TouchableOpacity (menu button)
├── ScrollView (horizontal - tabs)
│   ├── TouchableOpacity (tab: shopping)
│   ├── TouchableOpacity (tab: chat)
│   └── TouchableOpacity (tab: statistics)
├── Conditional Content
│   ├── [Loading State]
│   │   └── ActivityIndicator
│   ├── [Chat Tab]
│   │   ├── KeyboardAvoidingView
│   │   │   ├── FlatList (chatMessages)
│   │   │   └── View (chatInputContainer)
│   │   │       ├── TextInput (message input)
│   │   │       └── TouchableOpacity (send button)
│   └── [Shopping/Statistics Tab]
│       └── ScrollView
│           ├── View (dateCarousel) [conditional - shopping tab]
│           │   ├── TouchableOpacity (prev date)
│           │   ├── ScrollView (horizontal)
│           │   │   └── TouchableOpacity (dateItem) [mapped]
│           │   └── TouchableOpacity (next date)
│           ├── View (shoppingListsContainer) [conditional - shopping tab]
│           │   └── View (shoppingListCard) [mapped]
│           │       ├── View (shoppingListHeader)
│           │       │   ├── Text (title)
│           │       │   ├── View (ownerInfo)
│           │       │   └── Text (cost)
│           │       ├── View (shoppingItemsContainer)
│           │       │   └── TouchableOpacity (shoppingItemRow) [mapped]
│           │       │       ├── TouchableOpacity (checkbox)
│           │       │       ├── Image (itemImage)
│           │       │       ├── View (itemInfo)
│           │       │       └── Text (itemQuantity)
│           │       ├── TouchableOpacity (addItemButton)
│           │       └── TouchableOpacity (deleteListButton)
│           └── GroupStatistics [conditional - statistics tab]
├── TouchableOpacity (FAB - create shopping list) [conditional - shopping tab]
└── Modals
    ├── ActionMenu (familyMenu)
    ├── ActionMenu (memberMenu)
    ├── InvitationModal
    ├── Modal (memberProfileModal)
    ├── Modal (membersListModal)
    │   ├── TextInput (search members)
    │   └── ScrollView (members list)
    ├── Modal (addShoppingListModal)
    │   ├── Text (date info)
    │   ├── View (assignMemberContainer) [conditional - manager]
    │   │   └── TouchableOpacity (member dropdown)
    │   └── TouchableOpacity (create button)
    └── Modal (addItemModal)
        ├── TextInput (search ingredients)
        ├── ScrollView (searchedIngredients) [conditional]
        ├── View (selectedIngredientCard) [conditional]
        ├── TextInput (stock input)
        ├── View (priceDisplay) [conditional]
        └── TouchableOpacity (add button)
```

**B. Xây dựng Themes và Styles:**

Màn hình chi tiết nhóm sử dụng hệ thống tabs để chuyển đổi giữa ba chức năng chính: Danh sách mua sắm, Trò chuyện, và Thống kê. Header được thiết kế với nền trắng, có nút quay lại ở bên trái, tiêu đề nhóm ở giữa, và nút menu ở bên phải. Các tabs được hiển thị trong một ScrollView ngang với style rõ ràng, tab active được highlight bằng màu xanh lá (Primary Color) để dễ nhận biết.

Trong tab Danh sách mua sắm, date carousel được đặt ở đầu màn hình cho phép người dùng chọn ngày một cách trực quan. Mỗi item ngày có kích thước tối thiểu, padding hợp lý, border radius 12, và nền xám nhạt. Khi ngày được chọn, nền sẽ chuyển sang màu xanh lá để báo hiệu trạng thái active.

Các card danh sách mua sắm được thiết kế với nền trắng, border radius hợp lý, padding đủ lớn, và shadow nhẹ. Header của mỗi card hiển thị tên danh sách, thông tin người được giao nhiệm vụ (nếu có), và tổng chi phí. Phần items được hiển thị dưới dạng danh sách với checkbox để đánh dấu đã mua, hình ảnh nguyên liệu, thông tin tên và số lượng, và giá tiền. Item đã được đánh dấu sẽ có style khác (gạch ngang, màu xám) để phân biệt.

Trong tab Trò chuyện, giao diện chat được thiết kế với FlatList để hiển thị tin nhắn, và phần input ở dưới cùng với TextInput và nút gửi. Tin nhắn của người dùng được căn phải với nền xanh lá, còn tin nhắn của người khác được căn trái với avatar và tên người gửi. KeyboardAvoidingView được sử dụng để đảm bảo phần input không bị che bởi bàn phím.

Floating Action Button (FAB) để tạo danh sách mua sắm mới được đặt ở góc dưới bên phải, chỉ hiển thị trong tab Danh sách mua sắm. Button có kích thước 56x56 pixels, nền màu xanh lá, và có shadow đậm để nổi bật.

Các modal được thiết kế với overlay màu đen mờ, nội dung modal có nền trắng, border radius lớn ở phần trên, và có header với tiêu đề và nút đóng. Modal thêm mặt hàng có phần tìm kiếm nguyên liệu với kết quả tìm kiếm hiển thị dưới dạng danh sách, và các trường nhập số lượng, hiển thị giá tự động tính toán.

**C. Xử lý các dữ liệu người dùng nhập vào và cử chỉ:**

Màn hình chi tiết nhóm tự động tải thông tin nhóm, danh sách thành viên, và danh sách mua sắm khi được mở. Khi màn hình được focus lại (ví dụ quay lại từ màn hình khác), dữ liệu sẽ được làm mới tự động để đảm bảo thông tin luôn cập nhật.

Người dùng có thể chuyển đổi giữa các tabs bằng cách tap vào tab tương ứng. Mỗi tab có nội dung riêng biệt: tab Danh sách mua sắm hiển thị các danh sách mua sắm với date carousel, tab Trò chuyện hiển thị giao diện chat, và tab Thống kê hiển thị các thống kê của nhóm.

Trong tab Danh sách mua sắm, người dùng có thể sử dụng date carousel để chọn ngày bằng cách tap vào item ngày, hoặc sử dụng nút mũi tên để chuyển sang ngày trước/sau. Danh sách mua sắm được lọc theo ngày đã chọn và hiển thị dưới dạng card. Tap vào checkbox hoặc item để đánh dấu đã mua/chưa mua, long press vào item để xóa item khỏi danh sách. Tap vào nút "Thêm mặt hàng" sẽ mở modal để tìm kiếm và thêm nguyên liệu vào danh sách.

Modal thêm mặt hàng cho phép người dùng tìm kiếm nguyên liệu bằng cách nhập tên vào TextInput. Kết quả tìm kiếm được hiển thị real-time khi người dùng nhập (tối thiểu 2 ký tự). Khi chọn một nguyên liệu, hệ thống sẽ tự động tính toán giá dựa trên số lượng nhập vào (giá trên kg nhân với số lượng gram chia 1000). Người dùng có thể chỉnh sửa số lượng và giá sẽ được cập nhật tự động.

Trong tab Trò chuyện, người dùng có thể nhập tin nhắn vào TextInput và nhấn nút gửi hoặc Enter để gửi tin nhắn. Tin nhắn được gửi qua WebSocket để đảm bảo real-time, và nếu WebSocket thất bại sẽ fallback về REST API. Tin nhắn mới được tự động thêm vào danh sách và cuộn xuống cuối để hiển thị tin nhắn mới nhất. FlatList tự động cuộn xuống cuối khi có tin nhắn mới hoặc khi người dùng gửi tin nhắn.

Người dùng có thể tap vào nút menu ở header để mở menu tùy chọn nhóm (xem thành viên, xem mã mời, xóa nhóm, rời nhóm). Tap vào thành viên trong modal danh sách thành viên sẽ mở menu tùy chọn thành viên (xem thông tin, cấp/bỏ quyền quản lý, xóa khỏi nhóm - chỉ dành cho quản lý). Tap vào "Xem thông tin" sẽ mở modal hiển thị thông tin chi tiết của thành viên bao gồm avatar, tên, email, số điện thoại, địa chỉ, và các thông tin hoạt động.

Màn hình hỗ trợ pull-to-refresh để làm mới dữ liệu khi người dùng kéo xuống. Trong tab Trò chuyện, pull-to-refresh sẽ làm mới danh sách tin nhắn. Trong các tab khác, pull-to-refresh sẽ làm mới thông tin nhóm và danh sách mua sắm.

#### 2.2.3. Màn hình Tạo Nhóm (`(group)/create.tsx`)

**A. Cấu trúc Layout (Component Tree):**
```
SafeAreaView
├── StatusBar
├── View (header)
│   ├── TouchableOpacity (back button)
│   ├── Text (title: "Tạo gia đình mới")
│   └── View (spacer)
├── ScrollView
│   ├── View (inputContainer)
│   │   ├── Text (label: "Tên gia đình *")
│   │   └── TextInput (name)
│   ├── View (infoBox)
│   │   ├── Ionicons (information-circle icon)
│   │   └── Text (info text)
│   └── TouchableOpacity (create button với loading state)
```

**B. Xây dựng Themes và Styles:**

Màn hình tạo nhóm sử dụng SafeAreaView để đảm bảo nội dung không bị che bởi notch hoặc status bar. Header được thiết kế với nền trắng, có border bottom màu xám nhạt, và có nút quay lại ở bên trái.

TextInput cho tên gia đình được thiết kế với nền trắng, border radius 12, padding 16px, và có border màu xám nhạt. Label phía trên có font size 16, font weight 600, và có dấu sao đỏ để đánh dấu trường bắt buộc.

Info box được thiết kế với nền xanh nhạt (#E0F2FE), border radius 12, padding 16px, và có icon thông tin màu xanh (#0EA5E9) kèm theo văn bản giải thích.

Nút "Tạo gia đình" được thiết kế với nền màu purple (#A855F7), border radius 12, padding 16px, và có loading state với ActivityIndicator khi đang xử lý. Nút sẽ bị disable khi đang loading để tránh submit nhiều lần.

**C. Xử lý các dữ liệu người dùng nhập vào và cử chỉ:**

Màn hình tạo nhóm quản lý trường dữ liệu `name` thông qua state để theo dõi giá trị người dùng nhập vào. Khi màn hình được mở, ứng dụng tự động lấy thông tin user profile từ API để lấy `owner_id` cần thiết cho việc tạo nhóm.

Khi người dùng nhấn nút "Tạo gia đình", ứng dụng sẽ:
1. Kiểm tra tên gia đình không rỗng (sau khi trim)
2. Kiểm tra user profile có `id` hợp lệ
3. Hiển thị loading state và disable nút
4. Gửi HTTP request đến API backend thông qua hàm `createFamily` với dữ liệu `name` và `owner_id`
5. Xử lý response:
   - Nếu thành công, hiển thị Alert "Thành công" và điều hướng về màn hình `/(group)`
   - Nếu có lỗi, hiển thị Alert với thông báo lỗi từ server
6. Tắt loading state sau khi hoàn tất

Nút quay lại sẽ điều hướng về màn hình trước đó nếu có thể, hoặc về màn hình `/(group)` nếu không thể quay lại.

### 2.3. Use Case: Lên lịch bữa ăn

#### 2.3.1. Màn hình Danh sách Thực đơn (`(meal)/index.tsx`)

**A. Cấu trúc Layout (Component Tree):**
```
View (container)
├── StatusBar
├── View (header)
│   ├── TouchableOpacity (back)
│   ├── Text (title)
│   └── View (spacer)
├── View (dateCarouselContainer)
│   ├── TouchableOpacity (prev button)
│   ├── ScrollView (horizontal - dateCarousel)
│   │   └── TouchableOpacity (dateItem) [mapped - 5 items]
│   │       ├── Text (weekday hoặc "Hôm nay")
│   │       └── Text (day number)
│   └── TouchableOpacity (next button)
├── [Loading State]
│   └── View (loadingContainer)
│       └── ActivityIndicator
├── [Content State]
│   └── ScrollView (với RefreshControl và infinite scroll)
│       ├── [Error State]
│       │   └── View (errorContainer)
│       │       └── Text (error message)
│       ├── [Empty State]
│       │   └── View (emptyState)
│       │       └── Text ("Chưa có thực đơn")
│       └── [Menu List]
│           └── View (menuCard) [mapped - filtered by selectedDate]
│               ├── TouchableOpacity (header - onPress expand, onLongPress menu)
│               │   ├── View (menuInfo)
│               │   │   └── Text (familyName)
│               │   └── View (menuDate)
│               │       ├── Ionicons (time icon)
│               │       ├── Text (time: "Bữa sáng/trưa/tối/phụ")
│               │       └── Ionicons (chevron up/down)
│               ├── Text (description) [conditional - nếu không có description]
│               └── View (expandedContent) [conditional - khi expanded]
│                   ├── Text (description) [conditional - nếu có]
│                   └── View (dishList)
│                       └── TouchableOpacity (dishCard) [mapped]
│                           ├── Image (dishImage) / View (placeholder với icon)
│                           ├── View (dishContent)
│                           │   ├── Text (dishName)
│                           │   ├── Text (stock: "Số lượng: X")
│                           │   └── Text (price: "X ₫")
│                           └── View (dishMeta)
└── Modal (menuOptionsModal)
    └── ActionMenu
        ├── TouchableOpacity (edit option)
        └── TouchableOpacity (delete option)
```

**B. Xây dựng Themes và Styles:**

Màn hình lên lịch bữa ăn sử dụng date carousel ở phần đầu để người dùng có thể chọn ngày một cách trực quan. Date carousel hiển thị 5 ngày: 2 ngày trước, ngày hiện tại, và 2 ngày sau (dựa trên dateOffset). Mỗi item ngày hiển thị thứ trong tuần (hoặc "Hôm nay" nếu là ngày hôm nay) và số ngày. Khi ngày được chọn, item sẽ được highlight với style active (thường là màu primary/purple). Các nút prev/next cho phép người dùng chuyển sang các ngày trước/sau.

Các card thực đơn được thiết kế với nền trắng, border radius hợp lý, padding đủ lớn, và có shadow nhẹ để tạo độ sâu. Header của card hiển thị tên gia đình và thời gian bữa ăn với icon thời gian. Card có thể expand/collapse để hiển thị mô tả và danh sách món ăn. Card món ăn bên trong có nền xám nhạt, border radius hợp lý, và hiển thị hình ảnh món ăn (hoặc placeholder icon nếu không có ảnh), tên món, số lượng và giá tiền.

**C. Xử lý các dữ liệu người dùng nhập vào và cử chỉ:**

Màn hình lên lịch bữa ăn tự động tải danh sách thực đơn khi được mở thông qua hàm `fetchMenus()` với pagination (page và limit). Màn hình sử dụng date carousel cho phép người dùng chọn ngày bằng cách tap vào item ngày, hoặc sử dụng nút mũi tên để chuyển sang các ngày trước/sau (thay đổi dateOffset). Date carousel hiển thị 5 ngày dựa trên dateOffset hiện tại. Ngày được chọn sẽ được highlight với style active để dễ nhận biết. Danh sách thực đơn được lọc theo ngày đã chọn (so sánh created_at với selectedDate) và hiển thị dưới dạng card có thể expand/collapse.

Người dùng có thể tap vào header của card thực đơn để mở rộng hoặc thu gọn (toggle expandedMenuId), xem danh sách món ăn bên trong. Long press vào card thực đơn sẽ mở modal menu tùy chọn với các option: "Sửa thực đơn" (điều hướng đến `/(meal)/edit-menu?id=${menu.id}`) và "Xóa thực đơn" (hiển thị Alert xác nhận trước khi xóa). Tap vào món ăn trong danh sách sẽ điều hướng đến màn hình chi tiết món ăn `/(food)/${dishId}`.

Màn hình hỗ trợ pull-to-refresh để làm mới danh sách thực đơn (reset về page 1), và infinite scroll để tải thêm thực đơn khi người dùng cuộn xuống cuối danh sách (tự động load page tiếp theo nếu hasNextPage = true). Màn hình cũng tự động refresh khi được focus lại (sử dụng useFocusEffect).

#### 2.3.2. Màn hình Tạo Thực đơn (`(meal)/create-menu.tsx`)

**A. Cấu trúc Layout (Component Tree):**
```
SafeAreaView
├── StatusBar
├── View (header)
│   ├── TouchableOpacity (back)
│   ├── Text (title: "Thêm thực đơn mới")
│   └── View (spacer)
├── ScrollView
│   ├── View (menuCard)
│   │   ├── Text (label: "Gia đình *")
│   │   └── TouchableOpacity (selectFamily)
│   │       ├── Text (selectedFamily name hoặc "Chọn gia đình")
│   │       └── Ionicons (chevron-down)
│   ├── View (menuCard)
│   │   ├── Text (label: "Bữa ăn *")
│   │   └── View (timeOptions - flexDirection row, flexWrap)
│   │       └── TouchableOpacity (timeButton) [mapped - 4 options]
│   │           └── Text (label: "Bữa sáng/trưa/tối/phụ")
│   ├── View (menuCard)
│   │   ├── Text (label: "Mô tả")
│   │   └── TextInput (description - multiline)
│   ├── View (menuCard)
│   │   ├── View (header - flexDirection row)
│   │   │   ├── Text (label: "Món ăn *")
│   │   │   └── TouchableOpacity (addDish button)
│   │   │       ├── Ionicons (add icon)
│   │   │       └── Text ("Thêm món")
│   │   └── View (selectedDishes)
│   │       ├── [Empty State]
│   │       │   └── Text ("Chưa có món ăn nào...")
│   │       └── View (dishItem) [mapped]
│   │           ├── Image (dishImage) / View (placeholder với icon)
│   │           ├── View (dishInfo)
│   │           │   ├── View (header - flexDirection row)
│   │           │   │   ├── Text (dishName)
│   │           │   │   └── TouchableOpacity (remove button)
│   │           │   └── View (inputs - flexDirection row)
│   │           │       ├── View (stockInput)
│   │           │       │   ├── Text (label: "Số lượng")
│   │           │       │   └── TextInput (stock - keyboardType numeric)
│   │           │       └── View (priceInput)
│   │           │           ├── Text (label: "Giá (₫)")
│   │           │           └── TextInput (price - keyboardType numeric)
│   │           └── View (spacer)
│   └── TouchableOpacity (createButton với loading state)
└── Modals
    ├── Modal (familyModal)
    │   └── FlatList (families)
    │       └── TouchableOpacity (familyItem)
    │           └── Text (familyName)
    └── Modal (dishModal)
        ├── View (searchContainer)
        │   └── TextInput (searchQuery)
        ├── [Loading State]
        │   └── ActivityIndicator
        └── FlatList (dishes với infinite scroll)
            └── TouchableOpacity (dishItem)
                ├── Image (dishImage) / View (placeholder)
                ├── View (dishInfo)
                │   ├── Text (dishName)
                │   └── Text (dishDescription) [conditional]
                └── Ionicons (add icon)
```

**B. Xây dựng Themes và Styles:**

Màn hình tạo thực đơn sử dụng SafeAreaView để đảm bảo nội dung không bị che bởi notch hoặc status bar. Header được thiết kế với nền trắng, có nút quay lại ở bên trái và tiêu đề ở giữa.

Các menuCard được thiết kế với nền trắng, border radius hợp lý, và padding đủ lớn. Time buttons được thiết kế với border, border radius 12, và khi được chọn sẽ có nền màu purple với text màu trắng. TextInput cho mô tả có minHeight 80px, multiline, và textAlignVertical top.

Dish items được thiết kế với nền xám nhạt (#F8F9FB), border radius 12, và có gap giữa các phần tử. Input fields cho stock và price có border, border radius 8, và sử dụng keyboardType numeric.

Nút "Tạo thực đơn" được thiết kế với nền màu purple, border radius hợp lý, và có loading state với ActivityIndicator khi đang xử lý.

**C. Xử lý các dữ liệu người dùng nhập vào và cử chỉ:**

Màn hình tạo thực đơn tự động tải danh sách gia đình khi được mở thông qua hàm `fetchFamilies()`. Màn hình quản lý các trường dữ liệu: `selectedFamilyId`, `time` (mặc định 'breakfast'), `description`, và `selectedDishes` (mảng các món ăn đã chọn với stock và price).

Khi người dùng tap vào "Chọn gia đình", modal hiển thị danh sách gia đình từ API. Khi chọn một gia đình, modal sẽ đóng và gia đình được chọn sẽ hiển thị trong input.

Time buttons cho phép người dùng chọn một trong 4 bữa ăn: "Bữa sáng", "Bữa trưa", "Bữa tối", "Bữa phụ". Button được chọn sẽ có style active (nền purple, text trắng).

Khi người dùng tap vào nút "Thêm món", modal hiển thị danh sách món ăn với chức năng tìm kiếm. Modal tự động tải danh sách món ăn khi được mở, và hỗ trợ infinite scroll để tải thêm món ăn. Người dùng có thể nhập từ khóa vào TextInput để tìm kiếm món ăn (tối thiểu 2 ký tự). Khi chọn một món ăn, món đó sẽ được thêm vào danh sách selectedDishes với stock mặc định 0 và price mặc định 0.

Đối với mỗi món ăn đã được thêm vào thực đơn, người dùng có thể nhập số lượng (stock) và giá (price) thông qua TextInput với keyboardType numeric. Khi người dùng thay đổi số lượng hoặc giá, hàm `handleUpdateDish` sẽ cập nhật state ngay lập tức. Người dùng có thể xóa món ăn khỏi danh sách bằng cách tap vào nút remove (close-circle icon).

Khi người dùng nhấn nút "Tạo thực đơn", hệ thống sẽ thực hiện validation:
1. Kiểm tra gia đình phải được chọn (selectedFamilyId không null)
2. Kiểm tra phải có ít nhất một món ăn trong danh sách (selectedDishes.length > 0)
3. Mô tả không bắt buộc (có thể để trống)

Nếu validation thành công, ứng dụng sẽ:
1. Hiển thị loading state và disable nút
2. Gửi POST request đến API để tạo menu với dữ liệu: family_id, time, description
3. Nhận menuId từ response
4. Gửi các POST request song song để thêm từng món ăn vào menu (menuId, dish_id, stock, price)
5. Nếu thành công, hiển thị Alert "Thành công" và điều hướng về màn hình trước đó hoặc home
6. Nếu có lỗi, hiển thị Alert với thông báo lỗi
7. Tắt loading state sau khi hoàn tất

### 2.4. Use Case: Quản lí công thức nấu ăn

#### 2.4.1. Màn hình Trang chủ (`(tabs)/home.tsx`)

**A. Cấu trúc Layout (Component Tree):**
```
View (container)
├── ScrollView
│   ├── Header
│   │   ├── View (topBar)
│   │   │   ├── View (userProfile)
│   │   │   │   ├── Image (avatar)
│   │   │   │   └── View (userInfo)
│   │   │   │       ├── Text (greeting)
│   │   │   │       └── Text (userName)
│   │   │   └── View (headerActions)
│   │   │       ├── TouchableOpacity (notification)
│   │   │       │   └── View (badge) [conditional]
│   │   │       └── TouchableOpacity (menu)
│   ├── TaskSummaryCard
│   │   ├── View (progressBar)
│   │   ├── Text (progressText)
│   │   └── TouchableOpacity (viewTasks)
│   └── View (featuresSection)
│       ├── Text (sectionTitle)
│       └── FeatureGrid
│           └── TouchableOpacity (featureCard) [mapped]
│               ├── View (iconContainer)
│               │   └── Ionicons
│               └── Text (featureName)
```

**B. Xây dựng Themes và Styles:**

Màn hình trang chủ sử dụng header với nền trắng, padding ngang 20px, padding trên 16px và padding dưới 20px. Phần top bar được bố trí theo chiều ngang với user profile ở bên trái và các action buttons (thông báo, menu) ở bên phải. Avatar người dùng được hiển thị trong một container tròn với kích thước 50x50 pixels, border radius 25 để tạo hình tròn hoàn hảo, và có margin phải 12px.

Nút thông báo có badge hiển thị số lượng thông báo chưa đọc, được đặt ở góc trên bên phải của icon. Badge có nền màu xanh lá (Primary Color), border radius 10, kích thước tối thiểu 20x20 pixels, và được căn giữa hoàn hảo. Phần features section có padding ngang 20px và margin dưới 20px để tạo khoảng cách hợp lý với các phần khác.

**C. Xử lý các dữ liệu người dùng nhập vào và cử chỉ:**

Màn hình trang chủ có grid các tính năng chính, mỗi tính năng là một card có thể tap để điều hướng đến màn hình tương ứng. Khi người dùng tap vào một tính năng, ứng dụng sẽ điều hướng đến màn hình tương ứng thông qua router. 

Đối với nút back trên Android, ứng dụng xử lý bằng cách yêu cầu người dùng nhấn hai lần liên tiếp trong vòng 2 giây để thoát ứng dụng. Lần nhấn đầu tiên sẽ hiển thị thông báo "Nhấn quay lại lần nữa để thoát ứng dụng", và nếu người dùng nhấn lại trong vòng 2 giây, ứng dụng sẽ thoát. Điều này giúp tránh việc thoát ứng dụng nhầm lẫn.

### 2.5. Use Case: Quản lí thực phẩm

#### 2.5.1. Màn hình Danh sách Tủ lạnh (`(fridge)/index.tsx`)

**A. Cấu trúc Layout:**
```
SafeAreaView
├── View (header)
├── ScrollView
│   └── View (fridgeCard) [mapped]
│       ├── View (fridgeHeader)
│       │   ├── Ionicons (fridgeIcon)
│       │   ├── Text (fridgeName)
│       │   └── TouchableOpacity (menu)
│       └── View (stats)
│           ├── Text (itemCount)
│           └── Text (expiringCount) [conditional]
```

**B. Xây dựng Themes và Styles:**

Màn hình quản lí thực phẩm sử dụng card layout để hiển thị danh sách các tủ lạnh. Mỗi card có header với icon tủ lạnh, tên tủ lạnh, và nút menu ở góc phải. Card có nền trắng, border radius hợp lý, và shadow nhẹ để tạo độ sâu. Phần thống kê hiển thị số lượng món và số món sắp hết hạn với màu sắc phù hợp để cảnh báo.

**C. Xử lý các dữ liệu người dùng nhập vào và cử chỉ:**

Người dùng có thể tap vào card tủ lạnh để xem chi tiết các thực phẩm bên trong. Long press vào card sẽ mở menu tùy chọn cho phép xóa hoặc chỉnh sửa thông tin tủ lạnh. Ứng dụng có thể hỗ trợ swipe gesture trong tương lai để xóa tủ lạnh một cách nhanh chóng.

### 2.6. Use Case: Quản lí danh sách mua sắm

### 2.7. Use Case: Xem báo cáo mua sắm và tiêu thụ

### 2.8. Use Case: Nhận gợi ý món ăn từ thực phẩm sẵn có

#### 2.6.1. Màn hình Danh sách Mua sắm (`(market)/market_screen.tsx`)

**A. Cấu trúc Layout:**
```
SafeAreaView
├── View (header)
├── ScrollView
│   └── View (shoppingListCard) [mapped]
│       ├── View (listHeader)
│       │   ├── Text (listName)
│       │   └── Text (date)
│       ├── View (progress)
│       │   └── Text (progressText)
│       └── View (itemsPreview)
│           └── FlatList (items)
```

**B. Xây dựng Themes và Styles:**

Màn hình quản lí danh sách mua sắm sử dụng card layout để hiển thị các danh sách mua sắm. Mỗi card có header hiển thị tên danh sách và ngày, phần progress hiển thị tiến độ mua sắm (số món đã mua/tổng số món), và phần preview các items. Card có nền trắng, border radius hợp lý, và shadow nhẹ.

**C. Xử lý các dữ liệu người dùng nhập vào và cử chỉ:**

Người dùng có thể sử dụng checkbox để đánh dấu các item đã mua, giúp theo dõi tiến độ mua sắm một cách trực quan. Swipe gesture được sử dụng để xóa item khỏi danh sách một cách nhanh chóng. Tap vào card danh sách sẽ điều hướng đến màn hình chi tiết danh sách để xem và chỉnh sửa các items.

---

## 3. SƠ ĐỒ ĐIỀU HƯỚNG GIỮA CÁC MÀN HÌNH

### 3.1. Cấu trúc Điều hướng Tổng quan

```
┌─────────────────────────────────────────┐
│         Root Layout (_layout.tsx)      │
│         - SafeAreaProvider             │
│         - NotificationsProvider        │
│         - Stack Navigator              │
└─────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
┌───────▼────────┐    ┌────────▼────────┐
│  Auth Stack    │    │   Main App       │
│  (auth)/       │    │                  │
│                │    │  ┌─────────────┐│
│  - login       │    │  │ Tabs Layout ││
│  - register    │    │  │ (tabs)/     ││
│  - forgot      │    │  │             ││
│  - verify      │    │  │ - home      ││
│  - update      │    │  │ - calendar  ││
│                │    │  │ - add       ││
│                │    │  │ - document  ││
│                │    │  │ - profile   ││
│                │    │  └─────────────┘│
│                │    │                 │
│                │    │  ┌─────────────┐│
│                │    │  │ Group Stack ││
│                │    │  │ (group)/    ││
│                │    │  │ - index     ││
│                │    │  │ - [id]      ││
│                │    │  │ - create    ││
│                │    │  └─────────────┘│
│                │    │                 │
│                │    │  ┌─────────────┐│
│                │    │  │ Meal Stack  ││
│                │    │  │ (meal)/     ││
│                │    │  │ - index     ││
│                │    │  │ - create-   ││
│                │    │  │   menu      ││
│                │    │  │ - edit-menu ││
│                │    │  └─────────────┘│
│                │    │                 │
│                │    │  ┌─────────────┐│
│                │    │  │ Fridge Stack││
│                │    │  │ (fridge)/   ││
│                │    │  │ - index     ││
│                │    │  │ - [id]      ││
│                │    │  │ - create    ││
│                │    │  │ - add-dish  ││
│                │    │  │ - add-      ││
│                │    │  │   ingredient││
│                │    │  └─────────────┘│
│                │    │                 │
│                │    │  ┌─────────────┐│
│                │    │  │ Market Stack││
│                │    │  │ (market)/    ││
│                │    │  │ - market_   ││
│                │    │  │   screen    ││
│                │    │  │ - nearest-  ││
│                │    │  │   market    ││
│                │    │  │ - ingredient││
│                │    │  │   -detail   ││
│                │    │  └─────────────┘│
│                │    │                 │
│                │    │  ┌─────────────┐│
│                │    │  │ Food Stack   ││
│                │    │  │ (food)/      ││
│                │    │  │ - index     ││
│                │    │  │ - [id]      ││
│                │    │  └─────────────┘│
│                │    │                 │
│                │    │  ┌─────────────┐│
│                │    │  │ Statistics  ││
│                │    │  │ (statistics)││
│                │    │  │ - index     ││
│                │    │  └─────────────┘│
│                │    │                 │
│                │    │  ┌─────────────┐│
│                │    │  │ Notifications││
│                │    │  │ (notifications)││
│                │    │  │ - index      ││
│                │    │  └─────────────┘│
└────────────────┴──────────────────────┘
```

### 3.2. Luồng Điều hướng Chi tiết

#### 3.2.1. Luồng Xác thực
```
index.tsx (Splash/Check Auth)
    │
    ├─→ (auth)/login.tsx
    │       │
    │       ├─→ (auth)/register.tsx
    │       │       └─→ (auth)/verify.tsx
    │       │
    │       └─→ (auth)/forgotPassword.tsx
    │
    └─→ (tabs)/home.tsx (if authenticated)
```

#### 3.2.2. Luồng Trang chủ
```
(tabs)/home.tsx
    │
    ├─→ (group)/index.tsx
    │       │
    │       ├─→ (group)/[id].tsx
    │       │
    │       └─→ (group)/create.tsx
    │
    ├─→ (meal)/index.tsx
    │       │
    │       ├─→ (meal)/create-menu.tsx
    │       │       └─→ (meal)/index.tsx (after create)
    │       │
    │       └─→ (meal)/edit-menu.tsx
    │
    ├─→ (market)/market_screen.tsx
    │       │
    │       ├─→ (market)/nearest-market.tsx
    │       │
    │       └─→ (market)/ingredient-detail.tsx
    │
    ├─→ (fridge)/index.tsx
    │       │
    │       ├─→ (fridge)/[id].tsx
    │       │
    │       ├─→ (fridge)/create.tsx
    │       │
    │       ├─→ (fridge)/add-dish.tsx
    │       │
    │       └─→ (fridge)/add-ingredient.tsx
    │
    ├─→ (food)/index.tsx
    │       │
    │       └─→ (food)/[id].tsx
    │
    ├─→ (statistics)/index.tsx
    │
    ├─→ (notifications)/index.tsx
    │
    └─→ (tabs)/profile.tsx
            │
            └─→ (profile)/edit.tsx
```

#### 3.2.3. Luồng Tabs Navigation
```
Bottom Tabs (tabs)/_layout.tsx
    │
    ├─→ home.tsx (Home icon)
    │
    ├─→ calendar.tsx (Calendar icon)
    │
    ├─→ add.tsx (Add icon)
    │
    ├─→ document.tsx (Document icon)
    │
    └─→ profile.tsx (Profile icon)
```

### 3.3. Kỹ thuật Điều hướng được Sử dụng

#### 3.3.1. Expo Router (File-based Routing)
```typescript
// Sử dụng expo-router cho navigation
import { useRouter } from 'expo-router';

const router = useRouter();

// Navigate to screen
router.push('/(group)');
router.push(`/(group)/${familyId}`);
router.replace('/(tabs)/home');

// Go back
router.back();

// Check if can go back
if (router.canGoBack()) {
  router.back();
}
```

#### 3.3.2. Stack Navigation
```typescript
// Mỗi feature group có Stack Navigator riêng
// (group)/_layout.tsx
export default function GroupLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="create" />
    </Stack>
  );
}
```

#### 3.3.3. Tab Navigation
```typescript
// (tabs)/_layout.tsx
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          height: 60,
        },
        tabBarActiveTintColor: COLORS.purple,
        tabBarInactiveTintColor: COLORS.grey,
      }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="calendar" />
      <Tabs.Screen name="add" />
      <Tabs.Screen name="document" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
```

#### 3.3.4. Modal Navigation
```typescript
// Sử dụng Modal component cho các dialog
<Modal
  visible={showModal}
  transparent={true}
  animationType="slide"
  onRequestClose={() => setShowModal(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      {/* Modal content */}
    </View>
  </View>
</Modal>
```

#### 3.3.5. Deep Linking
```typescript
// Hỗ trợ deep linking với expo-router
// URL: myapp://group/123
// Tự động navigate đến (group)/123.tsx
```

#### 3.3.6. Navigation Guards
```typescript
// Kiểm tra authentication trước khi navigate
useEffect(() => {
  const checkAuth = async () => {
    const token = await AsyncStorage.getItem('access_token');
    if (!token) {
      router.replace('/(auth)/login');
    }
  };
  checkAuth();
}, []);
```

### 3.4. Sơ đồ Điều hướng Chi tiết cho Use Cases

#### Use Case: Quản lý Thực đơn
```
(tabs)/home.tsx
    │ (tap "Bữa ăn")
    ▼
(meal)/index.tsx
    │
    ├─→ (tap "+" button)
    │   ▼
    │   (meal)/create-menu.tsx
    │       │
    │       ├─→ (tap "Chọn gia đình")
    │       │   ▼
    │       │   Modal: FamilyList
    │       │
    │       ├─→ (tap "Thêm món")
    │       │   ▼
    │       │   Modal: DishList (with search)
    │       │
    │       └─→ (tap "Tạo thực đơn")
    │           ▼
    │           (meal)/index.tsx (refresh)
    │
    ├─→ (tap menu card)
    │   ▼
    │   Expand/Collapse menu
    │
    ├─→ (tap dish in menu)
    │   ▼
    │   (food)/[id].tsx
    │
    └─→ (long press menu)
        ▼
        Modal: MenuOptions
            │
            ├─→ (tap "Sửa")
            │   ▼
            │   (meal)/edit-menu.tsx
            │
            └─→ (tap "Xóa")
                ▼
                Alert: Confirm Delete
                    │
                    └─→ (confirm)
                        ▼
                        (meal)/index.tsx (refresh)
```

#### Use Case: Quản lý Nhóm
```
(tabs)/home.tsx
    │ (tap "Nhóm")
    ▼
(group)/index.tsx
    │
    ├─→ (tap FAB "+")
    │   ▼
    │   Modal: CreateFamily
    │       │
    │       └─→ (submit)
    │           ▼
    │           (group)/index.tsx (refresh)
    │
    ├─→ (tap family card)
    │   ▼
    │   (group)/[id].tsx
    │       │
    │       ├─→ (tap member)
    │       │   ▼
    │       │   Show member details
    │       │
    │       └─→ (tap shopping list)
    │           ▼
    │           (market)/market_screen.tsx
    │
    ├─→ (tap menu button on card)
    │   ▼
    │   ActionMenu
    │       │
    │       ├─→ (tap "Xem chi tiết")
    │       │   ▼
    │       │   (group)/[id].tsx
    │       │
    │       ├─→ (tap "Mã mời")
    │       │   ▼
    │       │   Modal: InvitationCode
    │       │
    │       ├─→ (tap "Xóa nhóm")
    │       │   ▼
    │       │   Alert: Confirm Delete
    │       │
    │       └─→ (tap "Rời nhóm")
    │           ▼
    │           Alert: Confirm Leave
    │
    └─→ (tap header menu)
        ▼
        ActionMenu
            │
            ├─→ (tap "Tham gia nhóm")
            │   ▼
            │   Modal: JoinFamily (QR code input)
            │
            └─→ (tap "Thông báo")
                ▼
                (notifications)/index.tsx
```

### 3.5. Các Pattern Điều hướng Được Sử dụng

1. **Stack Navigation**: Cho các màn hình có quan hệ cha-con
2. **Tab Navigation**: Cho các màn hình chính (Home, Calendar, Add, Document, Profile)
3. **Modal Navigation**: Cho các dialog, form nhập liệu
4. **Deep Linking**: Hỗ trợ mở ứng dụng từ URL
5. **Conditional Navigation**: Dựa trên authentication state
6. **Back Button Handling**: Xử lý nút back trên Android

---

## KẾT LUẬN

Tài liệu này trình bày chi tiết về:
1. **Low-fidelity/Mid-fidelity Prototypes**: Các bản vẽ wireframe đơn giản cho từng use case
2. **High-fidelity UI Screens**: 
   - Cấu trúc layout (component tree)
   - Themes và styles
   - Xử lý user input và gestures
3. **Navigation Diagram**: Sơ đồ điều hướng chi tiết giữa các màn hình và các kỹ thuật navigation được sử dụng

Ứng dụng sử dụng **React Native với Expo Router** để xây dựng giao diện, với cấu trúc file-based routing và các pattern navigation hiện đại.

