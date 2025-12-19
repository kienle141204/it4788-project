import { getAccess, patchAccess, deleteAccess } from '@/utils/api';

export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  body?: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface NotificationListResponse {
  success: boolean;
  message: string;
  data: NotificationItem[];
  pagination: NotificationPagination;
}

export interface UnreadCountResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
  };
}

export const getNotifications = async (page = 1, limit = 10): Promise<NotificationListResponse> => {
  const response = await getAccess('notifications', { page, limit });
  return response;
};

export const getUnreadNotifications = async (page = 1, limit = 10): Promise<NotificationListResponse> => {
  const response = await getAccess('notifications/unread', { page, limit });
  return response;
};

export const getUnreadNotificationCount = async (): Promise<UnreadCountResponse> => {
  const response = await getAccess('notifications/unread/count');
  return response;
};

export const markNotificationAsRead = async (id: number) => {
  const response = await patchAccess(`notifications/${id}/read`, {});
  return response;
};

export const markAllNotificationsAsRead = async () => {
  const response = await patchAccess('notifications/read-all', {});
  return response;
};

export const deleteNotification = async (id: number) => {
  const response = await deleteAccess(`notifications/${id}`);
  return response;
};

export const deleteAllNotifications = async () => {
  const response = await deleteAccess('notifications');
  return response;
};

// Device Token APIs
export interface RegisterDeviceTokenRequest {
  deviceToken: string;
  platform: 'ios' | 'android';
}

export interface DeviceTokenResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    userId: number;
    deviceToken: string;
    platform: 'ios' | 'android';
    createdAt: string;
  };
}

export const registerDeviceToken = async (data: RegisterDeviceTokenRequest): Promise<DeviceTokenResponse> => {
  const response = await postAccess('notifications/device-token', data);
  return response;
};

export const getDeviceTokens = async () => {
  const response = await getAccess('notifications/device-token');
  return response;
};

export const deleteDeviceToken = async (token: string) => {
  const response = await deleteAccess(`notifications/device-token/${token}`);
  return response;
};


