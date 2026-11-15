// Helper to format a Date object as local 'YYYY-MM-DD'
export function formatDateISO(dateObj) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper to get a date string offset by N days from today
export function getOffsetDateString(daysOffset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return formatDateISO(date);
}

export const TODAY_STR = getOffsetDateString(0);
export const TOMORROW_STR = getOffsetDateString(1);
export const YESTERDAY_STR = getOffsetDateString(-1);
export const NEXT_WEEK_STR = getOffsetDateString(3);

export const INITIAL_TASKS = [
  {
    id: 'task-1',
    title: 'Submit COST 32152 Assignment 01',
    description: 'Push final React Native Expo Router code to GitHub and upload video link.',
    notes: 'Verify FlatList, Modal, AppState listener, and expo-notifications before pushing to main branch.',
    dueDate: YESTERDAY_STR,
    dueTime: '23:59',
    reminderEnabled: true,
    completed: false,
    createdAt: '2026-11-12',
  },
  {
    id: 'task-2',
    title: 'Review Mobile Computing Lecture 04 Notes',
    description: 'Revise Gestalt UI principles, Fitts Law, and Miller Law chunks.',
    notes: 'Focus on touch target sizing and navigation hierarchy diagrams.',
    dueDate: TODAY_STR,
    dueTime: '17:30',
    reminderEnabled: true,
    completed: false,
    createdAt: TODAY_STR,
  },
  {
    id: 'task-3',
    title: 'Prepare ASSA Astronomy Content Outline',
    description: 'Draft monthly stargazing post caption and event schedule.',
    notes: 'Coordinate with design team for celestial navy color theme assets.',
    dueDate: TODAY_STR,
    dueTime: '20:00',
    reminderEnabled: false,
    completed: false,
    createdAt: TODAY_STR,
  },
  {
    id: 'task-4',
    title: 'Software Quality Assurance Lab Practice',
    description: 'Run automated Selenium WebDriver test suite on sample login form.',
    notes: 'Check Maven pom.xml dependencies and TestNG assertions.',
    dueDate: TOMORROW_STR,
    dueTime: '10:00',
    reminderEnabled: true,
    completed: false,
    createdAt: TODAY_STR,
  },
  {
    id: 'task-5',
    title: 'Final Year Research Literature Summary',
    description: 'Summarize two papers on spatial geometry and tactical optimization.',
    notes: 'Save annotated PDFs inside the research reference folder.',
    dueDate: NEXT_WEEK_STR,
    dueTime: '14:00',
    reminderEnabled: false,
    completed: false,
    createdAt: TODAY_STR,
  },
  {
    id: 'task-6',
    title: 'Organize Local Development Workspace',
    description: 'Clean unused Node build caches and update Git SSH keys.',
    notes: 'Optional maintenance task with no strict deadline.',
    dueDate: '',
    dueTime: '',
    reminderEnabled: false,
    completed: false,
    createdAt: TODAY_STR,
  },
  {
    id: 'task-7',
    title: 'Evening 5km Recovery Run & Stretch',
    description: 'Dynamic warm-up, steady pace run, and static hamstring stretches.',
    notes: 'Completed earlier today.',
    dueDate: TODAY_STR,
    dueTime: '07:00',
    reminderEnabled: false,
    completed: true,
    createdAt: TODAY_STR,
  },
];