import React, { createContext, useState, useEffect, useRef } from 'react';
import { AppState, Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as SQLite from 'expo-sqlite';
import { INITIAL_TASKS, TODAY_STR, formatDateISO } from '../data/initialTasks';

// Helper to get current 'HH:MM' in 24-hour format
function getCurrentTimeHHMM() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Create a shared box (Context) so all screens can read and update tasks
export const TaskContext = createContext();

export function TaskProvider({ children }) {
  // Store the task list in memory so all screens update right away
  const [tasks, setTasks] = useState(INITIAL_TASKS);

  // Track live date and time so overdue tasks update automatically on resume
  const [currentDateStr, setCurrentDateStr] = useState(TODAY_STR);
  const [currentTimeStr, setCurrentTimeStr] = useState(getCurrentTimeHHMM());
  const [lastCheckedTime, setLastCheckedTime] = useState(
    new Date().toLocaleTimeString()
  );

  // Controls the user-friendly "Welcome Back" banner when reopening the app
  const [welcomeBannerVisible, setWelcomeBannerVisible] = useState(false);

  // Remember the previous app state and the SQLite database connection
  const appStateRef = useRef(AppState.currentState);
  const dbRef = useRef(null);

  // 1. Set up the SQLite database when the app first starts
  useEffect(() => {
    async function initDatabase() {
      if (Platform.OS === 'web') return;

      try {
        const db = await SQLite.openDatabaseAsync('utask.db');
        dbRef.current = db;

        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            notes TEXT,
            dueDate TEXT,
            dueTime TEXT,
            reminderEnabled INTEGER DEFAULT 0,
            completed INTEGER DEFAULT 0,
            createdAt TEXT
          );
        `);

        const countResult = await db.getFirstAsync(
          'SELECT COUNT(*) AS count FROM tasks;'
        );

        if (countResult && countResult.count === 0) {
          for (const task of INITIAL_TASKS) {
            await db.runAsync(
              `INSERT INTO tasks (id, title, description, notes, dueDate, dueTime, reminderEnabled, completed, createdAt)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
              [
                task.id,
                task.title,
                task.description || '',
                task.notes || '',
                task.dueDate || '',
                task.dueTime || '',
                task.reminderEnabled ? 1 : 0,
                task.completed ? 1 : 0,
                task.createdAt || TODAY_STR,
              ]
            );
          }
          setTasks(INITIAL_TASKS);
        } else {
          const savedRows = await db.getAllAsync('SELECT * FROM tasks;');
          const formattedTasks = savedRows.map((row) => ({
            ...row,
            reminderEnabled: Boolean(row.reminderEnabled),
            completed: Boolean(row.completed),
          }));
          setTasks(formattedTasks);
        }
      } catch (error) {
        console.log('SQLite initialization error:', error);
      }
    }

    initDatabase();
  }, []);

  // 2. Ask the user for permission to show notifications when the app opens
  useEffect(() => {
    async function requestPermissions() {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Notifications Disabled',
          'Enable notifications in device settings to receive task reminders.'
        );
      }
    }
    requestPermissions();
  }, []);

  // 3. Refresh deadlines and show a Welcome Back summary when returning to the app
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        setCurrentDateStr(formatDateISO(new Date()));
        setCurrentTimeStr(getCurrentTimeHHMM());
        setLastCheckedTime(new Date().toLocaleTimeString());
        setWelcomeBannerVisible(true);
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  function dismissWelcomeBanner() {
    setWelcomeBannerVisible(false);
  }

  // Send a notification right away, and schedule a future alarm if date and time are set
  async function triggerTaskNotification(title, dueDate, dueTime) {
    try {
      await Notifications.requestPermissionsAsync();

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'UTASK Reminder Active',
          body: dueDate
            ? `"${title}" scheduled for ${dueDate}${dueTime ? ` at ${dueTime}` : ''}.`
            : `Reminder enabled for "${title}".`,
          sound: true,
        },
        trigger: null,
      });

      if (dueDate && dueTime) {
        const target = new Date(`${dueDate}T${dueTime}:00`);
        const diffSeconds = Math.floor((target.getTime() - Date.now()) / 1000);

        if (!isNaN(diffSeconds) && diffSeconds > 5) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Due Task Reminder - UTASK',
              body: `It is time for: ${title}`,
              sound: true,
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
              seconds: diffSeconds,
              repeats: false,
            },
          });
        }
      }
    } catch (error) {
      console.log('Notification scheduling notice:', error);
    }
  }

  // Send a quick summary notification when the user taps the test button
  async function sendInstantDemoNotification() {
    const dueCount = tasks.filter(
      (t) => !t.completed && t.dueDate && t.dueDate <= currentDateStr
    ).length;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'UTASK Daily Check-In',
        body:
          dueCount > 0
            ? `You have ${dueCount} task(s) due today or overdue.`
            : 'All scheduled tasks for today are on track!',
        sound: true,
      },
      trigger: null,
    });
  }

  // Add a new task to the screen and save it permanently in SQLite
  async function addTask({
    title,
    description,
    notes,
    dueDate,
    dueTime,
    reminderEnabled,
  }) {
    const newTask = {
      id: `task-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      notes: notes.trim(),
      dueDate: dueDate.trim(),
      dueTime: dueTime.trim(),
      reminderEnabled: Boolean(reminderEnabled),
      completed: false,
      createdAt: currentDateStr,
    };

    setTasks((prev) => [newTask, ...prev]);

    if (dbRef.current) {
      try {
        await dbRef.current.runAsync(
          `INSERT INTO tasks (id, title, description, notes, dueDate, dueTime, reminderEnabled, completed, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            newTask.id,
            newTask.title,
            newTask.description,
            newTask.notes,
            newTask.dueDate,
            newTask.dueTime,
            newTask.reminderEnabled ? 1 : 0,
            0,
            newTask.createdAt,
          ]
        );
      } catch (error) {
        console.log('SQLite insert error:', error);
      }
    }

    if (reminderEnabled) {
      await triggerTaskNotification(newTask.title, newTask.dueDate, newTask.dueTime);
    }
  }

  // Save edited task details to both the screen and SQLite
  async function updateTask(id, updatedFields) {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, ...updatedFields } : task))
    );

    if (dbRef.current) {
      try {
        await dbRef.current.runAsync(
          `UPDATE tasks
           SET title = ?, description = ?, notes = ?, dueDate = ?, dueTime = ?, reminderEnabled = ?
           WHERE id = ?;`,
          [
            updatedFields.title,
            updatedFields.description || '',
            updatedFields.notes || '',
            updatedFields.dueDate || '',
            updatedFields.dueTime || '',
            updatedFields.reminderEnabled ? 1 : 0,
            id,
          ]
        );
      } catch (error) {
        console.log('SQLite update error:', error);
      }
    }

    if (updatedFields.reminderEnabled) {
      await triggerTaskNotification(
        updatedFields.title,
        updatedFields.dueDate,
        updatedFields.dueTime
      );
    }
  }

  // Mark a task as done or not done in both the screen and SQLite
  async function toggleTaskCompletion(id) {
    const targetTask = tasks.find((task) => task.id === id);
    if (!targetTask) return;

    const nextCompleted = !targetTask.completed;

    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: nextCompleted } : task
      )
    );

    if (dbRef.current) {
      try {
        await dbRef.current.runAsync(
          'UPDATE tasks SET completed = ? WHERE id = ?;',
          [nextCompleted ? 1 : 0, id]
        );
      } catch (error) {
        console.log('SQLite toggle error:', error);
      }
    }
  }

  // Remove a task from both the screen and SQLite
  async function deleteTask(id) {
    setTasks((prev) => prev.filter((task) => task.id !== id));

    if (dbRef.current) {
      try {
        await dbRef.current.runAsync('DELETE FROM tasks WHERE id = ?;', [id]);
      } catch (error) {
        console.log('SQLite delete error:', error);
      }
    }
  }

  // Clear all tasks from the screen, SQLite database, and scheduled reminders
  async function clearAllTasks() {
    setTasks([]);

    if (dbRef.current) {
      try {
        await dbRef.current.runAsync('DELETE FROM tasks;');
      } catch (error) {
        console.log('SQLite clear all error:', error);
      }
    }

    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.log('Notification cancel error:', error);
    }
  }

  // Sort tasks so unfinished and urgent tasks appear at the top of the list
  function getSortedTasks(taskList = tasks) {
    return [...taskList].sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;
      if (!a.dueDate && !b.dueDate) return 0;

      if (a.dueDate !== b.dueDate) {
        return a.dueDate.localeCompare(b.dueDate);
      }
      const timeA = a.dueTime || '23:59';
      const timeB = b.dueTime || '23:59';
      return timeA.localeCompare(timeB);
    });
  }

  return (
    <TaskContext.Provider
      value={{
        tasks,
        currentDateStr,
        currentTimeStr,
        lastCheckedTime,
        welcomeBannerVisible,
        dismissWelcomeBanner,
        addTask,
        updateTask,
        toggleTaskCompletion,
        deleteTask,
        clearAllTasks,
        getSortedTasks,
        sendInstantDemoNotification,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}