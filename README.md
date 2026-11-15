# UTASK — Smart Academic & Daily Task Manager

**Student Name:** K.K.D. Reshan Gimansha  
**Student ID:** PS/2022/121   
**Demonstration Video:** https://drive.google.com/drive/folders/1MO2aX9djVUnmN4BbXo-3fDz3G5i4FgKf?usp=sharing  


---

## 1. Overview & Problem Statement

**UTASK** is a cross-platform mobile task and deadline management application built with **React Native**, **Expo Router**, **SQLite**, and **Expo Notifications**.

### What Problem Does It Solve?
University students often juggle overlapping lab submissions, assignments, and daily reminders across disconnected notes or static to-do lists that do not prioritize urgency or alert users before deadlines pass. UTASK solves this by:
* **Automatically sorting tasks by urgency**—surfacing overdue tasks in red at the top, followed by tasks due today and upcoming deadlines.
* **Providing rapid task scheduling** via quick-pick date chips (`Today`, `Tomorrow`) and native Android date/time pickers.
* **Delivering reliable local notifications**, including both instant confirmation banners upon scheduling and exact timed deadline alerts.
* **Persisting tasks locally in SQLite** while keeping summary metrics synchronized in real time across tabs.

---

## 2. Application Screens & Purpose

UTASK consists of **four screens** organized into a bottom tab navigator (`3` tabs) and a nested stack route (`1` detail screen):

| Screen | Route | Navigation Type | Purpose |
| :--- | :--- | :--- | :--- |
| **Tasks (Smart Schedule)** | `app/(tabs)/index.jsx` | Bottom Tab 1 | Main dashboard displaying tasks sorted automatically by urgency (`Overdue`, `Due Today`, `Upcoming`). Supports quick completion checkboxes, active task counters, and a dismissible `Welcome Back` resume banner. |
| **Add Task** | `app/(tabs)/add.jsx` | Bottom Tab 2 | Form screen to create new tasks with title, description, checklist notes, quick-pick date chips, native date/time pickers, and a reminder alert toggle. |
| **Overview (UTASK Planner)** | `app/(tabs)/overview.jsx` | Bottom Tab 3 | Real-time analytics and control panel showing live counters (`Urgent / Due Today`, `Upcoming`, `Completed`), an instant `Send Daily Summary Notification` trigger, and a `Reset App & Clear All Data` action. |
| **Task Details** | `app/task/[id].jsx` | Nested Stack Screen | Dynamic detail route opened by tapping any task card. Allows users to inspect full task metadata, edit task fields inline, or permanently delete the task via a confirmation modal. |

---

## 3. Core React Native Components Implemented

| Component | Where Implemented | Implementation Role |
| :--- | :--- | :--- |
| **`View`** | All screens & custom components | Structured card layouts, urgency badges, summary metric tiles, and screen containers. |
| **`Text`** | All screens & custom components | Task titles, urgency tags, timestamps, live summary counters, and strikethrough styling on completed tasks. |
| **`Image`** | Splash / Header & Empty States (`index.jsx`, `overview.jsx`) | Renders the UTASK brand icon/logo and empty-state visual indicators. |
| **`Pressable`** | Task cards, quick chips, checkboxes, action buttons | Handles tap interactions for opening Task Details, toggling task completion, picking dates, and triggering notifications. |
| **`FlatList`** | `app/(tabs)/index.jsx` | Efficiently renders the urgency-sorted list of tasks (pre-populated with realistic academic tasks such as *Mobile Lab 06* and *Organize Local Development Workflow*) with smooth scrolling and key extraction. |
| **`Modal`** | `app/task/[id].jsx` & `app/(tabs)/overview.jsx` | Provides confirmation dialogs before destructive actions (`Delete Task?` confirmation modal and `Reset App & Clear All Data` safety prompt). |
| **`TextInput` & `Switch`** | `app/(tabs)/add.jsx` & `app/task/[id].jsx` | Captures task titles/notes and toggles scheduled reminder alerts on or off. |

---

## 4. Expo Router Directory Structure (`app/`)

UTASK uses **file-based routing** powered by **Expo Router**, combining a root stack navigator with a grouped bottom tab layout and dynamic nested routes:

```text
app/
├── _layout.jsx          # Root Stack navigator (wraps Tab layout & nested Task Details screen; handles header & back navigation)
├── (tabs)/
│   ├── _layout.jsx      # Bottom Tab navigator configuration (Tasks, Add Task, Overview icons & styling)
│   ├── index.jsx        # Tab 1: Smart Schedule task list (FlatList + AppState banner)
│   ├── add.jsx          # Tab 2: Add Task form with date/time pickers & notification scheduling
│   └── overview.jsx     # Tab 3: Live summary counters, Daily Check-In trigger, & SQLite reset
└── task/
    └── [id].jsx         # Nested Stack Screen: Dynamic Task Details, inline editing, & Delete confirmation Modal
```

* **Tab Navigation:** Managed inside `app/(tabs)/_layout.jsx` for instant switching between *Tasks*, *Add Task*, and *Overview*.
* **Nested Stack Navigation:** Tapping a task card pushes `/task/[id]` onto the root stack defined in `app/_layout.jsx`, providing native header back/dismiss navigation back to the active tab.

---

## 5. Shared State & `AppState` Lifecycle Handling

* **Shared Application State & SQLite Persistence:** Interactive task state (creating tasks, toggling completion status, inline editing, deleting records, and resetting storage) is synchronized across all screens so changes on the **Tasks** or **Add Task** tabs immediately update the counters on the **Overview** tab.
* **`AppState` Foreground Detection:** Implemented in `app/(tabs)/index.jsx` using React Native's `AppState.addEventListener('change', ...)`. When the user minimizes UTASK (`background` / `inactive`) and returns to the app (`active`), UTASK detects the transition, recalculates deadline urgency against the current system clock, updates the last-refreshed timestamp, and displays a dismissible **Welcome Back** summary banner.

---

## 6. Local Notifications Implementation (`expo-notifications`)

### Research & Implementation Approach
1. **Documentation & Permissions Setup:** Reviewed the official Expo Notifications documentation for Android channel configuration and runtime permission requests (`Notifications.requestPermissionsAsync()` and `Notifications.setNotificationChannelAsync()`), ensuring compatibility with standalone Android APK builds.
2. **Foreground Notification Handler:** Configured `Notifications.setNotificationHandler` so local notifications display banners and play alerts even while the app is open in the foreground.
3. **Three Notification Triggers Built into UTASK:**
   * **Immediate Confirmation Alert:** Fires immediately (`trigger: null`) when a user creates a task with reminders enabled (e.g., *"UTASK Reminder Active"* for *Mobile Lab 06*).
   * **Scheduled Deadline Reminder:** Schedules an exact timed local notification (`SchedulableTriggerInputTypes.DATE`) matching the user's selected date and time (e.g., firing at `19:06` in the Android notification shade).
   * **Instant Daily Check-In Summary:** Triggered on demand from the **Overview** tab (`Send Daily Summary Notification`) to summarize remaining urgent/today tasks, and cleanly cancelled via `cancelAllScheduledNotificationsAsync()` when resetting app data.

---

## 7. Local Setup & Run Instructions

### Prerequisites
* Node.js (LTS recommended)
* npm or Yarn
* Expo Go app (Android/iOS) or an Android Emulator / physical Android device

### Installation & Running Locally

```bash
# 1. Clone the repository
git clone [https://github.com/reshangimanshakkd-svg/UTASK.git](https://github.com/reshangimanshakkd-svg/UTASK.git)

# 2. Navigate into the project directory
cd UTASK

# 3. Install dependencies
npm install

# 4. Start the Expo development server
npx expo start
```

* Press **`a`** in the terminal to launch on an Android Emulator, or scan the QR code using **Expo Go** on your physical device.
* To clear Metro bundler cache if needed:
  ```bash
  npx expo start -c
  ```