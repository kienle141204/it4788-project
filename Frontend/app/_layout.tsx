import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NotificationsProvider } from "@/context/NotificationsContext";
import { StatusBar } from "expo-status-bar";
import { COLORS } from "@/constants/themes";
import { useEffect, useRef } from "react";
import * as SystemUI from "expo-system-ui";
import { subscribeToNetworkStatus, NetworkStatus } from "@/utils/network";
import { processQueue, getQueueStatus } from "@/utils/requestQueue";
import Toast from "react-native-toast-message";

export default function RootLayout() {
  const wasOfflineRef = useRef(false);
  const isProcessingQueueRef = useRef(false);

  useEffect(() => {
    // Set status bar background color for Android to match header
    SystemUI.setBackgroundColorAsync(COLORS.background);
  }, []);

  useEffect(() => {
    // Subscribe to network status changes
    const unsubscribe = subscribeToNetworkStatus(async (status: NetworkStatus) => {
      const isOnline = status.isConnected && 
                      (status.isInternetReachable === true || status.isInternetReachable === null);
      
      // If we were offline and now we're online, process the queue
      if (wasOfflineRef.current && isOnline && !isProcessingQueueRef.current) {
        isProcessingQueueRef.current = true;
        
        try {
          // Check if there are queued requests
          const queueStatus = await getQueueStatus();
          
          if (queueStatus.total > 0) {
            console.log(`[RootLayout] Network back online, processing ${queueStatus.total} queued requests...`);
            
            // Show toast notification
            Toast.show({
              type: 'info',
              text1: 'Đang đồng bộ dữ liệu',
              text2: `Đang gửi ${queueStatus.total} yêu cầu đã lưu...`,
              visibilityTime: 2000,
            });
            
            // Process the queue
            const result = await processQueue();
            
            // Show success/failure notification
            if (result.success > 0) {
              Toast.show({
                type: 'success',
                text1: 'Đồng bộ thành công',
                text2: `Đã gửi ${result.success} yêu cầu thành công`,
                visibilityTime: 3000,
              });
            }
            
            if (result.failed > 0 && result.success === 0) {
              Toast.show({
                type: 'error',
                text1: 'Đồng bộ thất bại',
                text2: `${result.failed} yêu cầu không thể gửi. Vui lòng thử lại.`,
                visibilityTime: 4000,
              });
            } else if (result.failed > 0) {
              Toast.show({
                type: 'info',
                text1: 'Đồng bộ một phần',
                text2: `${result.success} thành công, ${result.failed} thất bại`,
                visibilityTime: 3000,
              });
            }
          }
        } catch (error) {
          console.error('[RootLayout] Error processing queue:', error);
          Toast.show({
            type: 'error',
            text1: 'Lỗi đồng bộ',
            text2: 'Không thể xử lý hàng đợi yêu cầu',
            visibilityTime: 3000,
          });
        } finally {
          isProcessingQueueRef.current = false;
        }
      }
      
      // Update offline state
      wasOfflineRef.current = !isOnline;
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <NotificationsProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </NotificationsProvider>
    </SafeAreaProvider>
  );
}
