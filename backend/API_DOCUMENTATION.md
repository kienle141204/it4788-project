http://localhost:8090
1.  Authentication APIs

### POST http://localhost:8090/api/auth/register-temp

Đăng ký tài khoản tạm thời và gửi OTP.

**Authentication:** Cần (JWT Token)

**Request:**
```json
{
  "email": "user@example.com",
  "phone_number": "0123456789",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đăng ký thành công. Vui lòng kiểm tra email để lấy mã OTP."
}
```

---

### POST http://localhost:8090/api/auth/verify-otp

Xác minh OTP và tạo tài khoản.

**Authentication:** Cần (JWT Token)

**Request:**
```json
{
  "email": "user@example.com",
  "otp_code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Xác minh thành công!",
  "access_token": "jwt_token",
  "refresh_token": "refresh_token",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "phone": "0123456789",
    "role": "user"
  }
}
```

---

### POST http://localhost:8090/api/auth/login

Đăng nhập hệ thống.

**Authentication:** Cần (JWT Token)

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJRdXlkYW5nMTYwMTIwMDRAZ21haWwuY29tIiwidHlwZSI6ImFjY2VzcyIsImlhdCI6MTc2MTQ3MTY1MiwiZXhwIjoxNzYxNDcyNTUyfQ.7zFwn6Mdi3U-NszShUfk7aC8_tzK6TEu-vIcat1sb6o",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJRdXlkYW5nMTYwMTIwMDRAZ21haWwuY29tIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3NjE0NzE2NTIsImV4cCI6MTc2MjA3NjQ1Mn0.H6Npgorb6pp2wdZ8IGRih60frc7cgLS0IKjDluvH7Ts",
    "user": {
        "id": "1",
        "email": "Quydang16012004@gmail.com",
        "phone": "0936797592",
        "full_name": "Đặng Ngọc Quý",
        "avatar_url": "https://www.jwt.io/",
        "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJRdXlkYW5nMTYwMTIwMDRAZ21haWwuY29tIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3NjEyNjQ4NzcsImV4cCI6MTc2MTg2OTY3N30.8MMnO3Q7ev6uqldbaLVHmO8oR5bwiwAqD0sXixHCFdg",
        "created_at": "2025-10-09T09:29:30.000Z",
        "role": "admin",
        "address": "174 Giải Phóng"
    }
}

---

## Dish APIs

### GET http://localhost:8090/api/dishes/get-all-info-dish

Lấy tất cả món ăn.

**Authentication:** Cần (JWT Token)

**Response:**
```json
{
  "success": true,
  "message": "Lấy danh sách món ăn thành công",
  "data": [
    {
      "id": 1,
      "name": "Phở Bò",
      "description": "Món phở truyền thống",
      "image_url": "https://example.com/pho.jpg",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### GET http://localhost:8090/api/dishes/get-paginated

Lấy món ăn với phân trang.

**Authentication:** Cần (JWT Token)

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10, max: 100)

**Example:** `http://localhost:8090/api/dishes/get-paginated?page=2&limit=5`

**Response:**
```json
{
    "success": true,
    "message": "Lấy danh sách món ăn trang 2 thành công",
    "data": [
        {
            "id": "2357",
            "name": "Cháo thịt gà 🍗 rau cải 🥬",
            "description": "Nguồn: https://cookpad.com/vn/cong-thuc/17146511\nNguyên liệu:\n- 25 g gạo\n- 15 g thịt gà\n- 15 g rau cải",
            "image_url": null,
            "created_at": "2025-10-24T23:09:12.000Z"
        },
        {
            "id": "2356",
            "name": "Cá ót nấu rau cần",
            "description": "Nguồn: https://cookpad.com/vn/cong-thuc/17179340\nNguyên liệu:\n- 0,5 kg cá ót\n- 1 mớ rau cần\n- 3 quả cà chua\n- 2 quả me (hoặc mẻ,khế...)\n- Hành, răm,thìa là,gừng,hành khô, tỏi,giavị",
            "image_url": "https://img-global.cpcdn.com/steps/aa574445fc94586c/160x128cq80/ca-ot-n%E1%BA%A5u-rau-c%E1%BA%A7n-recipe-step-5-photo.jpg",
            "created_at": "2025-10-24T23:09:11.000Z"
        },
        {
            "id": "2355",
            "name": "Canh rau ngót Nhật thịt bằm",
            "description": "Thời gian nấu: 20 phút\nKhẩu phần: 2-3 người\nNguồn: https://cookpad.com/vn/cong-thuc/17197031\nNguyên liệu:\n- 1 bó rau ngót Nhật\n- 200 gr thịt nạc xay\n- 2 muỗng canh hạt nêm\n- 2 củ hành tím\n- 2 muỗng canh dầu ăn\n- 1 bát nước",
            "image_url": "https://img-global.cpcdn.com/steps/c7c75a39423f8395/160x128cq80/canh-rau-ngot-nh%E1%BA%ADt-th%E1%BB%8Bt-b%E1%BA%B1m-recipe-step-3-photo.jpg",
            "created_at": "2025-10-24T23:09:10.000Z"
        },
        {
            "id": "2354",
            "name": "Gà nướng táo và rau củ",
            "description": "Thời gian nấu: 60 phút\nKhẩu phần: 6 người\nNguồn: https://cookpad.com/vn/cong-thuc/17198541\nNguyên liệu:\n- 2 cái đùi gàgóc tư\n- 1 quả táo\n- 1/2 củ cà rốt\n- 1/2 củ hành tây\n- Ít bông cải\n- 1 củ tỏi,\n- Ít cà chua bi socola\n- Lá hương thảo\n- Giavị",
            "image_url": "https://img-global.cpcdn.com/steps/833cefe783df5d1f/160x128cq80/ga-n%C6%B0%E1%BB%9Bng-tao-va-rau-c%E1%BB%A7-recipe-step-4-photo.jpg",
            "created_at": "2025-10-24T23:09:08.000Z"
        },
        {
            "id": "2353",
            "name": "Súp táo hầm rau củ đông trùng hạ thảo",
            "description": "Thời gian nấu: 60 phút\nKhẩu phần: 4 người\nNguồn: https://cookpad.com/vn/cong-thuc/17198560\nNguyên liệu:\n- 1 kg sườn\n- 2 trái táo\n- 1 trái bắp\n- 1 bịch nấm đông cô\n- 100 g hạt sen\n- Ít đông trùng hạ thảo\n- Ít táo tàu\n- 1 bịch nấm linh chi trắng\n- 2 củ hành tím\n- Giavị",
            "image_url": "https://img-global.cpcdn.com/steps/0e7cd8f621e26935/160x128cq80/sup-tao-h%E1%BA%A7m-rau-c%E1%BB%A7-dong-trung-h%E1%BA%A1-th%E1%BA%A3o-recipe-step-3-photo.jpg",
            "created_at": "2025-10-24T23:09:07.000Z"
        }
    ],
    "pagination": {
        "currentPage": 2,
        "totalPages": 473,
        "totalItems": 2362,
        "itemsPerPage": 5,
        "hasNextPage": true,
        "hasPrevPage": true
    }
}

---

### GET http://localhost:8090/api/dishes/search-paginated

Tìm kiếm món ăn.

**Authentication:** Cần (JWT Token)

**Query Parameters:**
- `name` (optional)
- `page` (default: 1)
- `limit` (default: 10)

**Example:** `http://localhost:8090/api/dishes/search-paginated?name=phở&page=1`

**Response:**
```json
{
    "success": true,
    "message": "Tìm thấy 49 món ăn với từ khóa \"phở\"",
    "data": [
        {
            "id": "2350",
            "name": "Salad Thơm, Dâu Tây, Phô Mai Feta & Jambon Iberico",
            "description": "Thời gian nấu: 10 phút\nKhẩu phần: 1 người\nNguồn: https://cookpad.com/vn/cong-thuc/22601413\nNguyên liệu:\n- 4-5 trái dâu tây🍓\n- 1/6 trái thơm🍍\n- 1 nhúm cỏ linh lăng\n- 3-4 lát Jambon Iberico\n- 1 ít hạtbí nướng\n- Vài láBasil(quế tây)\n- 1 ít phô mai Feta\n- 2 mcf dầu olive\n- 1/2 trái chanhvắt lấy nước\n- 1 nhúm tiêu xay",
            "image_url": "https://img-global.cpcdn.com/steps/30e9f60a18ba181e/160x128cq80/salad-th%C6%A1m-dau-tay-pho-mai-feta-jambon-iberico-recipe-step-4-photo.jpg",
            "created_at": "2025-10-24T23:09:02.000Z"
        },
        {
            "id": "2344",
            "name": "Salad Cà Rốt, Olive, Nho, Cà Chua Bi, Phô Mai Và Sốt Mù Tạt Vàng Mật Ong",
            "description": "Thời gian nấu: 20p\nKhẩu phần: 2 người\nNguồn: https://cookpad.com/vn/cong-thuc/22616580\nNguyên liệu:\n- 10 trái nho xanh\n- 3 trái cà chua bi\n- 200 gr cà rốt bào\n- 6-7 trái olive\n- 1 miếng phô mai\n- 1/2 trái chanh\n- 1 mc mật ong\n- 2 mc sốtmù tạt vàng",
            "image_url": "https://img-global.cpcdn.com/steps/933cfe403011dd72/160x128cq80/salad-ca-r%E1%BB%91t-olive-nho-ca-chua-bi-pho-mai-va-s%E1%BB%91t-mu-t%E1%BA%A1t-vang-m%E1%BA%ADt-ong-recipe-step-4-photo.jpg",
            "created_at": "2025-10-24T23:08:54.000Z"
        },
        {
            "id": "2338",
            "name": "Bánh canh phồng tôm rau củ",
            "description": "Thời gian nấu: 30p\nKhẩu phần: 2-3 người\nNguồn: https://cookpad.com/vn/cong-thuc/17217579\nNguyên liệu:\n- 1 gói phồng tôm\n- 1 củ hành tây\n- 1 củ cà rốt\n- 1 gói nấm hải sản\n- 5 g bột bắp/bột năng",
            "image_url": null,
            "created_at": "2025-10-24T23:08:47.000Z"
        },
        {
            "id": "2284",
            "name": "Bánh khoai tây, đậu, rau cải thìa nhân phô mai",
            "description": "Thời gian nấu: 30 phút\nKhẩu phần: 4 người\nNguồn: https://cookpad.com/vn/cong-thuc/17296964\nNguyên liệu:\n- 4 củ khoai tây\n- 2 bìa đậu\n- 4 cây cải thìa\n- 200 g phô mai mozzarella\n- Bột ngô, muối, đường, dầu ăn",
            "image_url": "https://img-global.cpcdn.com/steps/60aee0417fbbb88b/160x128cq80/banh-khoai-tay-d%E1%BA%ADu-rau-c%E1%BA%A3i-thia-nhan-pho-mai-recipe-step-5-photo.jpg",
            "created_at": "2025-10-24T23:07:33.000Z"
        },
        {
            "id": "2251",
            "name": "Sandwich cá hồi, rau mầm và phô mai",
            "description": "Thời gian nấu: 20 phút\nKhẩu phần: 4 người\nNguồn: https://cookpad.com/vn/cong-thuc/22375005\nNguyên liệu:\n- 200 g cá hồi\n- 100 g phô mai mozzarella bào\n- 4 miếng sandwich\n- Chút rau mầm,giavị",
            "image_url": "https://img-global.cpcdn.com/steps/0e8253ee5e8aa4ef/160x128cq80/sandwich-ca-h%E1%BB%93i-rau-m%E1%BA%A7m-va-pho-mai-recipe-step-3-photo.jpg",
            "created_at": "2025-10-24T23:06:48.000Z"
        },
        {
            "id": "2187",
            "name": "Salad Táo Xanh, Phô Mai Feta & Jambon Serrano",
            "description": "Thời gian nấu: 5 phút\nKhẩu phần: 1 phần\nNguồn: https://cookpad.com/vn/cong-thuc/24011388\nNguyên liệu:\n- 1 trái táo xanh🍏\n- 1 trái cà chua\n- 1/2 trái ớt chuông\n- 1 cái lácải Kale\n- Vài lá bạc hàsả\n- Vài hoaăn được trang trí (hoangò,hoabạc hà…)\n- 1 mc dấm balsamic\n- 1/2 mc dầu hạt lanh\n- 1 nhúm muối tiêu",
            "image_url": "https://img-global.cpcdn.com/steps/19a04193dbd03fb5/160x128cq80/salad-tao-xanh-pho-mai-feta-jambon-serrano-recipe-step-4-photo.jpg",
            "created_at": "2025-10-24T23:04:37.000Z"
        },
        {
            "id": "2032",
            "name": "Phở (bánh đa) xào rau bò khai, thịt bò",
            "description": "Thời gian nấu: 30 phút\nKhẩu phần: 4 người\nNguồn: https://cookpad.com/vn/cong-thuc/23885434\nNguyên liệu:\n- 300 g thịt bò\n- 1 mớ rau bò khai\n- 300 g phở tươi\n- Tỏi băm,giavị",
            "image_url": "https://img-global.cpcdn.com/steps/5637ef48f784b968/160x128cq80/ph%E1%BB%9F-banh-da-xao-rau-bo-khai-th%E1%BB%8Bt-bo-recipe-step-2-photo.jpg",
            "created_at": "2025-10-24T22:59:49.000Z"
        },
        {
            "id": "1977",
            "name": "Bánh paratha cuộn xà lách & phomai",
            "description": "Nguồn: https://cookpad.com/vn/cong-thuc/24911205\nNguyên liệu:\n- Bánh paratha\n- Phomai Cheddar(loại kẹphamburger)\n- Xà lách\n- Xốt mayonaise",
            "image_url": "https://img-global.cpcdn.com/steps/15785363c5b4864c/160x128cq80/banh-paratha-cu%E1%BB%99n-xa-lach-phomai-recipe-step-2-photo.jpg",
            "created_at": "2025-10-24T22:58:38.000Z"
        },
        {
            "id": "1833",
            "name": "Phở Cuốn Ba Chỉ",
            "description": "Thời gian nấu: 30 phút\nKhẩu phần: 8 phần ăn\nNguồn: https://cookpad.com/vn/cong-thuc/17206370\nNguyên liệu:\n- 1 kg Ba Chỉ\n- 500 g dưa chuột\n- 300 g cà rốt\n- 2 quả dứa chín\n- 300 g giò lụa\n- 4 quả trứng vịt\n- 400 g rau diếp xoăn\n- Rau mùi,rau húng bạc hà\n- 1 kg phở cuốn\n- 5 tập lá nem ăn sống\n- 200 g lạcranggiãnhỏ\n- phần nước chấm\n- Nước mắm, tỏi,chanh, đường, ớt,rau thơmcắt nhỏ\n- 200 ml mắm nêm",
            "image_url": null,
            "created_at": "2025-10-24T22:55:10.000Z"
        },
        {
            "id": "1647",
            "name": "Bữa Trưa Phổ Biến Bên Hà Lan Với Cracker Thịt Nguội, Trứng Và Phô Mai",
            "description": "Thời gian nấu: 20’\nKhẩu phần: 2 người\nNguồn: https://cookpad.com/vn/cong-thuc/22604925\nNguyên liệu:\n- 1 xíu bơ lạt\n- 4 trái trứng gà\n- 1/3 mcf bột nêm gà\n- xíu tiêu\n- 4 lát cracker\n- 4 lát thịt nguội\n- 1 miếng phô maito",
            "image_url": "https://img-global.cpcdn.com/steps/54e351f46b9b21f8/160x128cq80/b%E1%BB%AFa-tr%C6%B0a-ph%E1%BB%95-bi%E1%BA%BFn-ben-ha-lan-v%E1%BB%9Bi-cracker-th%E1%BB%8Bt-ngu%E1%BB%99i-tr%E1%BB%A9ng-va-pho-mai-recipe-step-4-photo.jpg",
            "created_at": "2025-10-24T22:51:36.000Z"
        }
    ],
    "searchTerm": "phở",
    "pagination": {
        "currentPage": 1,
        "totalPages": 5,
        "totalItems": 49,
        "itemsPerPage": 10,
        "hasNextPage": true,
        "hasPrevPage": false
    }
}
```

---

## Ingredient APIs

### POST http://localhost:8090/api/ingredients

Tạo nguyên liệu mới.

**Authentication:** Cần (JWT Token)

**Request:**
```json
{
  "name": "Thịt heo",
  "description": "Thịt heo tươi ngon",
  "price": 180000,
  "image_url": "https://example.com/thit-heo.jpg",
  "category_id": 1,
  "place_id": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tạo nguyên liệu thành công",
  "data": {
    "id": 101,
    "name": "Thịt heo",
    "description": "Thịt heo tươi ngon",
    "price": 180000.00,
    "image_url": "https://example.com/thit-heo.jpg",
    "category_id": 1,
    "place_id": 1,
    "created_at": "2024-01-15T10:00:00.000Z",
    "category": {
      "id": 1,
      "name": "Thịt"
    },
    "place": {
      "place_id": 1,
      "name_place": "Big C"
    }
  }
}
```

**Validation Errors:**
- `name` là bắt buộc
- `category_id` phải tồn tại trong database
- `place_id` phải tồn tại trong database
- `price` phải >= 0

---

### GET http://localhost:8090/api/ingredients

Lấy tất cả nguyên liệu.

**Authentication:** Cần (JWT Token)

**Response:**
```json
{
  "success": true,
  "message": "Lấy danh sách nguyên liệu thành công",
  "data": [
    {
      "id": 1,
      "name": "Thịt bò",
      "description": "Thịt bò tươi ngon",
      "price": 250000.00,
      "image_url": "https://example.com/thit-bo.jpg",
      "category_id": 1,
      "place_id": 1,
      "category": {
        "id": 1,
        "name": "Thịt"
      },
      "place": {
        "place_id": 1,
        "name_place": "Big C"
      }
    }
  ]
}
```

---

### GET http://localhost:8090/api/ingredients/paginated

Lấy nguyên liệu với phân trang.

**Authentication:** Cần (JWT Token)

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10, max: 100)

**Example:** `http://localhost:8090/api/ingredients/paginated?page=2&limit=5`

**Response:**
```json
{
    "success": true,
    "message": "Lấy danh sách nguyên liệu trang 2 thành công",
    "data": [
        {
            "id": "598",
            "category_id": "2",
            "name": "Củ Kiệu Quế",
            "description": "https://ifarmer.vn/cu/",
            "price": "120000.00",
            "image_url": "https://storage.googleapis.com/ifarmer.vn/a/468d90686ca442a1a155461db14312a3/s_200x200__cu-kieu-1kg.webp",
            "created_at": "2025-10-23T12:35:43.000Z",
            "place_id": 24,
            "category": {
                "id": "2",
                "name": "Rau củ"
            },
            "place": {
                "place_id": 24,
                "name_place": "Hà Nội"
            }
        },
        {
            "id": "599",
            "category_id": "2",
            "name": "Nghệ",
            "description": "https://ifarmer.vn/cu/",
            "price": "47000.00",
            "image_url": "https://storage.googleapis.com/ifarmer.vn/a/3edb5b29421d4c89ba18dc9fc938d0e7/s_200x200__nghe-loai-dac-biet-trong-luong-1-kg.webp",
            "created_at": "2025-10-23T12:35:43.000Z",
            "place_id": 24,
            "category": {
                "id": "2",
                "name": "Rau củ"
            },
            "place": {
                "place_id": 24,
                "name_place": "Hà Nội"
            }
        },
        {
            "id": "600",
            "category_id": "2",
            "name": "Củ Hành Tím",
            "description": "https://ifarmer.vn/cu/",
            "price": "47000.00",
            "image_url": "https://storage.googleapis.com/ifarmer.vn/a/222e250b66f44ffe9be40aa5ad521099/s_200x200__hanh-indo.webp",
            "created_at": "2025-10-23T12:35:43.000Z",
            "place_id": 24,
            "category": {
                "id": "2",
                "name": "Rau củ"
            },
            "place": {
                "place_id": 24,
                "name_place": "Hà Nội"
            }
        },
        {
            "id": "579",
            "category_id": "2",
            "name": "Củ Riềng",
            "description": "https://ifarmer.vn/cu/",
            "price": "25000.00",
            "image_url": "https://storage.googleapis.com/ifarmer.vn/a/698dbe91d3e24fc590fd337a4bb8fb94/s_200x200__cu-rieng-loai-dac-biet-trong-luong-1-kg.webp",
            "created_at": "2025-10-23T12:35:42.000Z",
            "place_id": 24,
            "category": {
                "id": "2",
                "name": "Rau củ"
            },
            "place": {
                "place_id": 24,
                "name_place": "Hà Nội"
            }
        },
        {
            "id": "580",
            "category_id": "2",
            "name": "Củ Dền",
            "description": "https://ifarmer.vn/cu/",
            "price": "12000.00",
            "image_url": "https://storage.googleapis.com/ifarmer.vn/a/77e13e97ea854bd8a03fa4c5b2130473/s_200x200__cu-den-loai-dac-biet-trong-luong-1-kg.webp",
            "created_at": "2025-10-23T12:35:42.000Z",
            "place_id": 24,
            "category": {
                "id": "2",
                "name": "Rau củ"
            },
            "place": {
                "place_id": 24,
                "name_place": "Hà Nội"
            }
        }
    ],
    "pagination": {
        "currentPage": 2,
        "totalPages": 121,
        "totalItems": 601,
        "itemsPerPage": 5,
        "hasNextPage": true,
        "hasPrevPage": true
    }
}

---

### GET http://localhost:8090/api/ingredients/:id

Lấy nguyên liệu theo ID.

**Authentication:** Cần (JWT Token)

**Example:** `http://localhost:8090/api/ingredients/1`

**Response:**
```json
{
    "success": true,
    "message": "Lấy thông tin nguyên liệu thành công",
    "data": {
        "id": "1",
        "category_id": "2",
        "name": "Bắp cải tím",
        "description": "https://chonongsanonline.com/category/rau-la-cac-loai",
        "price": "9000.00",
        "image_url": "https://chonongsanonline.com/public/uploads/all/QeyOJbMatRMPpYjFZyb3MXzDc0clCtaVax2MxTSr.jpg",
        "created_at": "2025-10-23T12:35:01.000Z",
        "place_id": 24,
        "category": {
            "id": "2",
            "name": "Rau củ"
        },
        "place": {
            "place_id": 24,
            "name_place": "Hà Nội"
        }
    }
}
```

---

### GET http://localhost:8090/api/ingredients/by-ids

Lấy nguyên liệu theo danh sách ID.

**Authentication:** Cần (JWT Token)

**Query Parameters:**
- `ids` (required): Danh sách ID cách nhau bởi dấu phẩy

**Example:** `http://localhost:8090/api/ingredients/by-ids?ids=1,2,3`

CHÚ THÍCH CÁC LOẠI THỰC PHẨM VÀ ID ĐANG CÓ 
1	Thịt
2	Rau củ
3	Trái cây 
4	Hải sản
5	Cá
	

**Response:**
```json
{
  "success": true,
  "message": "Lấy danh sách nguyên liệu theo ID thành công",
  "data": [
    {
      "id": 1,
      "name": "Thịt bò",
      "description": "Thịt bò tươi ngon",
      "price": 250000.00,
      "image_url": "https://example.com/thit-bo.jpg",
      "category_id": 1,
      "place_id": 1,
      "created_at": "2024-01-01T00:00:00.000Z",
      "category": {
        "id": 1,
        "name": "Thịt"
      },
      "place": {
        "place_id": 1,
        "name_place": "Big C"
      }
    }
  ]
}
```

---

### GET http://localhost:8090/api/ingredients/search/name

Tìm kiếm nguyên liệu theo tên.

**Authentication:** Cần (JWT Token)

**Query Parameters:**
- `name` (optional)
- `page` (default: 1)
- `limit` (default: 10)

**Example:** `http://localhost:8090/api/ingredients/search/name?name=thịt`

**Response:**
{
    "success": true,
    "message": "Tìm thấy 26 nguyên liệu với từ khóa \"thịt\"",
    "data": [
        {
            "id": "231",
            "category_id": "1",
            "name": " Thịt gà",
            "description": "https://ifarmer.vn/trai-cay/",
            "price": "70000.00",
            "image_url": "https://storage.googleapis.com/ifarmer.vn/a/e513aa7c309c4dffa70537212a0f1456/s_200x200__uc-ga-hang-song-trong-luong-1-kg.webp",
            "created_at": "2025-10-23T12:35:17.000Z",
            "place_id": 24,
            "category": {
                "id": "1",
                "name": "Thịt"
            },
            "place": {
                "place_id": 24,
                "name_place": "Hà Nội"
            }
        },
        {
            "id": "106",
            "category_id": "1",
            "name": "Thịt Bò",
            "description": "https://ifarmer.vn/thit-tuoi/",
            "price": "220000.00",
            "image_url": "https://storage.googleapis.com/ifarmer.vn/a/f11218b8d62f4e998c43b18a36f705a9/s_200x200__thit-bo-hang-tuoi-trong-luong-1-kg.webp",
            "created_at": "2025-10-23T12:35:09.000Z",
            "place_id": 24,
            "category": {
                "id": "1",
                "name": "Thịt"
            },
            "place": {
                "place_id": 24,
                "name_place": "Hà Nội"
            }
        },
        {
            "id": "92",
            "category_id": "1",
            "name": "Thịt Heo",
            "description": "https://ifarmer.vn/thit-tuoi/",
            "price": "130000.00",
            "image_url": "https://storage.googleapis.com/ifarmer.vn/a/153243bbf2f249caa4624bc09da0c050/s_200x200__thit-heo-hang-tuoi-trong-luong-1-kg.webp",
            "created_at": "2025-10-23T12:35:08.000Z",
            "place_id": 24,
            "category": {
                "id": "1",
                "name": "Thịt"
            },
            "place": {
                "place_id": 24,
                "name_place": "Hà Nội"
            }
        },
        {
            "id": "93",
            "category_id": "1",
            "name": "Thịt Chuột Đồng",
            "description": "https://ifarmer.vn/thit-tuoi/",
            "price": "140000.00",
            "image_url": "https://storage.googleapis.com/ifarmer.vn/a/ab5fafe581a5441783956d725f9ca892/s_200x200__thit-chuot-dong-hang-tuoi-trong-luong-1-kg.webp",
            "created_at": "2025-10-23T12:35:08.000Z",
            "place_id": 24,
            "category": {
                "id": "1",
                "name": "Thịt"
            },
            "place": {
                "place_id": 24,
                "name_place": "Hà Nội"
            }
        },
        {
            "id": "94",
            "category_id": "1",
            "name": "Thịt Cốt Lết",
            "description": "https://ifarmer.vn/thit-tuoi/",
            "price": "128000.00",
            "image_url": "https://storage.googleapis.com/ifarmer.vn/a/38b64a6daab44b5e8a06e024205f6a05/s_200x200__cot-let-1.webp",
            "created_at": "2025-10-23T12:35:08.000Z",
            "place_id": 24,
            "category": {
                "id": "1",
                "name": "Thịt"
            },
            "place": {
                "place_id": 24,
                "name_place": "Hà Nội"
            }
        },
        {
            "id": "98",
            "category_id": "1",
            "name": "Thịt Ba Chỉ",
            "description": "https://ifarmer.vn/thit-tuoi/",
            "price": "129000.00",
            "image_url": "https://storage.googleapis.com/ifarmer.vn/a/d4998d813a7f4830b0c5ff56a01273b3/s_200x200__thit-ba-chi-hang-tuoi-trong-luong-1-kg.webp",
            "created_at": "2025-10-23T12:35:08.000Z",
            "place_id": 24,
            "category": {
                "id": "1",
                "name": "Thịt"
            },
            "place": {
                "place_id": 24,
                "name_place": "Hà Nội"
            }
        },
        {
            "id": "99",
            "category_id": "1",
            "name": "Thịt Bò Tơ Củ Chi",
            "description": "https://ifarmer.vn/thit-tuoi/",
            "price": "275000.00",
            "image_url": "https://storage.googleapis.com/ifarmer.vn/a/af78774826b345419b53bd211c28286b/s_200x200__thit-bo-to-cu-chi-hang-tuoi-trong-luong-1-kg.webp",
            "created_at": "2025-10-23T12:35:08.000Z",
            "place_id": 24,
            "category": {
                "id": "1",
                "name": "Thịt"
            },
            "place": {
                "place_id": 24,
                "name_place": "Hà Nội"
            }
        },
        {
            "id": "101",
            "category_id": "1",
            "name": "Thịt Nạc Xay",
            "description": "https://ifarmer.vn/thit-tuoi/",
            "price": "109000.00",
            "image_url": "https://storage.googleapis.com/ifarmer.vn/a/a6e4516d28b346f1b26062095c3db4c2/s_200x200__thit-nac-xay-hang-tuoi-trong-luong-1-kg.webp",
            "created_at": "2025-10-23T12:35:08.000Z",
            "place_id": 24,
            "category": {
                "id": "1",
                "name": "Thịt"
            },
            "place": {
                "place_id": 24,
                "name_place": "Hà Nội"
            }
        },
        {
            "id": "102",
            "category_id": "1",
            "name": "Thịt Nhím",
            "description": "https://ifarmer.vn/thit-tuoi/",
            "price": "150000.00",
            "image_url": "https://storage.googleapis.com/ifarmer.vn/a/05b70f84089b4a6b95eeb8fb6e8fd862/s_200x200__thit-nhim-hang-tuoi-trong-luong-1-kg.webp",
            "created_at": "2025-10-23T12:35:08.000Z",
            "place_id": 24,
            "category": {
                "id": "1",
                "name": "Thịt"
            },
            "place": {
                "place_id": 24,
                "name_place": "Hà Nội"
            }
        },
        {
            "id": "104",
            "category_id": "1",
            "name": "Thịt Chuột Dừa",
            "description": "https://ifarmer.vn/thit-tuoi/",
            "price": "150000.00",
            "image_url": "https://storage.googleapis.com/ifarmer.vn/a/b2a51756f18c4905b09cfc6bb73da1f7/s_200x200__thit-chuot-dua-hang-tuoi-trong-luong-1-kg.webp",
            "created_at": "2025-10-23T12:35:08.000Z",
            "place_id": 24,
            "category": {
                "id": "1",
                "name": "Thịt"
            },
            "place": {
                "place_id": 24,
                "name_place": "Hà Nội"
            }
        }
    ],
    "searchTerm": "thịt",
    "pagination": {
        "currentPage": 1,
        "totalPages": 3,
        "totalItems": 26,
        "itemsPerPage": 10,
        "hasNextPage": true,
        "hasPrevPage": false
    }
}


### GET /api/ingredients/search/place

Tìm kiếm nguyên liệu theo địa chỉ.

**Authentication:** Cần (JWT Token)

**Query Parameters:**
- `place_id` (optional)
- `page` (default: 1)
- `limit` (default: 10)

**Example:** `/api/ingredients/search/place?place_id=1`

**Response:**
```json
{
  "success": true,
  "message": "Tìm thấy 25 nguyên liệu tại địa chỉ ID 1",
  "data": [
    {
      "id": 1,
      "name": "Thịt bò",
      "description": "Thịt bò tươi ngon",
      "price": 250000.00,
      "image_url": "https://example.com/thit-bo.jpg",
      "category_id": 1,
      "place_id": 1,
      "created_at": "2024-01-01T00:00:00.000Z",
      "category": {
        "id": 1,
        "name": "Thịt"
      },
      "place": {
        "place_id": 1,
        "name_place": "Big C"
      }
    }
  ],
  "placeId": 1,
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalItems": 25,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

### GET http://localhost:8090/api/ingredients/search/category

Tìm kiếm nguyên liệu theo danh mục.

**Authentication:** Cần (JWT Token)

**Query Parameters:**
- `category_id` (optional)
- `page` (default: 1)
- `limit` (default: 10)

**Example:** `http://localhost:8090/api/ingredients/search/category?category_id=1`

**Response:**
```json
{
  "success": true,
  "message": "Tìm thấy 30 nguyên liệu trong danh mục ID 1",
  "data": [
    {
      "id": 1,
      "name": "Thịt bò",
      "description": "Thịt bò tươi ngon",
      "price": 250000.00,
      "image_url": "https://example.com/thit-bo.jpg",
      "category_id": 1,
      "place_id": 1,
      "created_at": "2024-01-01T00:00:00.000Z",
      "category": {
        "id": 1,
        "name": "Thịt"
      },
      "place": {
        "place_id": 1,
        "name_place": "Big C"
      }
    }
  ],
  "categoryId": 1,
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalItems": 30,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---
http://localhost:8090/api/ingredients/search

Tìm kiếm với nhiều bộ lọc.

**Authentication:** Cần (JWT Token)

**Query Parameters:**
- `name` (optional)
- `place_id` (optional)
- `category_id` (optional)
- `page` (default: 1)
- `limit` (default: 10)

**Example:** `http://localhost:8090/api/ingredients/search?name=thịt&place_id=1&category_id=2`

**Response:**
```json
{
  "success": true,
  "message": "Tìm thấy 5 nguyên liệu với tên: \"thịt\", địa chỉ: 1, danh mục: 2",
  "data": [
    {
      "id": 1,
      "name": "Thịt bò",
      "description": "Thịt bò tươi ngon",
      "price": 250000.00,
      "image_url": "https://example.com/thit-bo.jpg",
      "category_id": 1,
      "place_id": 1,
      "created_at": "2024-01-01T00:00:00.000Z",
      "category": {
        "id": 1,
        "name": "Thịt"
      },
      "place": {
        "place_id": 1,
        "name_place": "Big C"
      }
    }
  ],
  "filters": {
    "name": "thịt",
    "place_id": 1,
    "category_id": 2
  },
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalItems": 5,
    "itemsPerPage": 10,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

---

## Recipe APIs

### GET http://localhost:8090/api/recipes

Lấy công thức với phân trang.

**Authentication:** Cần

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10)
- `dishId` (optional)
- `ownerId` (optional)

{
    "success": true,
    "message": "Lấy danh sách công thức trang 1 thành công",
    "data": [
        {
            "id": "2684",
            "dish_id": "2362",
            "owner_id": "1",
            "status": null,
            "created_at": "2025-10-24T23:09:18.000Z",
            "dish": {
                "id": "2362",
                "name": "Vetula: Nui lứt xào trứng ăn với chả mực và rau củ luộc",
                "description": "Nguồn: https://cookpad.com/vn/cong-thuc/17192645\nNguyên liệu:\n- 1 chén nui lứt\n- 1/2 cây bông cải\n- 1 ít đậu cove\n- Chảmực\n- 1 trái bắp\n- 2 quả trứng\n- Tỏi, hạt nêm, nước tương",
                "image_url": "https://img-global.cpcdn.com/steps/3d389c704b84341d/160x128cq80/vetula-nui-l%E1%BB%A9t-xao-tr%E1%BB%A9ng-an-v%E1%BB%9Bi-ch%E1%BA%A3-m%E1%BB%B1c-va-rau-c%E1%BB%A7-lu%E1%BB%99c-recipe-step-3-photo.jpg",
                "created_at": "2025-10-24T23:09:18.000Z"
            },
            "owner": {
                "id": "1",
                "email": "Quydang16012004@gmail.com",
                "phone": "0936797592",
                "password_hash": "$2b$12$U9iWvphqPBGpIGmo3JzEee91qHhPT.kX7/1ychWJlefHVYx5C6zT6",
                "full_name": "Đặng Ngọc Quý",
                "avatar_url": "https://www.jwt.io/",
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJRdXlkYW5nMTYwMTIwMDRAZ21haWwuY29tIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3NjE0NzE2NTIsImV4cCI6MTc2MjA3NjQ1Mn0.H6Npgorb6pp2wdZ8IGRih60frc7cgLS0IKjDluvH7Ts",
                "created_at": "2025-10-09T09:29:30.000Z",
                "role": "admin",
                "address": "174 Giải Phóng"
            }
        },
        {
            "id": "2683",
            "dish_id": "2361",
            "owner_id": "1",
            "status": null,
            "created_at": "2025-10-24T23:09:17.000Z",
            "dish": {
                "id": "2361",
                "name": "Salad ức gà",
                "description": "Thời gian nấu: 1 tiếng\nKhẩu phần: 3 người\nNguồn: https://cookpad.com/vn/cong-thuc/22587495\nNguyên liệu:\n- 60 g ức gà(hoặc hơn nếu muốn ăn nhiềuthịt)\n- 150 g xà lách\n- 1 quả dưa chuột\n- 60 g bơ\n- 60 g ngô ngọt hạt\n- 1 tsp muối\n- 1 chút tiêu\n- 1 chút dầu ăn xịt\n- Sốt dressing\n- 20 g MayonnaiseKewpie (nhãnxanh dương)\n- 3 tsp nước cốt chanh\n- 1 tsp đường ăn kiêng",
                "image_url": "https://img-global.cpcdn.com/steps/ce8d930053c32721/160x128cq80/salad-%E1%BB%A9c-ga-recipe-step-4-photo.jpg",
                "created_at": "2025-10-24T23:09:16.000Z"
            },
            "owner": {
                "id": "1",
                "email": "Quydang16012004@gmail.com",
                "phone": "0936797592",
                "password_hash": "$2b$12$U9iWvphqPBGpIGmo3JzEee91qHhPT.kX7/1ychWJlefHVYx5C6zT6",
                "full_name": "Đặng Ngọc Quý",
                "avatar_url": "https://www.jwt.io/",
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJRdXlkYW5nMTYwMTIwMDRAZ21haWwuY29tIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3NjE0NzE2NTIsImV4cCI6MTc2MjA3NjQ1Mn0.H6Npgorb6pp2wdZ8IGRih60frc7cgLS0IKjDluvH7Ts",
                "created_at": "2025-10-09T09:29:30.000Z",
                "role": "admin",
                "address": "174 Giải Phóng"
            }
        },
        {
            "id": "2682",
            "dish_id": "2360",
            "owner_id": "1",
            "status": null,
            "created_at": "2025-10-24T23:09:15.000Z",
            "dish": {
                "id": "2360",
                "name": "Bông Kim Châm Kho Rau Củ Chay",
                "description": "Thời gian nấu: 30 phút\nKhẩu phần: 4 phần ăn\nNguồn: https://cookpad.com/vn/cong-thuc/17193552\nNguyên liệu:\n- 1/2 củ cà rốttỉahoa\n- 10 trái đậu covenhật\n- 50 gr nấm ngọc châmnâu\n- 1 miếng đậu hũ\n- 1 nhúm bông kim châmkhô\n- Hành tỏi bămhoặc poro\n- Nước tương\n- Dầu hào chay\n- Đường cát\n- Tiêu xay",
                "image_url": "https://img-global.cpcdn.com/steps/9902578bef2c9249/160x128cq80/bong-kim-cham-kho-rau-c%E1%BB%A7-chay-recipe-step-5-photo.jpg",
                "created_at": "2025-10-24T23:09:14.000Z"
            },
            "owner": {
                "id": "1",
                "email": "Quydang16012004@gmail.com",
                "phone": "0936797592",
                "password_hash": "$2b$12$U9iWvphqPBGpIGmo3JzEee91qHhPT.kX7/1ychWJlefHVYx5C6zT6",
                "full_name": "Đặng Ngọc Quý",
                "avatar_url": "https://www.jwt.io/",
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJRdXlkYW5nMTYwMTIwMDRAZ21haWwuY29tIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3NjE0NzE2NTIsImV4cCI6MTc2MjA3NjQ1Mn0.H6Npgorb6pp2wdZ8IGRih60frc7cgLS0IKjDluvH7Ts",
                "created_at": "2025-10-09T09:29:30.000Z",
                "role": "admin",
                "address": "174 Giải Phóng"
            }
        },
        {
            "id": "2681",
            "dish_id": "2359",
            "owner_id": "1",
            "status": null,
            "created_at": "2025-10-24T23:09:14.000Z",
            "dish": {
                "id": "2359",
                "name": "Salad Rau Xanh, Củ Hồi & Cá Nục Tẩm Tiêu Hạt Xông Khói",
                "description": "Nguồn: https://cookpad.com/vn/cong-thuc/17186801\nNguyên liệu:\n- 1/4 củ hồi\n- 1/4 củ dền\n- Rau diếp cừu\n- Cá nụcướp tiêuxông khói\n- 1 loạisốt salad yêu thích",
                "image_url": "https://img-global.cpcdn.com/steps/fe9d0120cc1c007d/160x128cq80/salad-rau-xanh-c%E1%BB%A7-h%E1%BB%93i-ca-n%E1%BB%A5c-t%E1%BA%A9m-tieu-h%E1%BA%A1t-xong-khoi-recipe-step-3-photo.jpg",
                "created_at": "2025-10-24T23:09:13.000Z"
            },
            "owner": {
                "id": "1",
                "email": "Quydang16012004@gmail.com",
                "phone": "0936797592",
                "password_hash": "$2b$12$U9iWvphqPBGpIGmo3JzEee91qHhPT.kX7/1ychWJlefHVYx5C6zT6",
                "full_name": "Đặng Ngọc Quý",
                "avatar_url": "https://www.jwt.io/",
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJRdXlkYW5nMTYwMTIwMDRAZ21haWwuY29tIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3NjE0NzE2NTIsImV4cCI6MTc2MjA3NjQ1Mn0.H6Npgorb6pp2wdZ8IGRih60frc7cgLS0IKjDluvH7Ts",
                "created_at": "2025-10-09T09:29:30.000Z",
                "role": "admin",
                "address": "174 Giải Phóng"
            }
        },
        {
            "id": "2679",
            "dish_id": "2357",
            "owner_id": "1",
            "status": null,
            "created_at": "2025-10-24T23:09:13.000Z",
            "dish": {
                "id": "2357",
                "name": "Cháo thịt gà 🍗 rau cải 🥬",
                "description": "Nguồn: https://cookpad.com/vn/cong-thuc/17146511\nNguyên liệu:\n- 25 g gạo\n- 15 g thịt gà\n- 15 g rau cải",
                "image_url": null,
                "created_at": "2025-10-24T23:09:12.000Z"
            },
            "owner": {
                "id": "1",
                "email": "Quydang16012004@gmail.com",
                "phone": "0936797592",
                "password_hash": "$2b$12$U9iWvphqPBGpIGmo3JzEee91qHhPT.kX7/1ychWJlefHVYx5C6zT6",
                "full_name": "Đặng Ngọc Quý",
                "avatar_url": "https://www.jwt.io/",
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJRdXlkYW5nMTYwMTIwMDRAZ21haWwuY29tIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3NjE0NzE2NTIsImV4cCI6MTc2MjA3NjQ1Mn0.H6Npgorb6pp2wdZ8IGRih60frc7cgLS0IKjDluvH7Ts",
                "created_at": "2025-10-09T09:29:30.000Z",
                "role": "admin",
                "address": "174 Giải Phóng"
            }
        },
        {
            "id": "2680",
            "dish_id": "2358",
            "owner_id": "1",
            "status": null,
            "created_at": "2025-10-24T23:09:13.000Z",
            "dish": {
                "id": "2358",
                "name": "Bông cải xanh luộc chấm tương ớt",
                "description": "Thời gian nấu: 10phút\nKhẩu phần: 2người\nNguồn: https://cookpad.com/vn/cong-thuc/22592185\nNguyên liệu:\n- 1 cái bông cải xanh\n- 2-3 thìa tương ớt",
                "image_url": null,
                "created_at": "2025-10-24T23:09:13.000Z"
            },
            "owner": {
                "id": "1",
                "email": "Quydang16012004@gmail.com",
                "phone": "0936797592",
                "password_hash": "$2b$12$U9iWvphqPBGpIGmo3JzEee91qHhPT.kX7/1ychWJlefHVYx5C6zT6",
                "full_name": "Đặng Ngọc Quý",
                "avatar_url": "https://www.jwt.io/",
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJRdXlkYW5nMTYwMTIwMDRAZ21haWwuY29tIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3NjE0NzE2NTIsImV4cCI6MTc2MjA3NjQ1Mn0.H6Npgorb6pp2wdZ8IGRih60frc7cgLS0IKjDluvH7Ts",
                "created_at": "2025-10-09T09:29:30.000Z",
                "role": "admin",
                "address": "174 Giải Phóng"
            }
        },
        {
            "id": "2678",
            "dish_id": "2356",
            "owner_id": "1",
            "status": null,
            "created_at": "2025-10-24T23:09:11.000Z",
            "dish": {
                "id": "2356",
                "name": "Cá ót nấu rau cần",
                "description": "Nguồn: https://cookpad.com/vn/cong-thuc/17179340\nNguyên liệu:\n- 0,5 kg cá ót\n- 1 mớ rau cần\n- 3 quả cà chua\n- 2 quả me (hoặc mẻ,khế...)\n- Hành, răm,thìa là,gừng,hành khô, tỏi,giavị",
                "image_url": "https://img-global.cpcdn.com/steps/aa574445fc94586c/160x128cq80/ca-ot-n%E1%BA%A5u-rau-c%E1%BA%A7n-recipe-step-5-photo.jpg",
                "created_at": "2025-10-24T23:09:11.000Z"
            },
            "owner": {
                "id": "1",
                "email": "Quydang16012004@gmail.com",
                "phone": "0936797592",
                "password_hash": "$2b$12$U9iWvphqPBGpIGmo3JzEee91qHhPT.kX7/1ychWJlefHVYx5C6zT6",
                "full_name": "Đặng Ngọc Quý",
                "avatar_url": "https://www.jwt.io/",
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJRdXlkYW5nMTYwMTIwMDRAZ21haWwuY29tIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3NjE0NzE2NTIsImV4cCI6MTc2MjA3NjQ1Mn0.H6Npgorb6pp2wdZ8IGRih60frc7cgLS0IKjDluvH7Ts",
                "created_at": "2025-10-09T09:29:30.000Z",
                "role": "admin",
                "address": "174 Giải Phóng"
            }
        },
        {
            "id": "2677",
            "dish_id": "2355",
            "owner_id": "1",
            "status": null,
            "created_at": "2025-10-24T23:09:10.000Z",
            "dish": {
                "id": "2355",
                "name": "Canh rau ngót Nhật thịt bằm",
                "description": "Thời gian nấu: 20 phút\nKhẩu phần: 2-3 người\nNguồn: https://cookpad.com/vn/cong-thuc/17197031\nNguyên liệu:\n- 1 bó rau ngót Nhật\n- 200 gr thịt nạc xay\n- 2 muỗng canh hạt nêm\n- 2 củ hành tím\n- 2 muỗng canh dầu ăn\n- 1 bát nước",
                "image_url": "https://img-global.cpcdn.com/steps/c7c75a39423f8395/160x128cq80/canh-rau-ngot-nh%E1%BA%ADt-th%E1%BB%8Bt-b%E1%BA%B1m-recipe-step-3-photo.jpg",
                "created_at": "2025-10-24T23:09:10.000Z"
            },
            "owner": {
                "id": "1",
                "email": "Quydang16012004@gmail.com",
                "phone": "0936797592",
                "password_hash": "$2b$12$U9iWvphqPBGpIGmo3JzEee91qHhPT.kX7/1ychWJlefHVYx5C6zT6",
                "full_name": "Đặng Ngọc Quý",
                "avatar_url": "https://www.jwt.io/",
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJRdXlkYW5nMTYwMTIwMDRAZ21haWwuY29tIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3NjE0NzE2NTIsImV4cCI6MTc2MjA3NjQ1Mn0.H6Npgorb6pp2wdZ8IGRih60frc7cgLS0IKjDluvH7Ts",
                "created_at": "2025-10-09T09:29:30.000Z",
                "role": "admin",
                "address": "174 Giải Phóng"
            }
        },
        {
            "id": "2676",
            "dish_id": "2354",
            "owner_id": "1",
            "status": null,
            "created_at": "2025-10-24T23:09:09.000Z",
            "dish": {
                "id": "2354",
                "name": "Gà nướng táo và rau củ",
                "description": "Thời gian nấu: 60 phút\nKhẩu phần: 6 người\nNguồn: https://cookpad.com/vn/cong-thuc/17198541\nNguyên liệu:\n- 2 cái đùi gàgóc tư\n- 1 quả táo\n- 1/2 củ cà rốt\n- 1/2 củ hành tây\n- Ít bông cải\n- 1 củ tỏi,\n- Ít cà chua bi socola\n- Lá hương thảo\n- Giavị",
                "image_url": "https://img-global.cpcdn.com/steps/833cefe783df5d1f/160x128cq80/ga-n%C6%B0%E1%BB%9Bng-tao-va-rau-c%E1%BB%A7-recipe-step-4-photo.jpg",
                "created_at": "2025-10-24T23:09:08.000Z"
            },
            "owner": {
                "id": "1",
                "email": "Quydang16012004@gmail.com",
                "phone": "0936797592",
                "password_hash": "$2b$12$U9iWvphqPBGpIGmo3JzEee91qHhPT.kX7/1ychWJlefHVYx5C6zT6",
                "full_name": "Đặng Ngọc Quý",
                "avatar_url": "https://www.jwt.io/",
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJRdXlkYW5nMTYwMTIwMDRAZ21haWwuY29tIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3NjE0NzE2NTIsImV4cCI6MTc2MjA3NjQ1Mn0.H6Npgorb6pp2wdZ8IGRih60frc7cgLS0IKjDluvH7Ts",
                "created_at": "2025-10-09T09:29:30.000Z",
                "role": "admin",
                "address": "174 Giải Phóng"
            }
        },
        {
            "id": "2675",
            "dish_id": "2353",
            "owner_id": "1",
            "status": null,
            "created_at": "2025-10-24T23:09:07.000Z",
            "dish": {
                "id": "2353",
                "name": "Súp táo hầm rau củ đông trùng hạ thảo",
                "description": "Thời gian nấu: 60 phút\nKhẩu phần: 4 người\nNguồn: https://cookpad.com/vn/cong-thuc/17198560\nNguyên liệu:\n- 1 kg sườn\n- 2 trái táo\n- 1 trái bắp\n- 1 bịch nấm đông cô\n- 100 g hạt sen\n- Ít đông trùng hạ thảo\n- Ít táo tàu\n- 1 bịch nấm linh chi trắng\n- 2 củ hành tím\n- Giavị",
                "image_url": "https://img-global.cpcdn.com/steps/0e7cd8f621e26935/160x128cq80/sup-tao-h%E1%BA%A7m-rau-c%E1%BB%A7-dong-trung-h%E1%BA%A1-th%E1%BA%A3o-recipe-step-3-photo.jpg",
                "created_at": "2025-10-24T23:09:07.000Z"
            },
            "owner": {
                "id": "1",
                "email": "Quydang16012004@gmail.com",
                "phone": "0936797592",
                "password_hash": "$2b$12$U9iWvphqPBGpIGmo3JzEee91qHhPT.kX7/1ychWJlefHVYx5C6zT6",
                "full_name": "Đặng Ngọc Quý",
                "avatar_url": "https://www.jwt.io/",
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJRdXlkYW5nMTYwMTIwMDRAZ21haWwuY29tIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3NjE0NzE2NTIsImV4cCI6MTc2MjA3NjQ1Mn0.H6Npgorb6pp2wdZ8IGRih60frc7cgLS0IKjDluvH7Ts",
                "created_at": "2025-10-09T09:29:30.000Z",
                "role": "admin",
                "address": "174 Giải Phóng"
            }
        }
    ],
    "pagination": {
        "currentPage": 1,
        "totalPages": 269,
        "totalItems": 2684,
        "itemsPerPage": 10,
        "hasNextPage": true,
        "hasPrevPage": false
    }
}
### GET http://localhost:8090/api/recipes/:id

Lấy công thức chi tiết.

**Authentication:** Cần

---

### POST /recipes

Tạo công thức mới.

**Authentication:** Cần

**Request:**
```json
{
  "dish_id": 1,
  "status": "public",
  "steps": [
    {
      "step_number": 1,
      "description": "Chuẩn bị nguyên liệu"
    }
  ]
}
```

---

### PUT http://localhost:8090/api/recipes/:id

Cập nhật công thức.

**Authentication:** Cần

---

### DELETE /recipes/:id

Xóa công thức.

**Authentication:** Cần

---

## Menu APIs

### GET /menus

Lấy danh sách menu.

**Authentication:** Cần (JWT Token)

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10)
- `familyId` (optional)

---

### POST /menus

Tạo menu mới.

**Authentication:** Cần

**Request:**
```json
{
  "description": "Menu tuần này"
}
```

---

## Dish Review APIs

### GET /dishes/:dishId/reviews

Lấy đánh giá món ăn.

**Authentication:** Cần (JWT Token)

---

### GET /dishes/:dishId/reviews/stats

Lấy thống kê đánh giá.

**Authentication:** Cần (JWT Token)

**Response:**
```json
{
  "success": true,
  "data": {
    "averageRating": 4.5,
    "totalReviews": 20,
    "ratingDistribution": {
      "1": 0,
      "2": 1,
      "3": 2,
      "4": 7,
      "5": 10
    }
  }
}
```

---

### POST /dishes/:dishId/reviews

Tạo đánh giá mới.

**Authentication:** Cần

**Request:**
```json
{
  "rating": 5,
  "comment": "Món ăn rất ngon!"
}
```

---

## Quyền Truy Cập

### Authentication Required
- Tạo/sửa/xóa món ăn
- Quản lý công thức
- Quản lý menu
- Đánh giá món ăn

### Public
- Xem danh sách món ăn
- Tìm kiếm
- Xem chi tiết
- Đăng ký/đăng nhập

---

*Tài liệu cập nhật: Tháng 1, 2024*
