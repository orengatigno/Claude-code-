import * as Notifications from 'expo-notifications';

import { Task } from '@/types';
import { getCategory } from '@/constants/categories';

// Show alerts even when the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  return status === 'granted';
}

/**
 * Schedules a local notification for a task's reminder_at time.
 * Returns the notification id (store it if you want to cancel later), or null.
 */
export async function scheduleTaskReminder(task: Task): Promise<string | null> {
  if (!task.reminder_at) return null;

  const when = new Date(task.reminder_at);
  if (when.getTime() <= Date.now()) return null; // don't schedule in the past

  const cat = getCategory(task.category);
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: `${cat.emoji} ${cat.label}`,
      body: task.title,
      data: { taskId: task.id },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when },
  });
  return id;
}

export async function cancelReminder(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}
