import React from 'react';
import { Stack } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { TaskProvider } from '../../context/TaskContext';

// Configure how notifications behave while the app is open in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
    
  return (
    <TaskProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </TaskProvider>
    
  );
}