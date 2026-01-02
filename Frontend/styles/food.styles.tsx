import { StyleSheet } from 'react-native';
import { COLORS } from '../constants/themes';

export const foodStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  notificationButton: {
    padding: 4,
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.purple,
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: COLORS.white,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.purple,
  },
  tabInactive: {
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.grey,
  },
  tabTextActive: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.purple,
  },
  tabTextInactive: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.grey,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f1f2',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.darkGrey,
    padding: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGrey,
    marginBottom: 16,
    marginTop: 8,
  },
  foodList: {
    gap: 16,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    minHeight: 104,
    maxHeight: 104,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardImageContainer: {
    marginRight: 12,
    flexShrink: 0,
  },
  cardImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#BBF7D0',
  },
  cardImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#BBF7D0', // Light green
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0, // Cho phép text wrap
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGrey,
    marginBottom: 4,
    flexShrink: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.grey,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loaderText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.darkGrey,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.purple,
    marginLeft: 8,
  },
  loadMoreButton: {
    marginTop: 24,
    alignSelf: 'center',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: COLORS.purple,
  },
  loadMoreButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

