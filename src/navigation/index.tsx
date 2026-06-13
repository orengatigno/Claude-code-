import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { HomeScreen } from '@/screens/HomeScreen';
import { TasksScreen } from '@/screens/TasksScreen';
import { TaskDetailScreen } from '@/screens/TaskDetailScreen';
import { STR } from '@/constants/strings';
import { theme } from '@/theme';

export type RootStackParamList = {
  Home: undefined;
  Tasks: undefined;
  TaskDetail: { taskId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function Navigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.bg },
          headerTintColor: theme.colors.textOnDark,
          headerTitleAlign: 'center',
          // RTL-friendly: back button mirrors automatically in RTL layout.
          headerBackTitleVisible: false,
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Tasks" component={TasksScreen} options={{ title: STR.tasks.title }} />
        <Stack.Screen
          name="TaskDetail"
          component={TaskDetailScreen}
          options={{ title: STR.detail.title }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
