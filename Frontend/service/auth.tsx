import {  post } from "@/utils/api";


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