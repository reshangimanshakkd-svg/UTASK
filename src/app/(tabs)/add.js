import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Switch,
  Alert,
  Platform,
  Modal,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TaskContext } from '../../../context/TaskContext';
import { COLORS, SPACING } from '../../../constants/theme';
import {
  TODAY_STR,
  TOMORROW_STR,
  formatDateISO,
} from '../../../data/initialTasks';

export default function AddTaskScreen() {
  const { addTask } = useContext(TaskContext);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(false);

  // State for the native Date & Time picker
  const [pickerDate, setPickerDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Handle selecting a date from the native calendar
  function handleDateValueChange(eventOrDate, maybeDate) {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    const selectedDate =
      eventOrDate instanceof Date ? eventOrDate : maybeDate;
    if (selectedDate) {
      setPickerDate(selectedDate);
      setDueDate(formatDateISO(selectedDate));
    }
  }

  // Handle selecting a time from the native clock
  function handleTimeValueChange(eventOrTime, maybeTime) {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    const selectedTime =
      eventOrTime instanceof Date ? eventOrTime : maybeTime;
    if (selectedTime) {
      setPickerDate(selectedTime);
      const hours = String(selectedTime.getHours()).padStart(2, '0');
      const minutes = String(selectedTime.getMinutes()).padStart(2, '0');
      setDueTime(`${hours}:${minutes}`);

      // If no date was chosen yet, default the date to Today
      if (!dueDate) {
        setDueDate(TODAY_STR);
      }
    }
  }

  // Quick-select Today or Tomorrow
  function handleSelectQuickDate(targetDateStr, dayOffset) {
    const dateObj = new Date();
    dateObj.setDate(dateObj.getDate() + dayOffset);
    setPickerDate(dateObj);
    setDueDate(targetDateStr);
  }

  async function handleCreateTask() {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a task title before saving.');
      return;
    }

    await addTask({
      title,
      description,
      notes,
      dueDate,
      dueTime,
      reminderEnabled,
    });

    // Clear all inputs after saving
    setTitle('');
    setDescription('');
    setNotes('');
    setDueDate('');
    setDueTime('');
    setReminderEnabled(false);
    setPickerDate(new Date());

    // Return to the Tasks tab
    router.push('/(tabs)/(tasks)');
  }

  return (
    <View style={styles.container}>
      {/* Single Compact Form Card so the whole screen fits without scrolling */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Task Details</Text>

        <Text style={styles.label}>Task Title *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g., Complete Lecture 05 Tutorial"
          placeholderTextColor={COLORS.textMuted}
        />

        <Text style={styles.label}>Description (Optional)</Text>
        <TextInput
          style={styles.input}
          value={description}
          onChangeText={setDescription}
          placeholder="Brief summary of the task"
          placeholderTextColor={COLORS.textMuted}
        />

        <Text style={styles.label}>Notes (Optional)</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Extra notes or checklist items..."
          placeholderTextColor={COLORS.textMuted}
          multiline
        />

        {/* Smart Scheduling Section */}
        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>Smart Scheduling (Optional)</Text>

        {/* Quick Date Chips */}
        <View style={styles.chipRow}>
          <Pressable
            style={[styles.chip, dueDate === '' && styles.chipActive]}
            onPress={() => {
              setDueDate('');
              setDueTime('');
            }}
          >
            <Text
              style={[styles.chipText, dueDate === '' && styles.chipTextActive]}
            >
              No Date
            </Text>
          </Pressable>

          <Pressable
            style={[styles.chip, dueDate === TODAY_STR && styles.chipActive]}
            onPress={() => handleSelectQuickDate(TODAY_STR, 0)}
          >
            <Text
              style={[
                styles.chipText,
                dueDate === TODAY_STR && styles.chipTextActive,
              ]}
            >
              Today
            </Text>
          </Pressable>

          <Pressable
            style={[styles.chip, dueDate === TOMORROW_STR && styles.chipActive]}
            onPress={() => handleSelectQuickDate(TOMORROW_STR, 1)}
          >
            <Text
              style={[
                styles.chipText,
                dueDate === TOMORROW_STR && styles.chipTextActive,
              ]}
            >
              Tomorrow
            </Text>
          </Pressable>
        </View>

        {/* Aligned Native Date & Time Picker Buttons */}
        <View style={styles.pickerRow}>
          <View style={styles.pickerCol}>
            <Text style={styles.label}>Due Date</Text>
            <Pressable
              style={styles.pickerButton}
              onPress={() => setShowDatePicker(true)}
            >
              <MaterialCommunityIcons
                name="calendar-month-outline"
                size={18}
                color={COLORS.primary}
              />
              <Text
                style={[
                  styles.pickerButtonText,
                  !dueDate && styles.placeholderText,
                ]}
              >
                {dueDate || 'Select Date'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.pickerCol}>
            <Text style={styles.label}>Due Time</Text>
            <Pressable
              style={styles.pickerButton}
              onPress={() => setShowTimePicker(true)}
            >
              <MaterialCommunityIcons
                name="clock-outline"
                size={18}
                color={COLORS.primary}
              />
              <Text
                style={[
                  styles.pickerButtonText,
                  !dueTime && styles.placeholderText,
                ]}
              >
                {dueTime || 'Select Time'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Reminder Notification Switch */}
        <View style={styles.reminderRow}>
          <View style={styles.reminderLeft}>
            <MaterialCommunityIcons
              name="bell-ring-outline"
              size={20}
              color={COLORS.primary}
            />
            <View>
              <Text style={styles.reminderTitle}>Set Reminder Alert</Text>
              <Text style={styles.reminderSub}>
                Notify on save & at due time
              </Text>
            </View>
          </View>
          <Switch
            value={reminderEnabled}
            onValueChange={setReminderEnabled}
            trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
            thumbColor={reminderEnabled ? COLORS.primary : COLORS.textMuted}
          />
        </View>
      </View>

      {/* Bottom Submit Button (Always visible on screen) */}
      <Pressable
        style={({ pressed }) => [
          styles.submitBtn,
          pressed && styles.submitBtnPressed,
        ]}
        onPress={handleCreateTask}
      >
        <MaterialCommunityIcons
          name="plus-circle"
          size={20}
          color={COLORS.surface}
        />
        <Text style={styles.submitBtnText}>Add to UTASK</Text>
      </Pressable>

      {/* Android Native Calendar & Clock Dialogs */}
      {Platform.OS === 'android' && showDatePicker && (
        <DateTimePicker
          value={pickerDate}
          mode="date"
          display="default"
          onValueChange={handleDateValueChange}
          onDismiss={() => setShowDatePicker(false)}
        />
      )}

      {Platform.OS === 'android' && showTimePicker && (
        <DateTimePicker
          value={pickerDate}
          mode="time"
          is24Hour={true}
          display="default"
          onValueChange={handleTimeValueChange}
          onDismiss={() => setShowTimePicker(false)}
        />
      )}

      {/* iOS Picker Modal Wrapper */}
      {Platform.OS === 'ios' && (showDatePicker || showTimePicker) && (
        <Modal transparent animationType="fade">
          <View style={styles.iosModalOverlay}>
            <View style={styles.iosModalCard}>
              <DateTimePicker
                value={pickerDate}
                mode={showDatePicker ? 'date' : 'time'}
                display="spinner"
                onValueChange={
                  showDatePicker
                    ? handleDateValueChange
                    : handleTimeValueChange
                }
              />
              <Pressable
                style={styles.iosDoneBtn}
                onPress={() => {
                  setShowDatePicker(false);
                  setShowTimePicker(false);
                }}
              >
                <Text style={styles.iosDoneText}>Done</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 9,
    paddingHorizontal: 11,
    paddingVertical: 8,
    fontSize: 14,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  notesInput: {
    height: 48,
    textAlignVertical: 'top',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 10,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: COLORS.primary,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    marginTop: 2,
  },
  pickerCol: {
    flex: 1,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 9,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 7,
  },
  pickerButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  placeholderText: {
    fontWeight: '400',
    color: COLORS.textMuted,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  reminderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reminderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  reminderSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  submitBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 13,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  submitBtnPressed: {
    opacity: 0.85,
  },
  submitBtnText: {
    color: COLORS.surface,
    fontSize: 15,
    fontWeight: '700',
  },
  iosModalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  iosModalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: SPACING.md,
  },
  iosDoneBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  iosDoneText: {
    color: COLORS.surface,
    fontWeight: '700',
  },
});