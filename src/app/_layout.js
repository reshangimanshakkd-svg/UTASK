import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as NavigationBar from 'expo-navigation-bar';
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
  useEffect(() => {
    if (Platform.OS === 'android' && NavigationBar.setVisibilityAsync) {
      NavigationBar.setVisibilityAsync('hidden');
    }
  }, []);

  return (
    <TaskProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </TaskProvider>
  );
}