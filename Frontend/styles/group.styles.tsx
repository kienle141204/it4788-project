import { StyleSheet } from 'react-native';
import { COLORS } from '../constants/themes';

export const groupStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGrey,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 16,
  },
  familyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  familyIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.lightBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  familyInfo: {
    flex: 1,
    gap: 4,
  },
  familyName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGrey,
  },
  familyMembers: {
    fontSize: 14,
    color: COLORS.grey,
  },
  viewButton: {
    backgroundColor: COLORS.purple,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  viewButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: COLORS.purple,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    paddingVertical: 80,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.grey,
    textAlign: 'center',
  },
});

