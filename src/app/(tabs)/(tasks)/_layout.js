import React from 'react';
import { Stack } from 'expo-router';
import { COLORS } from '../../../../constants/theme';

export default function TasksStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.surface,
        },
        headerTintColor: COLORS.primary,
        headerTitleStyle: {
          fontWeight: '700',
          color: COLORS.textPrimary,
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'UTASK',
        }}
      />
      <Stack.Screen
        name="task-details"
        options={{
          title: 'Task Details',
        }}
      />
    </Stack>
  );
}