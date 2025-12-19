import { getAccess, post } from '../utils/api';


export interface LoginResponse {
  statusCode?: number;
  message?: string;
  access_token?: string;
  refresh_token?: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export interface RegisterResponse{
  message?: string,
  statusCode: number
}

export interface OTPResponse{
  statusCode: string,
  access_token: string,
  refresh_token: string,
  message: string
}

export interface ResenResponse{
  message?:string
  statusCode?:string
}


export const loginUSer = async (data : object) :Promise<LoginResponse>=> {
    const res = await post('auth/login', data)
    return res
}

export const registerUser = async (data: object) : Promise<RegisterResponse>=> {
  const res = await post('auth/register-temp', data)
  return res
}

export const OTPValidate = async (data: object) : Promise<OTPResponse> => {
  const res = await post('auth/verify-otp', data)
  return res
}

export const resendEmail =async (data: object) : Promise<ResenResponse> => {
  const res = await post('auth/resend-otp', data)
  return res
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
}

export const refreshToken = async (refresh_token: string): Promise<RefreshTokenResponse> => {
  const res = await post('auth/refresh-token', { refresh_token });
  return res;
}

export interface UserProfile {
  id: number;
  email: string;
  fullname?: string;
  full_name?: string;
  avatar_url?: string;
  address?: string;
  phone?: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export const getUserProfile = async (): Promise<UserProfile> => {
  try {
    const res = await getAccess('auth/profile');
    // API response có cấu trúc: { success, message, data: { ...userInfo } }
    return res?.data || res;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
}