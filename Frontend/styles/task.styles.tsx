// styles/task.styles.tsx
import { StyleSheet } from 'react-native';
import { COLORS } from '../constants/themes';
import { Colors } from '../constants/colors';

export const taskStyles = StyleSheet.create({
  // Container Styles
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  
  content: {
    flex: 1,
  },
  
  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.background,
  },
  
  backButton: {
    padding: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.darkGrey,
  },
  
  menuButton: {
    padding: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  notificationButton: {
    padding: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.secondary,
  },
  
  // Date Selector Styles
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    gap: 6,
    overflow: 'hidden',
  },
  
  dateNavButton: {
    width: 36,
    height: 36,
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  
  dateScrollContent: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 2,
  },
  
  dateItem: {
    minWidth: 68,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: COLORS.lightGrey,
  },
  
  dateItemSelected: {
    backgroundColor: COLORS.purple,
  },
  
  dateDay: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.darkGrey,
    marginTop: 4,
  },
  
  dateDaySelected: {
    color: COLORS.white,
  },
  
  dateWeekday: {
    fontSize: 12,
    color: COLORS.darkGrey,
    opacity: 0.7,
  },
  
  dateTextSelected: {
    color: COLORS.white,
    opacity: 1,
  },
  
  // Filter Tabs Styles
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGrey,
  },
  
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  
  tabActive: {
    borderBottomColor: COLORS.purple,
  },
  
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.darkGrey,
    opacity: 0.6,
  },
  
  tabTextActive: {
    color: COLORS.purple,
    opacity: 1,
    fontWeight: '600',
  },
  
  // Task List Styles
  taskList: {
    padding: 20,
    backgroundColor: COLORS.background,
  },
  
  // Shopping List Item Styles
  shoppingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  
  checkboxContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.grey,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  checkboxChecked: {
    backgroundColor: COLORS.purple,
    borderColor: COLORS.purple,
  },
  
  itemContent: {
    flex: 1,
    gap: 6,
  },
  
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGrey,
  },
  
  itemNameCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
    color: COLORS.grey,
  },
  
  itemQuantity: {
    fontSize: 13,
    color: COLORS.darkGrey,
    opacity: 0.7,
  },
  
  assignedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  
  avatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.purple,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  assignedText: {
    fontSize: 13,
    color: COLORS.darkGrey,
    opacity: 0.9,
  },
  
  assignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: COLORS.purple,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  
  assignButtonText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: '500',
  },
  
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  quantityButtonText: {
    fontSize: 18,
    color: COLORS.purple,
    fontWeight: '600',
  },
  
  quantityValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGrey,
    minWidth: 20,
    textAlign: 'center',
  },
  
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  
  emptyStateText: {
    fontSize: 14,
    color: COLORS.darkGrey,
    opacity: 0.6,
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Task Card Styles
  taskCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  taskProject: {
    fontSize: 12,
    color: Colors.textLight,
    flex: 1,
  },
  
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 12,
  },
  
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  
  timeText: {
    fontSize: 13,
    color: Colors.primary,
    marginLeft: 4,
  },
  
  // Status Badge Styles
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  
  statusDone: {
    backgroundColor: Colors.done,
  },
  
  statusDoneText: {
    color: Colors.doneText,
  },
  
  statusInProgress: {
    backgroundColor: Colors.inProgress,
  },
  
  statusInProgressText: {
    color: Colors.inProgressText,
  },
  
  statusTodo: {
    backgroundColor: Colors.todo,
  },
  
  statusTodoText: {
    color: Colors.todoText,
  },
  
  // Category Icon Background Styles
  categoryIconShopping: {
    backgroundColor: Colors.shoppingBg,
  },
  
  categoryIconDesign: {
    backgroundColor: Colors.designBg,
  },
  
  categoryIconSprint: {
    backgroundColor: Colors.sprintBg,
  },
  
  categoryIconDefault: {
    backgroundColor: Colors.defaultBg,
  },
});