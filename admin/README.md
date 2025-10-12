# 🛒 Admin Dashboard - Ứng dụng Đi Chợ Tiện Lợi

Giao diện quản trị đầy đủ cho ứng dụng đi chợ với React + Tailwind CSS.

## 📋 Tính năng

- ✅ **Quản lý Người dùng**: Thêm, sửa, xóa, tìm kiếm người dùng và nhóm
- 🥬 **Quản lý Thực phẩm**: Quản lý danh mục thực phẩm, giá cả, đơn vị
- 🍲 **Quản lý Món ăn**: Quản lý thông tin món ăn, độ khó, thời gian nấu
- 📖 **Quản lý Công thức**: Quản lý nguyên liệu, các bước, mẹo nấu ăn

## 🏗️ Cấu trúc thư mục

```
src/
├── components/
│   ├── common/           # Components tái sử dụng
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── Select.jsx
│   │   ├── TextArea.jsx
│   │   ├── Modal.jsx
│   │   ├── Table.jsx
│   │   ├── SearchBar.jsx
│   │   └── Pagination.jsx
│   │
│   └── layout/           # Layout components
│       ├── Sidebar.jsx
│       └── Header.jsx
│
├── pages/                # Các trang chính
│   ├── UsersPage.jsx
│   ├── FoodsPage.jsx
│   ├── DishesPage.jsx
│   └── RecipesPage.jsx
│
├── App.jsx              # Main app component
├── main.jsx             # Entry point
└── index.css            # Global styles
```

## 🚀 Hướng dẫn cài đặt

### 1. Clone hoặc tạo project mới

```bash
npm create vite@latest grocery-admin -- --template react
cd grocery-admin
```

### 2