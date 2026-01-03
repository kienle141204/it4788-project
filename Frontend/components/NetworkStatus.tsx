import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNetworkStatus } from '@/utils/network';
import { getQueueStatus, processQueue } from '@/utils/requestQueue';
import Toast from 'react-native-toast-message';

interface NetworkStatusProps {
  showWhenOnline?: boolean; // Show component even when online (to show queue status)
  position?: 'top' | 'bottom';
  style?: any;
}

export const NetworkStatus: React.FC<NetworkStatusProps> = ({
  showWhenOnline = false,
  position = 'top',
  style,
}) => {
  const { isConnected, isInternetReachable, isOnline } = useNetworkStatus();
  const [queueStatus, setQueueStatus] = useState({ total: 0, pending: 0, failed: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Update queue status periodically
  useEffect(() => {
    const updateQueueStatus = async () => {
      const status = await getQueueStatus();
      setQueueStatus(status);
      setIsVisible(status.total > 0 || !isOnline || showWhenOnline);
    };

    updateQueueStatus();
    const interval = setInterval(updateQueueStatus, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [isOnline, showWhenOnline]);

  const handleManualSync = async () => {
    if (!isOnline || isProcessing) return;

    setIsProcessing(true);
    try {
      const result = await processQueue();
      
      if (result.success > 0) {
        Toast.show({
          type: 'success',
          text1: 'Đồng bộ thành công',
          text2: `Đã gửi ${result.success} yêu cầu`,
          visibilityTime: 2000,
        });
      } else if (result.failed > 0) {
        Toast.show({
          type: 'error',
          text1: 'Đồng bộ thất bại',
          text2: 'Không thể gửi các yêu cầu',
          visibilityTime: 2000,
        });
      }
      
      // Update queue status
      const status = await getQueueStatus();
      setQueueStatus(status);
    } catch (error) {
      console.error('[NetworkStatus] Error processing queue:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Không thể đồng bộ',
        visibilityTime: 2000,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isVisible) return null;

  const getStatusColor = () => {
    if (!isOnline) return '#FF6B6B'; // Red when offline
    if (queueStatus.failed > 0) return '#FFA500'; // Orange when there are failed requests
    if (queueStatus.pending > 0) return '#4ECDC4'; // Teal when there are pending requests
    return '#51CF66'; // Green when online and no queue
  };

  const getStatusText = () => {
    if (!isOnline) return 'Không có kết nối mạng';
    if (queueStatus.failed > 0) return `${queueStatus.failed} yêu cầu thất bại`;
    if (queueStatus.pending > 0) return `${queueStatus.pending} yêu cầu đang chờ`;
    return 'Đã kết nối';
  };

  return (
    <View
      style={[
        styles.container,
        position === 'top' ? styles.topContainer : styles.bottomContainer,
        { backgroundColor: getStatusColor() },
        style,
      ]}
    >
      <View style={styles.content}>
        <View style={styles.statusInfo}>
          <View style={[styles.indicator, { backgroundColor: isOnline ? '#FFF' : '#FFE5E5' }]} />
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>
        
        {queueStatus.total > 0 && isOnline && (
          <TouchableOpacity
            onPress={handleManualSync}
            disabled={isProcessing}
            style={styles.syncButton}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.syncButtonText}>Đồng bộ</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    zIndex: 1000,
  },
  topContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
  },
  syncButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

