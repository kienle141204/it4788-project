import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/themes';
import QRScannerModal from './QRScannerModal';

interface JoinFamilyModalProps {
  visible: boolean;
  onClose: () => void;
  onJoin: (invitationCode: string) => Promise<void>;
}

export default function JoinFamilyModal({
  visible,
  onClose,
  onJoin,
}: JoinFamilyModalProps) {
  const [invitationCode, setInvitationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const handleJoin = async () => {
    if (!invitationCode.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mã mời');
      return;
    }

    if (invitationCode.trim().length < 8) {
      Alert.alert('Lỗi', 'Mã mời phải có ít nhất 8 ký tự');
      return;
    }

    try {
      setLoading(true);
      await onJoin(invitationCode.trim());
      setInvitationCode('');
      onClose();
    } catch (error: any) {
      // Error handling is done in parent component
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setInvitationCode('');
      onClose();
    }
  };

  const handleScanQR = (code: string) => {
    setInvitationCode(code);
    setShowScanner(false);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalContainer}>
                {/* Header */}
                <View style={styles.header}>
                  <Text style={styles.title}>Tham gia nhóm</Text>
                  <TouchableOpacity
                    onPress={handleClose}
                    style={styles.closeButton}
                    activeOpacity={0.7}
                    disabled={loading}
                  >
                    <Ionicons name="close" size={24} color={COLORS.darkGrey} />
                  </TouchableOpacity>
                </View>

                {/* Content */}
                <View style={styles.content}>
                  <View style={styles.iconContainer}>
                    <Ionicons
                      name="qr-code-outline"
                      size={48}
                      color={COLORS.purple}
                    />
                  </View>

                  <Text style={styles.description}>
                    Nhập mã mời hoặc quét QR code để tham gia nhóm
                  </Text>

                  <View style={styles.inputContainer}>
                    <View style={styles.inputLabelContainer}>
                      <Text style={styles.inputLabel}>Mã mời</Text>
                      <TouchableOpacity
                        style={styles.scanButton}
                        onPress={() => setShowScanner(true)}
                        activeOpacity={0.7}
                        disabled={loading}
                      >
                        <Ionicons
                          name="qr-code-outline"
                          size={20}
                          color={COLORS.purple}
                        />
                        <Text style={styles.scanButtonText}>Quét QR</Text>
                      </TouchableOpacity>
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Nhập mã mời (8 ký tự trở lên)"
                      placeholderTextColor={COLORS.grey}
                      value={invitationCode}
                      onChangeText={setInvitationCode}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      editable={!loading}
                      maxLength={50}
                    />
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.actionsContainer}>
                    <TouchableOpacity
                      style={[
                        styles.cancelButton,
                        loading && styles.buttonDisabled,
                      ]}
                      onPress={handleClose}
                      activeOpacity={0.7}
                      disabled={loading}
                    >
                      <Text style={styles.cancelButtonText}>Hủy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.joinButton,
                        loading && styles.buttonDisabled,
                      ]}
                      onPress={handleJoin}
                      activeOpacity={0.7}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator
                          size="small"
                          color={COLORS.white}
                        />
                      ) : (
                        <>
                          <Ionicons
                            name="checkmark-circle-outline"
                            size={20}
                            color={COLORS.white}
                          />
                          <Text style={styles.joinButtonText}>Tham gia</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>

      {/* QR Scanner Modal */}
      <QRScannerModal
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleScanQR}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  keyboardView: {
    width: '100%',
    maxWidth: 400,
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    width: '100%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGrey,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkGrey,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    color: COLORS.grey,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    color: COLORS.darkGrey,
    fontWeight: '500',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.lightGrey,
    borderRadius: 8,
  },
  scanButtonText: {
    fontSize: 14,
    color: COLORS.purple,
    fontWeight: '600',
  },
  input: {
    backgroundColor: COLORS.lightGrey,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.darkGrey,
    borderWidth: 1,
    borderColor: COLORS.lightGrey,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.lightGrey,
    borderRadius: 12,
    paddingVertical: 14,
  },
  cancelButtonText: {
    color: COLORS.darkGrey,
    fontSize: 16,
    fontWeight: '600',
  },
  joinButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.purple,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  joinButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

