enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export type JwtUser = {
  id: number;
  email: string;
  role: UserRole;
  isAdmin: boolean;
};
