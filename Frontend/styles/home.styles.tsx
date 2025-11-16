import { StyleSheet } from 'react-native';
import { COLORS } from '../constants/themes';

export const homeStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 20,
    marginTop: 30,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  homeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.darkGrey,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0, // Không cho phép co lại
  },
  notificationButton: {
    marginRight: 12,
    position: 'relative',
    padding: 4, // Thêm padding để dễ nhấn
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    backgroundColor: COLORS.purple,
    borderRadius: 4,
  },
  userProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexShrink: 1, // Cho phép co lại nếu cần
    minWidth: 0, // Cho phép text truncate
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  profileImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.lightBlue, // Light blue background
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: COLORS.darkGrey,
    marginBottom: 2,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkGrey,
  },
  taskCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: COLORS.purple,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  taskCardMenu: {
    position: 'absolute',
    top: 15,
    right: 15,
  },
  taskCardContent: {
    flex: 1,
    marginRight: 20,
  },
  taskCardTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  viewTaskButton: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  viewTaskButtonText: {
    color: COLORS.purple,
    fontSize: 14,
    fontWeight: '600',
  },
  progressCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  progressText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  notificationSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.darkGrey,
    marginRight: 8,
  },
  sectionCount: {
    fontSize: 14,
    color: COLORS.purple,
    fontWeight: '600',
  },
  notificationCard: {
    backgroundColor: COLORS.lightBlue,
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
  },
  notificationText: {
    color: COLORS.darkGrey,
    fontSize: 14,
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.lightGrey,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.blue,
    borderRadius: 2,
  },
  featuresSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureButton: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  featureText: {
    fontSize: 12,
    color: COLORS.darkGrey,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  bottomNavigation: {
    backgroundColor: COLORS.backgroundLight,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonSpecial: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.white,
  },
  navButtonNormal: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  navButtonActive: {
    backgroundColor: COLORS.white,
  },
});
