import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  FlatList,
  Modal,
  TextInput,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TaskContext } from '../../../../context/TaskContext';
import { COLORS, SPACING } from '../../../../constants/theme';
import { TODAY_STR, TOMORROW_STR } from '../../../../data/initialTasks';

export default function TaskListScreen() {
  const {
    tasks,
    currentDateStr,
    currentTimeStr,
    welcomeBannerVisible,
    dismissWelcomeBanner,
    toggleTaskCompletion,
    getSortedTasks,
  } = useContext(TaskContext);

  const [filterMode, setFilterMode] = useState('ALL');
  const [customDate, setCustomDate] = useState(TODAY_STR);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Count incomplete tasks due today or overdue for the Welcome Back summary
  const urgentTaskCount = tasks.filter(
    (t) => !t.completed && t.dueDate !== '' && t.dueDate <= currentDateStr
  ).length;

  // Filter tasks based on selected date filter
  const filteredTasks = getSortedTasks(tasks).filter((task) => {
    if (filterMode === 'TODAY') {
      return task.dueDate !== '' && task.dueDate <= currentDateStr;
    }
    if (filterMode === 'UPCOMING') {
      return task.dueDate !== '' && task.dueDate > currentDateStr;
    }
    if (filterMode === 'NO_DATE') {
      return task.dueDate === '';
    }
    if (filterMode === 'CUSTOM') {
      return task.dueDate === customDate.trim();
    }
    return true;
  });

  // Determine urgency badge styling and label (including live time check)
  function getTaskBadge(task) {
    if (task.completed) {
      return {
        label: 'Completed',
        bg: COLORS.successLight,
        color: COLORS.success,
      };
    }
    if (!task.dueDate) {
      return {
        label: 'Flexible',
        bg: COLORS.surfaceAlt,
        color: COLORS.textSecondary,
      };
    }

    const isPastDate = task.dueDate < currentDateStr;
    const isPastTimeToday =
      task.dueDate === currentDateStr &&
      task.dueTime !== '' &&
      task.dueTime < currentTimeStr;

    if (isPastDate || isPastTimeToday) {
      return {
        label: `Overdue • ${task.dueDate}${task.dueTime ? ` ${task.dueTime}` : ''}`,
        bg: COLORS.urgentLight,
        color: COLORS.urgent,
      };
    }
    if (task.dueDate === currentDateStr) {
      return {
        label: `Due Today${task.dueTime ? ` • ${task.dueTime}` : ''}`,
        bg: COLORS.warningLight,
        color: COLORS.warning,
      };
    }
    return {
      label: `${task.dueDate}${task.dueTime ? ` • ${task.dueTime}` : ''}`,
      bg: COLORS.primaryLight,
      color: COLORS.primary,
    };
  }

  function getActiveFilterLabel() {
    if (filterMode === 'TODAY') return 'Immediate & Today';
    if (filterMode === 'UPCOMING') return 'Upcoming Dates';
    if (filterMode === 'NO_DATE') return 'No Due Date';
    if (filterMode === 'CUSTOM') return `Date: ${customDate}`;
    return 'All Tasks';
  }

  const renderTaskItem = ({ item }) => {
    const badge = getTaskBadge(item);

    return (
      <Pressable
        style={({ pressed }) => [
          styles.taskCard,
          item.completed && styles.taskCardCompleted,
          pressed && styles.cardPressed,
        ]}
        onPress={() =>
          router.push({
            pathname: '/(tabs)/(tasks)/task-details',
            params: { taskId: item.id },
          })
        }
      >
        {/* Checkbox Toggle Button */}
        <Pressable
          style={styles.checkboxHitArea}
          onPress={() => toggleTaskCompletion(item.id)}
        >
          <MaterialCommunityIcons
            name={
              item.completed
                ? 'checkbox-marked-circle'
                : 'checkbox-blank-circle-outline'
            }
            size={26}
            color={item.completed ? COLORS.success : COLORS.primary}
          />
        </Pressable>

        {/* Task Content */}
        <View style={styles.taskBody}>
          <Text
            style={[
              styles.taskTitle,
              item.completed && styles.taskTitleCompleted,
            ]}
            numberOfLines={1}
          >
            {item.title}
          </Text>

          {item.description ? (
            <Text style={styles.taskDescription} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}

          <View style={styles.metaRow}>
            <View style={[styles.badge, { backgroundColor: badge.bg }]}>
              <Text style={[styles.badgeText, { color: badge.color }]}>
                {badge.label}
              </Text>
            </View>

            {item.reminderEnabled && !item.completed ? (
              <View style={styles.reminderTag}>
                <MaterialCommunityIcons
                  name="bell-ring-outline"
                  size={13}
                  color={COLORS.secondary}
                />
                <Text style={styles.reminderTagText}>Alert On</Text>
              </View>
            ) : null}
          </View>
        </View>

        <MaterialCommunityIcons
          name="chevron-right"
          size={22}
          color={COLORS.textMuted}
        />
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top App Banner */}
      <View style={styles.headerBanner}>
        <View style={styles.headerLeft}>
          <Image
            source={require('../../../../assets/images/icon.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.greetingTitle}>Smart Schedule</Text>
            <Text style={styles.syncSubtitle}>
              {currentDateStr} • {tasks.filter((t) => !t.completed).length} active tasks
            </Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.filterButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => setFilterModalVisible(true)}
        >
          <MaterialCommunityIcons
            name="calendar-filter"
            size={18}
            color={COLORS.surface}
          />
          <Text style={styles.filterButtonText}>Filter</Text>
        </Pressable>
      </View>

      {/* User-Friendly Welcome Back Card (Triggered by AppState when returning to app) */}
      {welcomeBannerVisible ? (
        <View style={styles.welcomeCard}>
          <MaterialCommunityIcons
            name="calendar-check"
            size={20}
            color={COLORS.primary}
          />
          <View style={styles.welcomeTextWrap}>
            <Text style={styles.welcomeTitle}>Welcome back! Schedule refreshed</Text>
            <Text style={styles.welcomeSub}>
              {urgentTaskCount > 0
                ? `You have ${urgentTaskCount} task(s) due today or overdue.`
                : 'You are all caught up on urgent tasks!'}
            </Text>
          </View>
          <Pressable
            style={styles.welcomeCloseBtn}
            onPress={dismissWelcomeBanner}
          >
            <MaterialCommunityIcons
              name="close"
              size={18}
              color={COLORS.textSecondary}
            />
          </Pressable>
        </View>
      ) : null}

      {/* Active Filter Status Bar */}
      <View style={styles.filterStatusBar}>
        <Text style={styles.filterStatusText}>
          Showing: <Text style={styles.filterBold}>{getActiveFilterLabel()}</Text> ({filteredTasks.length})
        </Text>
        {filterMode !== 'ALL' ? (
          <Pressable onPress={() => setFilterMode('ALL')}>
            <Text style={styles.resetFilterText}>Reset</Text>
          </Pressable>
        ) : null}
      </View>

      {/* Task FlatList */}
      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        renderItem={renderTaskItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <MaterialCommunityIcons
              name="calendar-check-outline"
              size={48}
              color={COLORS.textMuted}
            />
            <Text style={styles.emptyTitle}>No tasks for this filter</Text>
            <Text style={styles.emptySubtitle}>
              Switch your date filter or tap "Add Task" below to schedule a new task.
            </Text>
          </View>
        }
      />

      {/* Date Filter Modal */}
      <Modal
        visible={filterModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Filter Tasks by Date</Text>
            <Text style={styles.modalSubtitle}>
              Immediately due and overdue tasks always appear first.
            </Text>

            {[
              { key: 'ALL', label: 'All Tasks (Sorted by Urgency)' },
              { key: 'TODAY', label: `Immediately Due & Today (${currentDateStr})` },
              { key: 'UPCOMING', label: 'Upcoming Tasks' },
              { key: 'NO_DATE', label: 'No Due Date (Flexible)' },
            ].map((option) => (
              <Pressable
                key={option.key}
                style={[
                  styles.modalOption,
                  filterMode === option.key && styles.modalOptionActive,
                ]}
                onPress={() => {
                  setFilterMode(option.key);
                  setFilterModalVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    filterMode === option.key && styles.modalOptionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}

            <Text style={styles.customDateLabel}>Or filter by exact date (YYYY-MM-DD):</Text>
            <View style={styles.customDateRow}>
              <TextInput
                style={styles.customDateInput}
                value={customDate}
                onChangeText={setCustomDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={COLORS.textMuted}
              />
              <Pressable
                style={styles.applyDateBtn}
                onPress={() => {
                  setFilterMode('CUSTOM');
                  setFilterModalVisible(false);
                }}
              >
                <Text style={styles.applyDateBtnText}>Apply</Text>
              </Pressable>
            </View>

            <View style={styles.quickPickRow}>
              <Pressable
                style={styles.quickChip}
                onPress={() => setCustomDate(TODAY_STR)}
              >
                <Text style={styles.quickChipText}>Today</Text>
              </Pressable>
              <Pressable
                style={styles.quickChip}
                onPress={() => setCustomDate(TOMORROW_STR)}
              >
                <Text style={styles.quickChipText}>Tomorrow</Text>
              </Pressable>
            </View>

            <Pressable
              style={styles.modalCloseBtn}
              onPress={() => setFilterModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  logoImage: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  greetingTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  syncSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6,
  },
  filterButtonText: {
    color: COLORS.surface,
    fontWeight: '600',
    fontSize: 14,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  welcomeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    gap: 10,
  },
  welcomeTextWrap: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  welcomeSub: {
    fontSize: 12,
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  welcomeCloseBtn: {
    padding: 4,
  },
  filterStatusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  filterStatusText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  filterBold: {
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  resetFilterText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 14,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  taskCardCompleted: {
    opacity: 0.72,
    backgroundColor: '#F8FAFC',
  },
  cardPressed: {
    opacity: 0.85,
  },
  checkboxHitArea: {
    paddingRight: SPACING.sm,
  },
  taskBody: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: COLORS.textMuted,
  },
  taskDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  reminderTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  reminderTagText: {
    fontSize: 11,
    color: COLORS.secondary,
    fontWeight: '600',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: SPACING.lg,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  modalSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginBottom: SPACING.md,
  },
  modalOption: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceAlt,
    marginBottom: 8,
  },
  modalOptionActive: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  modalOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  modalOptionTextActive: {
    color: COLORS.primary,
  },
  customDateLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    marginBottom: 6,
  },
  customDateRow: {
    flexDirection: 'row',
    gap: 8,
  },
  customDateInput: {
    flex: 1,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  applyDateBtn: {
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  applyDateBtnText: {
    color: COLORS.surface,
    fontWeight: '700',
    fontSize: 14,
  },
  quickPickRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  quickChip: {
    backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  quickChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  modalCloseBtn: {
    marginTop: SPACING.md,
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
});