# Authorization Guards & Decorators

## Tổng quan

Hệ thống phân quyền sử dụng các guards và decorators để kiểm tra quyền truy cập API một cách tự động và có thể tái sử dụng.

## Các Guard và Decorator

### 1. `@Roles()` - Decorator chỉ định roles được phép

**File:** `src/common/decorators/roles.decorator.ts`

**Usage:**
```typescript
import { Roles } from '../../common/decorators/roles.decorator';

@Roles('admin')
@Get()
async getAllUsers() { ... }

@Roles('admin', 'user')  // Cả admin và user đều được phép
@Get()
async getData() { ... }
```

### 2. `RolesGuard` - Guard kiểm tra role

**File:** `src/modules/auth/guards/roles.guard.ts`

**Usage:**
```typescript
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Get()
async adminOnly() { ... }
```

### 3. `SelfOrAdminGuard` - Guard kiểm tra user có phải chính họ hoặc admin

**File:** `src/modules/auth/guards/self-or-admin.guard.ts`

**Usage:**
```typescript
import { SelfOrAdminGuard } from '../auth/guards/self-or-admin.guard';

// Kiểm tra user có phải chính họ (qua param 'id') hoặc admin
@UseGuards(JwtAuthGuard, SelfOrAdminGuard('id'))
@Get(':id')
async getUser(@Param('id') id: number) { ... }
```

### 4. `@Owner()` - Decorator để kiểm tra owner (advanced)

**File:** `src/common/decorators/owner.decorator.ts`

**Note:** Cần load resource vào request trước khi guard chạy (thông qua interceptor hoặc trong controller).

### 5. `OwnerGuard` - Guard kiểm tra owner (advanced)

**File:** `src/modules/auth/guards/owner.guard.ts`

**Note:** Cần load resource vào `request.resource` trước khi guard chạy.

## Ví dụ sử dụng

### Example 1: Admin only endpoint
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Get()
async getAllUsers() {
  return this.userService.getAllUsers();
}
```

### Example 2: Self or Admin
```typescript
@UseGuards(JwtAuthGuard, SelfOrAdminGuard('id'))
@Put(':id')
async updateUser(@Param('id') id: number, @Body() dto: UpdateUserDto) {
  return this.userService.updateUser(id, dto);
}
```

### Example 3: Multiple roles
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'manager')
@Get()
async getData() {
  return this.service.getData();
}
```

## Lưu ý

1. **Thứ tự guards:** Luôn đặt `JwtAuthGuard` trước các guard khác để đảm bảo user đã được authenticate.

2. **Admin bypass:** Tất cả các guard đều cho phép admin bypass kiểm tra (trừ `RolesGuard` nếu không có `'admin'` trong danh sách roles).

3. **SelfOrAdminGuard:** Hoạt động tốt với các endpoint có pattern `/resource/:id` và kiểm tra `param.id === user.id`.

4. **OwnerGuard:** Cần load resource vào request trước khi guard chạy. Có thể sử dụng interceptor hoặc load trong controller.

## So sánh với cách cũ

### Trước (manual check):
```typescript
@UseGuards(JwtAuthGuard)
@Get()
async getAllUsers(@User() user: JwtUser) {
  if (user.role !== "admin") {
    throw new ForbiddenException('Only admin can view all users');
  }
  return this.userService.getAllUsers();
}
```

### Sau (sử dụng guard):
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Get()
async getAllUsers() {
  return this.userService.getAllUsers();
}
```

Code ngắn gọn hơn, dễ đọc và có thể tái sử dụng!

