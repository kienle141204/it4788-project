// styles/task.styles.tsx
import { StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

export const taskStyles = StyleSheet.create({
  // Container Styles
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  
  backButton: {
    padding: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.black,
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
    backgroundColor: Colors.secondary,
  },
  
  // Date Selector Styles
  dateContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: Colors.white,
    gap: 12,
  },
  
  dateItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: Colors.backgroundLight,
  },
  
  dateItemSelected: {
    backgroundColor: Colors.primary,
  },
  
  dateMonth: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  
  dateDay: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 4,
  },
  
  dateDaySelected: {
    color: Colors.white,
  },
  
  dateWeekday: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  
  dateTextSelected: {
    color: Colors.white,
  },
  
  // Filter Tabs Styles
  tabContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    gap: 12,
  },
  
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.backgroundLight,
  },
  
  tabActive: {
    backgroundColor: Colors.primary,
  },
  
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  
  tabTextActive: {
    color: Colors.white,
  },
  
  // Task List Styles
  taskList: {
    padding: 20,
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