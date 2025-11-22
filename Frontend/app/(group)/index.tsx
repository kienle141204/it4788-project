import React, { useState } from 'react';
import {
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { groupStyles } from '../../styles/group.styles';
import { COLORS } from '../../constants/themes';

interface Family {
  id: string;
  name: string;
  memberCount: number;
}

// Mock data
const mockFamilies: Family[] = [
  { id: '1', name: 'Gia đình 1', memberCount: 3 },
  { id: '2', name: 'Gia đình 2', memberCount: 5 },
  { id: '3', name: 'Gia đình 3', memberCount: 2 },
  { id: '4', name: 'Gia đình 4', memberCount: 4 },
];

export default function GroupPage() {
  const router = useRouter();
  const [families] = useState<Family[]>(mockFamilies);

  const handleBack = () => {
    router.back();
  };

  const handleViewFamily = (familyId: string) => {
    // TODO: Điều hướng đến trang chi tiết gia đình
    console.log('View family:', familyId);
    // router.push(`/(group)/${familyId}` as any);
  };

  const handleAddFamily = () => {
    // TODO: Điều hướng đến trang thêm gia đình
    console.log('Add family');
    // router.push('/(group)/create' as any);
  };

  return (
    <SafeAreaView style={groupStyles.container} edges={['top']}>
      <StatusBar barStyle='dark-content' backgroundColor='#FFFFFF' />

      {/* Header */}
      <View style={groupStyles.header}>
        <TouchableOpacity onPress={handleBack} style={groupStyles.backButton}>
          <Ionicons name='arrow-back' size={24} color={COLORS.darkGrey} />
        </TouchableOpacity>

        <Text style={groupStyles.headerTitle}>Gia đình</Text>

        <View style={{ width: 32 }} />
      </View>

      {/* Family List */}
      <ScrollView
        style={groupStyles.scrollView}
        contentContainerStyle={groupStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {families.length === 0 ? (
          <View style={groupStyles.emptyState}>
            <Ionicons name='people-outline' size={48} color={COLORS.grey} />
            <Text style={groupStyles.emptyStateText}>
              Chưa có gia đình nào
            </Text>
          </View>
        ) : (
          <>
            {families.map(family => (
              <View key={family.id} style={groupStyles.familyCard}>
                <View style={groupStyles.familyIconContainer}>
                  <Ionicons name='people' size={28} color={COLORS.blue} />
                </View>

                <View style={groupStyles.familyInfo}>
                  <Text style={groupStyles.familyName}>{family.name}</Text>
                  <Text style={groupStyles.familyMembers}>
                    {family.memberCount} thành viên
                  </Text>
                </View>

                <TouchableOpacity
                  style={groupStyles.viewButton}
                  onPress={() => handleViewFamily(family.id)}
                  activeOpacity={0.7}
                >
                  <Text style={groupStyles.viewButtonText}>Xem</Text>
                </TouchableOpacity>
              </View>
            ))}

            {/* Add Family Button */}
            <TouchableOpacity
              style={groupStyles.addButton}
              onPress={handleAddFamily}
              activeOpacity={0.8}
            >
              <Ionicons name='add' size={24} color={COLORS.white} />
              <Text style={groupStyles.addButtonText}>Thêm gia đình</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

