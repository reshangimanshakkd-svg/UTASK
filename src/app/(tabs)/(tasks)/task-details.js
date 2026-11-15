import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Switch,
  Modal,
  Alert,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TaskContext } from '../../../../context/TaskContext';
import { COLORS, SPACING } from '../../../../constants/theme';

export default function TaskDetailsScreen() {
  const { taskId } = useLocalSearchParams();
  const {
    tasks,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
  } = useContext(TaskContext);

  const task = tasks.find((item) => item.id === taskId);

  const [isEditing, setIsEditing] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const [title, setTitle] = useState(task ? task.title : '');
  const [description, setDescription] = useState(task ? task.description : '');
  const [notes, setNotes] = useState(task ? task.notes : '');
  const [dueDate, setDueDate] = useState(task ? task.dueDate : '');
  const [dueTime, setDueTime] = useState(task ? task.dueTime : '');
  const [reminderEnabled, setReminderEnabled] = useState(
    task ? task.reminderEnabled : false
  );

  if (!task) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFoundText}>Task not found.</Text>
        <Pressable style={styles.primaryBtn} onPress={() => router.back()}>
          <Text style={styles.primaryBtnText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  async function handleSaveEdits() {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Task title cannot be empty.');
      return;
    }

    await updateTask(task.id, {
      title: title.trim(),
      description: description.trim(),
      notes: notes.trim(),
      dueDate: dueDate.trim(),
      dueTime: dueTime.trim(),
      reminderEnabled,
    });

    setIsEditing(false);
    Alert.alert('Saved', 'Task details updated successfully.');
  }

  function handleConfirmDelete() {
    setDeleteModalVisible(false);
    deleteTask(task.id);
    router.back();
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Completion Status Banner */}
      <Pressable
        style={[
          styles.statusBanner,
          task.completed ? styles.statusCompleted : styles.statusPending,
        ]}
        onPress={() => toggleTaskCompletion(task.id)}
      >
        <MaterialCommunityIcons
          name={
            task.completed
              ? 'checkbox-marked-circle'
              : 'checkbox-blank-circle-outline'
          }
          size={24}
          color={task.completed ? COLORS.success : COLORS.warning}
        />
        <Text
          style={[
            styles.statusBannerText,
            { color: task.completed ? COLORS.success : COLORS.warning },
          ]}
        >
          {task.completed
            ? 'Completed (Tap to mark incomplete)'
            : 'In Progress (Tap to mark completed)'}
        </Text>
      </Pressable>

      {!isEditing ? (
        /* READ-ONLY DETAILS VIEW */
        <View style={styles.card}>
          <Text style={styles.label}>TASK TITLE</Text>
          <Text style={styles.titleText}>{task.title}</Text>

          <Text style={styles.label}>DESCRIPTION</Text>
          <Text style={styles.bodyText}>
            {task.description || 'No description provided.'}
          </Text>

          <Text style={styles.label}>NOTES</Text>
          <View style={styles.notesBox}>
            <Text style={styles.notesText}>
              {task.notes || 'No additional notes added.'}
            </Text>
          </View>

          <View style={styles.scheduleRow}>
            <View style={styles.scheduleItem}>
              <Text style={styles.label}>DUE DATE</Text>
              <Text style={styles.valueText}>
                {task.dueDate || 'Optional (Not set)'}
              </Text>
            </View>
            <View style={styles.scheduleItem}>
              <Text style={styles.label}>DUE TIME</Text>
              <Text style={styles.valueText}>
                {task.dueTime || 'Optional (Not set)'}
              </Text>
            </View>
          </View>

          <Text style={styles.label}>NOTIFICATION REMINDER</Text>
          <Text style={styles.valueText}>
            {task.reminderEnabled ? 'Enabled' : 'Off'}
          </Text>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <Pressable
              style={[styles.primaryBtn, styles.flexBtn]}
              onPress={() => setIsEditing(true)}
            >
              <MaterialCommunityIcons
                name="pencil-outline"
                size={18}
                color={COLORS.surface}
              />
              <Text style={styles.primaryBtnText}>Edit Task</Text>
            </Pressable>

            <Pressable
              style={[styles.dangerBtn, styles.flexBtn]}
              onPress={() => setDeleteModalVisible(true)}
            >
              <MaterialCommunityIcons
                name="trash-can-outline"
                size={18}
                color={COLORS.urgent}
              />
              <Text style={styles.dangerBtnText}>Delete</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        /* EDIT MODE FORM */
        <View style={styles.card}>
          <Text style={styles.formHeader}>Edit Task</Text>

          <Text style={styles.inputLabel}>Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Task title"
          />

          <Text style={styles.inputLabel}>Description</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="Short summary"
          />

          <Text style={styles.inputLabel}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Detailed notes..."
            multiline
          />

          <View style={styles.scheduleRow}>
            <View style={styles.scheduleItem}>
              <Text style={styles.inputLabel}>Due Date (Optional)</Text>
              <TextInput
                style={styles.input}
                value={dueDate}
                onChangeText={setDueDate}
                placeholder="YYYY-MM-DD"
              />
            </View>
            <View style={styles.scheduleItem}>
              <Text style={styles.inputLabel}>Due Time (Optional)</Text>
              <TextInput
                style={styles.input}
                value={dueTime}
                onChangeText={setDueTime}
                placeholder="HH:MM"
              />
            </View>
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.inputLabel}>Reminder Notification</Text>
            <Switch
              value={reminderEnabled}
              onValueChange={setReminderEnabled}
              trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
              thumbColor={reminderEnabled ? COLORS.primary : COLORS.textMuted}
            />
          </View>

          <View style={styles.actionRow}>
            <Pressable
              style={[styles.secondaryBtn, styles.flexBtn]}
              onPress={() => setIsEditing(false)}
            >
              <Text style={styles.secondaryBtnText}>Cancel</Text>
            </Pressable>

            <Pressable
              style={[styles.primaryBtn, styles.flexBtn]}
              onPress={handleSaveEdits}
            >
              <Text style={styles.primaryBtnText}>Save Changes</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Confirm Delete Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Delete Task?</Text>
            <Text style={styles.modalBody}>
              Are you sure you want to remove "{task.title}"? This action cannot be undone.
            </Text>

            <View style={styles.actionRow}>
              <Pressable
                style={[styles.secondaryBtn, styles.flexBtn]}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={styles.secondaryBtnText}>Keep Task</Text>
              </Pressable>

              <Pressable
                style={[styles.confirmDeleteBtn, styles.flexBtn]}
                onPress={handleConfirmDelete}
              >
                <Text style={styles.primaryBtnText}>Yes, Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  notFoundText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.md,
    gap: 10,
  },
  statusCompleted: {
    backgroundColor: COLORS.successLight,
  },
  statusPending: {
    backgroundColor: COLORS.warningLight,
  },
  statusBannerText: {
    fontSize: 14,
    fontWeight: '700',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.6,
    marginTop: SPACING.md,
    marginBottom: 4,
  },
  titleText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  bodyText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  notesBox: {
    backgroundColor: COLORS.surfaceAlt,
    padding: SPACING.md,
    borderRadius: 10,
  },
  notesText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  scheduleRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  scheduleItem: {
    flex: 1,
  },
  valueText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  formHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    marginBottom: 4,
  },
  input: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  flexBtn: {
    flex: 1,
  },
  primaryBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  primaryBtnText: {
    color: COLORS.surface,
    fontWeight: '700',
    fontSize: 14,
  },
  secondaryBtn: {
    backgroundColor: COLORS.surfaceAlt,
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: COLORS.textPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
  dangerBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.urgentLight,
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dangerBtnText: {
    color: COLORS.urgent,
    fontWeight: '700',
    fontSize: 14,
  },
  confirmDeleteBtn: {
    backgroundColor: COLORS.urgent,
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
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
  modalBody: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    lineHeight: 20,
  },
});