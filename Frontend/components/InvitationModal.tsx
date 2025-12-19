import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/themes';
import { Share, Clipboard } from 'react-native';

interface InvitationData {
  invitation_code: string;
  qr_code: string; // base64 image
  family_id: number;
  family_name: string;
}

interface InvitationModalProps {
  visible: boolean;
  onClose: () => void;
  familyId: number;
  familyName: string;
  onFetchInvitation: (familyId: number) => Promise<InvitationData>;
}

export default function InvitationModal({
  visible,
  onClose,
  familyId,
  familyName,
  onFetchInvitation,
}: InvitationModalProps) {
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && familyId) {
      fetchInvitation();
    } else {
      setInvitationData(null);
    }
  }, [visible, familyId]);

  const fetchInvitation = async () => {
    try {
      setLoading(true);
      const data = await onFetchInvitation(familyId);
      setInvitationData(data);
    } catch (error: any) {
      console.error('Error fetching invitation:', error);
      
      // Xử lý lỗi 403 - Không có quyền
      if (error?.response?.status === 403 || error?.response?.statusCode === 403) {
        const errorMessage = error?.response?.data?.message || 
                            error?.response?.data?.resultMessage?.vn || 
                            'Bạn không có quyền xem mã mời. Chỉ chủ nhóm mới có quyền này.';
        Alert.alert('Không có quyền', errorMessage, [
          { text: 'Đóng', onPress: onClose }
        ]);
      } else {
        // Lỗi khác
        Alert.alert('Lỗi', 'Không thể tải mã mời. Vui lòng thử lại.', [
          { text: 'Đóng', onPress: onClose }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (invitationData?.invitation_code) {
      Clipboard.setString(invitationData.invitation_code);
      Alert.alert('Thành công', 'Đã sao chép mã mời vào clipboard');
    }
  };

  const handleShare = async () => {
    if (invitationData?.invitation_code) {
      try {
        await Share.share({
          title: `Mời tham gia nhóm ${familyName}`,
          message: `Mã mời tham gia nhóm ${familyName}: ${invitationData.invitation_code}`,
        });
      } catch (error: any) {
        if (error?.message !== 'User did not share') {
          console.error('Error sharing:', error);
        }
      }
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalContainer}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Mã mời tham gia</Text>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeButton}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={24} color={COLORS.darkGrey} />
                </TouchableOpacity>
              </View>

              {/* Content */}
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={COLORS.purple} />
                  <Text style={styles.loadingText}>Đang tải mã mời...</Text>
                </View>
              ) : invitationData ? (
                <ScrollView
                  style={styles.scrollView}
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator={true}
                  bounces={true}
                  nestedScrollEnabled={true}
                >
                  {/* Family Name */}
                  <Text style={styles.familyName}>{familyName}</Text>

                  {/* QR Code */}
                  {invitationData.qr_code && (
                    <View style={styles.qrContainer}>
                      <Image
                        source={{ uri: invitationData.qr_code }}
                        style={styles.qrCode}
                        resizeMode="contain"
                      />
                    </View>
                  )}

                  {/* Invitation Code */}
                  <View style={styles.codeContainer}>
                    <Text style={styles.codeLabel}>Mã mời</Text>
                    <View style={styles.codeDisplay}>
                      <Text style={styles.codeText}>
                        {invitationData.invitation_code}
                      </Text>
                      <TouchableOpacity
                        onPress={handleCopyCode}
                        style={styles.copyButton}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name="copy-outline"
                          size={20}
                          color={COLORS.purple}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Instructions */}
                  <View style={styles.instructionsContainer}>
                    <Text style={styles.instructionsText}>
                      Chia sẻ mã mời hoặc QR code này để mời người khác tham gia nhóm
                    </Text>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.actionsContainer}>
                    <TouchableOpacity
                      style={styles.shareButton}
                      onPress={handleShare}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="share-social-outline"
                        size={20}
                        color={COLORS.white}
                      />
                      <Text style={styles.shareButtonText}>Chia sẻ</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.copyCodeButton}
                      onPress={handleCopyCode}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="copy-outline"
                        size={20}
                        color={COLORS.purple}
                      />
                      <Text style={styles.copyCodeButtonText}>Sao chép mã</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              ) : (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle-outline" size={48} color={COLORS.grey} />
                  <Text style={styles.errorText}>
                    Không thể tải mã mời
                  </Text>
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const modalMaxHeight = screenHeight * 0.85;
const headerHeight = 61; // Header height: padding 20*2 + border 1 + text ~20
const scrollViewHeight = modalMaxHeight - headerHeight;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: modalMaxHeight,
    height: modalMaxHeight,
    overflow: 'hidden',
    flexDirection: 'column',
    alignSelf: 'center',
  },
  scrollView: {
    height: scrollViewHeight,
    flexGrow: 0,
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
    paddingBottom: 20,
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
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.grey,
  },
  familyName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.darkGrey,
    marginBottom: 20,
    textAlign: 'center',
  },
  qrContainer: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.lightGrey,
  },
  qrCode: {
    width: Math.min(200, Dimensions.get('window').width * 0.6),
    height: Math.min(200, Dimensions.get('window').width * 0.6),
  },
  codeContainer: {
    width: '100%',
    marginBottom: 20,
  },
  codeLabel: {
    fontSize: 14,
    color: COLORS.grey,
    marginBottom: 8,
    fontWeight: '500',
  },
  codeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGrey,
    borderRadius: 12,
    padding: 16,
    justifyContent: 'space-between',
  },
  codeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGrey,
    letterSpacing: 2,
    flex: 1,
  },
  copyButton: {
    padding: 8,
    marginLeft: 12,
  },
  instructionsContainer: {
    backgroundColor: COLORS.lightBlue,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    width: '100%',
  },
  instructionsText: {
    fontSize: 14,
    color: COLORS.darkGrey,
    textAlign: 'center',
    lineHeight: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.purple,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  shareButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  copyCodeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.lightGrey,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  copyCodeButtonText: {
    color: COLORS.purple,
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.grey,
    textAlign: 'center',
  },
});

