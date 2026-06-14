import Constants from 'expo-constants';

import { Task } from '@/types';
import { getCategory } from '@/constants/categories';

// expo-notifications was stripped of much of its functionality in Expo Go
// (SDK 53+), and merely importing it there throws a noisy console error on
// every launch. So we *lazily* load it and skip it entirely inside Expo Go.
// Local reminders work normally in a development/production build.
const isExpoGo = Constants.executionEnvironment === 'storeClient';

type NotificationsModule = typeof import('expo-notifications');

let cached: NotificationsModule | null = null;
let handlerSet = false;

/** Returns the expo-notifications module, or null when unavailable (Expo Go). */
function getNotifications(): NotificationsModule | null {
  if (isExpoGo) return null;
  if (!cached) {
    // Required lazily so Expo Go never loads the native module.
    cached = require('expo-notifications') as NotificationsModule;
    if (!handlerSet) {
      cached.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
      handlerSet = true;
    }
  }
  return cached;
}

export async function requestNotificationPermissions(): Promise<boolean> {
  const N = getNotifications();
  if (!N) return false;
  const { status: existing } = await N.getPermissionsAsync();
  let status = existing;
  if (existing !== 'granted') {
    const req = await N.requestPermissionsAsync();
    status = req.status;
  }
  return status === 'granted';
}

/**
 * Schedules a local notification for a task's reminder_at time.
 * Returns the notification id (store it if you want to cancel later), or null.
 * No-op inside Expo Go.
 */
export async function scheduleTaskReminder(task: Task): Promise<string | null> {
  const N = getNotifications();
  if (!N || !task.reminder_at) return null;

  const when = new Date(task.reminder_at);
  if (when.getTime() <= Date.now()) return null; // don't schedule in the past

  const cat = getCategory(task.category);
  const id = await N.scheduleNotificationAsync({
    content: {
      title: `${cat.emoji} ${cat.label}`,
      body: task.title,
      data: { taskId: task.id },
    },
    trigger: { type: N.SchedulableTriggerInputTypes.DATE, date: when },
  });
  return id;
}

export async function cancelReminder(notificationId: string): Promise<void> {
  const N = getNotifications();
  if (!N) return;
  await N.cancelScheduledNotificationAsync(notificationId);
}
