import React, { createContext, useState, useEffect, useRef } from 'react';
import { AppState, Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as SQLite from 'expo-sqlite';
import { INITIAL_TASKS, TODAY_STR } from './initialTasks';

// Create a shared box (Context) so all screens can read and update tasks
export const TaskContext = createContext();

export function TaskProvider({ children }) {
  // Store the task list in memory so all screens update right away
  const [tasks, setTasks] = useState(INITIAL_TASKS);

  // Track if the app is open on screen ('active') or minimized ('background')
  const [appStateStatus, setAppStateStatus] = useState(AppState.currentState);

  // Save the time when the user last returned to the app
  const [lastForegroundSync, setLastForegroundSync] = useState(
    new Date().toLocaleTimeString()
  );

  // Count how many times the user came back to the app from the background
  const [foregroundCount, setForegroundCount] = useState(0);

  // Remember the previous app state and the SQLite database connection
  const appStateRef = useRef(AppState.currentState);
  const dbRef = useRef(null);

  // 1. Set up the SQLite database when the app first starts
  useEffect(() => {
    async function initDatabase() {
      // Skip SQLite on web browsers because it only runs on mobile devices
      if (Platform.OS === 'web') return;

      try {
        // Open or create the database file named 'utask.db' on the phone
        const db = await SQLite.openDatabaseAsync('utask.db');
        dbRef.current = db;

        // Create the 'tasks' table if it does not exist yet
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

        // Check how many tasks are currently saved in the database
        const countResult = await db.getFirstAsync(
          'SELECT COUNT(*) AS count FROM tasks;'
        );

        if (countResult && countResult.count === 0) {
          // First time opening the app: copy the starter tasks into SQLite
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
          // Later launches: load previously saved tasks from SQLite
          const savedRows = await db.getAllAsync('SELECT * FROM tasks;');

          // Convert SQLite numbers (1 and 0) back into true and false
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

  // 3. Watch for when the user minimizes the app and comes back to it
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      // Check if the app just moved from background back to the screen
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        setLastForegroundSync(new Date().toLocaleTimeString());
        setForegroundCount((prev) => prev + 1);
      }
      appStateRef.current = nextAppState;
      setAppStateStatus(nextAppState);
    });

    // Stop watching when the component closes
    return () => {
      subscription.remove();
    };
  }, []);

  // Send a notification right away, and schedule a future alarm if date and time are set
  async function triggerTaskNotification(title, dueDate, dueTime) {
    try {
      await Notifications.requestPermissionsAsync();

      // Show an instant confirmation alert
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

      // Calculate how many seconds remain until the chosen due date and time
      if (dueDate && dueTime) {
        const target = new Date(`${dueDate}T${dueTime}:00`);
        const diffSeconds = Math.floor((target.getTime() - Date.now()) / 1000);

        // Schedule the future reminder only if the time has not already passed
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
      (t) => !t.completed && t.dueDate && t.dueDate <= TODAY_STR
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
      createdAt: TODAY_STR,
    };

    // Show the new task on screen right away
    setTasks((prev) => [newTask, ...prev]);

    // Save the new task row in SQLite
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

    // Trigger reminder notification if the switch was turned on
    if (reminderEnabled) {
      await triggerTaskNotification(newTask.title, newTask.dueDate, newTask.dueTime);
    }
  }

  // Save edited task details to both the screen and SQLite
  async function updateTask(id, updatedFields) {
    // Update the task on screen
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, ...updatedFields } : task))
    );

    // Update the matching row in SQLite
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

    // Trigger reminder notification if enabled during editing
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

    // Flip true to false, or false to true
    const nextCompleted = !targetTask.completed;

    // Update the checkbox on screen
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: nextCompleted } : task
      )
    );

    // Update the completed column in SQLite
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
    // Remove from screen
    setTasks((prev) => prev.filter((task) => task.id !== id));

    // Delete row from SQLite
    if (dbRef.current) {
      try {
        await dbRef.current.runAsync('DELETE FROM tasks WHERE id = ?;', [id]);
      } catch (error) {
        console.log('SQLite delete error:', error);
      }
    }
  }

  // Sort tasks so unfinished and urgent tasks appear at the top of the list
  function getSortedTasks(taskList = tasks) {
    return [...taskList].sort((a, b) => {
      // Put unfinished tasks before completed tasks
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      // Put tasks with a due date before tasks with no due date
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;
      if (!a.dueDate && !b.dueDate) return 0;

      // Sort by earliest due date first
      if (a.dueDate !== b.dueDate) {
        return a.dueDate.localeCompare(b.dueDate);
      }
      // If both tasks have the same date, sort by earliest due time
      const timeA = a.dueTime || '23:59';
      const timeB = b.dueTime || '23:59';
      return timeA.localeCompare(timeB);
    });
  }

  // Share all task data and functions with every screen inside the app
  return (
    <TaskContext.Provider
      value={{
        tasks,
        appStateStatus,
        lastForegroundSync,
        foregroundCount,
        addTask,
        updateTask,
        toggleTaskCompletion,
        deleteTask,
        getSortedTasks,
        sendInstantDemoNotification,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}