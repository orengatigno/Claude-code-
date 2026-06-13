import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Task } from '@/types';
import { theme } from '@/theme';
import { STR } from '@/constants/strings';
import { formatReminder } from '@/lib/datetime';

interface Props {
  task: Task;
  hasVoiceNote: boolean;
  onToggleDone: () => void;
  onPress: () => void;
}

/** A single task row. RTL-aware. */
export function TaskCard({ task, hasVoiceNote, onToggleDone, onPress }: Props) {
  const done = task.status === 'done';
  const needsScheduling = task.status === 'needs_scheduling';

  return (
    <Pressable onPress={onPress} style={styles.card}>
      {/* Checkbox on the right (RTL leading edge). */}
      <Pressable
        onPress={onToggleDone}
        hitSlop={10}
        style={[styles.checkbox, done && styles.checkboxDone]}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        accessibilityLabel={done ? STR.tasks.markOpen : STR.tasks.markDone}
      >
        {done && <Text style={styles.check}>✓</Text>}
      </Pressable>

      <View style={styles.body}>
        <Text style={[styles.title, done && styles.titleDone]} numberOfLines={2}>
          {task.title}
        </Text>

        <View style={styles.metaRow}>
          {task.reminder_at ? (
            <Text style={styles.reminder}>⏰ {formatReminder(task.reminder_at)}</Text>
          ) : needsScheduling ? (
            <Text style={styles.needsScheduling}>🕗 {STR.tasks.needsScheduling}</Text>
          ) : null}
          {hasVoiceNote && <Text style={styles.voiceBadge}>🎧</Text>}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: theme.spacing(3),
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing(3),
    paddingHorizontal: theme.spacing(4),
    marginBottom: theme.spacing(2),
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  check: { color: '#fff', fontSize: 16, fontWeight: '700' },
  body: { flex: 1 },
  title: {
    fontSize: 17,
    color: theme.colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  titleDone: {
    textDecorationLine: 'line-through',
    color: theme.colors.textMuted,
  },
  metaRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: theme.spacing(3),
    marginTop: theme.spacing(1),
  },
  reminder: { fontSize: 13, color: theme.colors.primary, textAlign: 'right' },
  needsScheduling: { fontSize: 13, color: '#D97706', textAlign: 'right' },
  voiceBadge: { fontSize: 14 },
});
