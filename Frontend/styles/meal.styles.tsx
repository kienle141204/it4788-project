import { StyleSheet } from 'react-native';
import { COLORS } from '../constants/themes';

export const mealStyles = StyleSheet.create({
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 32,
    gap: 16,
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
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FBE9E7',
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.orange,
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
  menuCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    gap: 12,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuInfo: {
    flex: 1,
    marginRight: 12,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGrey,
    marginBottom: 4,
  },
  menuMeta: {
    fontSize: 13,
    color: COLORS.grey,
  },
  menuDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  menuDateText: {
    fontSize: 13,
    color: COLORS.grey,
  },
  menuDescription: {
    fontSize: 14,
    color: COLORS.darkGrey,
    lineHeight: 20,
  },
  dishList: {
    gap: 12,
  },
  dishCard: {
    flexDirection: 'row',
    backgroundColor: '#F4FBF6',
    borderRadius: 16,
    padding: 10,
    gap: 12,
    alignItems: 'center',
  },
  dishImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#D1FAE5',
  },
  dishContent: {
    flex: 1,
    gap: 4,
  },
  dishName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.darkGrey,
  },
  dishMeta: {
    fontSize: 13,
    color: COLORS.grey,
  },
  dishPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.purple,
  },
  sectionLabel: {
    fontSize: 13,
    color: COLORS.grey,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  paginationLoader: {
    marginTop: 16,
    alignItems: 'center',
  },
  loadMoreButton: {
    marginTop: 8,
    alignSelf: 'center',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: COLORS.purple,
  },
  loadMoreButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
  },
  filterBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGrey,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterButtonText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.darkGrey,
    fontWeight: '500',
  },
  clearFilterButton: {
    padding: 2,
  },
  datePickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  datePickerModalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.darkGrey,
  },
  datePickerCloseButton: {
    padding: 4,
  },
  datePickerActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  datePickerActionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  datePickerCancelButton: {
    backgroundColor: COLORS.lightGrey,
  },
  datePickerCancelText: {
    fontSize: 16,
    color: COLORS.darkGrey,
    fontWeight: '500',
  },
  datePickerConfirmButton: {
    backgroundColor: COLORS.purple,
  },
  datePickerConfirmText: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: '600',
  },
  quickDateOptions: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  quickDateOptionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGrey,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickDateOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F4FBF6',
    gap: 12,
  },
  quickDateOptionText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.darkGrey,
    fontWeight: '500',
  },
  quickDateOptionDate: {
    fontSize: 13,
    color: COLORS.grey,
  },
  calendarContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  calendarNavButton: {
    padding: 8,
    borderRadius: 8,
  },
  calendarNavButtonDisabled: {
    opacity: 0.3,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.darkGrey,
    textAlign: 'center',
    textTransform: 'capitalize',
    flex: 1,
  },
  calendarWeekDays: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  calendarWeekDay: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  calendarWeekDayText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.grey,
  },
  calendarDays: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  calendarDaySelected: {
    backgroundColor: COLORS.purple,
    borderRadius: 20,
  },
  calendarDayToday: {
    backgroundColor: '#4ADE8066',
    borderRadius: 20,
  },
  calendarDayText: {
    fontSize: 14,
    color: COLORS.darkGrey,
  },
  calendarDayTextSelected: {
    color: COLORS.white,
    fontWeight: '600',
  },
  calendarDayTextToday: {
    color: COLORS.purple,
    fontWeight: '600',
  },
  // Date Carousel Styles
  dateCarouselContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 16,
    gap: 8,
    backgroundColor: COLORS.white,
  },
  dateNavButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateCarousel: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 4,
  },
  dateItem: {
    minWidth: 70,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: COLORS.lightGrey,
  },
  dateItemActive: {
    backgroundColor: COLORS.purple,
  },
  dateWeekday: {
    fontSize: 12,
    color: COLORS.darkGrey,
    opacity: 0.7,
  },
  dateWeekdayActive: {
    color: COLORS.white,
    opacity: 1,
  },
  dateDay: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.darkGrey,
    marginTop: 4,
  },
  dateDayActive: {
    color: COLORS.white,
  },
});


