import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/themes';

interface QRScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

export default function QRScannerModal({
  visible,
  onClose,
  onScan,
}: QRScannerModalProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (visible) {
      setScanned(false);
      if (permission && !permission.granted) {
        requestPermission();
      }
    }
  }, [visible, permission]);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    
    setScanned(true);
    onScan(data);
    onClose();
  };

  const handleClose = () => {
    setScanned(false);
    onClose();
  };

  if (!visible) return null;

  // Camera không hỗ trợ trên web
  if (Platform.OS === 'web') {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            <Ionicons name="camera-outline" size={64} color={COLORS.grey} />
            <Text style={styles.permissionTitle}>Không hỗ trợ trên web</Text>
            <Text style={styles.permissionText}>
              Chức năng quét QR code chỉ khả dụng trên thiết bị di động. Vui lòng sử dụng ứng dụng trên iOS hoặc Android.
            </Text>
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <Text style={styles.permissionButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  if (!permission) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            <ActivityIndicator size="large" color={COLORS.purple} />
            <Text style={styles.loadingText}>Đang kiểm tra quyền truy cập camera...</Text>
          </View>
        </View>
      </Modal>
    );
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            <Ionicons name="camera-outline" size={64} color={COLORS.grey} />
            <Text style={styles.permissionTitle}>Cần quyền truy cập camera</Text>
            <Text style={styles.permissionText}>
              Ứng dụng cần quyền truy cập camera để quét QR code
            </Text>
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={requestPermission}
              activeOpacity={0.7}
            >
              <Text style={styles.permissionButtonText}>Cấp quyền</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.container}>
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'] as any,
          }}
        >
          {/* Overlay */}
          <View style={styles.overlay}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeButton}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={28} color={COLORS.white} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Quét QR code</Text>
              <View style={styles.placeholder} />
            </View>

            {/* Instructions */}
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsText}>
                Đưa camera vào QR code để quét
              </Text>
            </View>

            {/* Scanner Frame */}
            <View style={styles.scannerFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
          </View>
        </CameraView>
      </View>
    </Modal>
  );
}

const { width, height } = Dimensions.get('window');
const scannerSize = Math.min(width * 0.7, 250);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  closeButton: {
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
  placeholder: {
    width: 44,
  },
  instructionsContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  instructionsText: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: '500',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  scannerFrame: {
    position: 'absolute',
    top: height / 2 - scannerSize / 2,
    left: width / 2 - scannerSize / 2,
    width: scannerSize,
    height: scannerSize,
    borderWidth: 2,
    borderColor: COLORS.purple,
    borderRadius: 20,
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: COLORS.purple,
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 20,
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 20,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 20,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 20,
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    margin: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: COLORS.grey,
    textAlign: 'center',
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkGrey,
    marginTop: 16,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 14,
    color: COLORS.grey,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  permissionButton: {
    backgroundColor: COLORS.purple,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginBottom: 12,
  },
  permissionButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 10,
  },
  cancelButtonText: {
    color: COLORS.grey,
    fontSize: 14,
  },
});

