import React, { useContext } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TaskContext } from '../../../context/TaskContext';
import { COLORS, SPACING } from '../../../constants/theme';

export default function OverviewScreen() {
  const {
    tasks,
    currentDateStr,
    lastCheckedTime,
    getSortedTasks,
    sendInstantDemoNotification,
    clearAllTasks,
  } = useContext(TaskContext);

  const todayAndOverdueTasks = getSortedTasks(tasks).filter(
    (t) => !t.completed && t.dueDate !== '' && t.dueDate <= currentDateStr
  );
  const upcomingTasks = getSortedTasks(tasks).filter(
    (t) => !t.completed && t.dueDate !== '' && t.dueDate > currentDateStr
  );
  const completedTasks = tasks.filter((t) => t.completed);

  // Ask the user to confirm before deleting all tasks and reminders
  function handleClearAllData() {
    Alert.alert(
      'Reset App Data',
      'Are you sure you want to delete all tasks and cancel all reminders? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await clearAllTasks();
            Alert.alert('App Reset', 'All tasks and scheduled reminders have been cleared.');
          },
        },
      ]
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Brand Summary Header */}
      <View style={styles.heroCard}>
        <Image
          source={require('../../../assets/images/icon.png')}
          style={styles.heroImage}
          resizeMode="contain"
        />
        <View style={styles.heroTextWrap}>
          <Text style={styles.heroTitle}>UTASK Planner</Text>
          <Text style={styles.heroSubtitle}>
            {currentDateStr} • {tasks.length} total tasks
          </Text>
          <Text style={styles.syncNote}>
            Deadlines auto-checked at {lastCheckedTime}
          </Text>
        </View>
      </View>

      {/* Metrics Grid */}
      <View style={styles.gridRow}>
        <View style={[styles.statCard, { borderLeftColor: COLORS.warning }]}>
          <Text style={styles.statNumber}>{todayAndOverdueTasks.length}</Text>
          <Text style={styles.statLabel}>Due Today / Urgent</Text>
        </View>

        <View style={[styles.statCard, { borderLeftColor: COLORS.secondary }]}>
          <Text style={styles.statNumber}>{upcomingTasks.length}</Text>
          <Text style={styles.statLabel}>Upcoming Tasks</Text>
        </View>

        <View style={[styles.statCard, { borderLeftColor: COLORS.success }]}>
          <Text style={styles.statNumber}>{completedTasks.length}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      {/* Today's Immediate Focus List */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Today's Immediate Focus</Text>
        {todayAndOverdueTasks.length === 0 ? (
          <Text style={styles.emptyNote}>
            No urgent or due-today tasks remaining.
          </Text>
        ) : (
          todayAndOverdueTasks.map((task) => (
            <View key={task.id} style={styles.miniRow}>
              <MaterialCommunityIcons
                name="clock-alert-outline"
                size={18}
                color={
                  task.dueDate < currentDateStr ? COLORS.urgent : COLORS.warning
                }
              />
              <Text style={styles.miniRowTitle} numberOfLines={1}>
                {task.title}
              </Text>
              <Text style={styles.miniRowDate}>{task.dueDate}</Text>
            </View>
          ))
        )}
      </View>

      {/* Upcoming Tasks Preview */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Upcoming Schedule</Text>
        {upcomingTasks.length === 0 ? (
          <Text style={styles.emptyNote}>No upcoming dated tasks.</Text>
        ) : (
          upcomingTasks.map((task) => (
            <View key={task.id} style={styles.miniRow}>
              <MaterialCommunityIcons
                name="calendar-arrow-right"
                size={18}
                color={COLORS.primary}
              />
              <Text style={styles.miniRowTitle} numberOfLines={1}>
                {task.title}
              </Text>
              <Text style={styles.miniRowDate}>{task.dueDate}</Text>
            </View>
          ))
        )}
      </View>

      {/* Instant Notification Trigger Button */}
      <Pressable
        style={({ pressed }) => [
          styles.notifyBtn,
          pressed && styles.btnPressed,
        ]}
        onPress={sendInstantDemoNotification}
      >
        <MaterialCommunityIcons
          name="bell-check-outline"
          size={20}
          color={COLORS.surface}
        />
        <Text style={styles.notifyBtnText}>Send Daily Summary Notification</Text>
      </Pressable>

      {/* Reset / Clear All Data Button */}
      <Pressable
        style={({ pressed }) => [
          styles.resetBtn,
          pressed && styles.btnPressed,
        ]}
        onPress={handleClearAllData}
      >
        <MaterialCommunityIcons
          name="delete-sweep-outline"
          size={20}
          color={COLORS.urgent}
        />
        <Text style={styles.resetBtnText}>Reset App & Clear All Data</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 16,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.md,
  },
  heroImage: {
    width: 52,
    height: 52,
    borderRadius: 12,
  },
  heroTextWrap: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  heroSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  syncNote: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 3,
  },
  gridRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: 16,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  emptyNote: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  miniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceAlt,
    gap: 8,
  },
  miniRowTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  miniRowDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  notifyBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.secondary,
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  btnPressed: {
    opacity: 0.85,
  },
  notifyBtnText: {
    color: COLORS.surface,
    fontSize: 15,
    fontWeight: '700',
  },
  resetBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.urgentLight,
    borderWidth: 1,
    borderColor: COLORS.urgent,
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: SPACING.sm,
  },
  resetBtnText: {
    color: COLORS.urgent,
    fontSize: 15,
    fontWeight: '700',
  },
});