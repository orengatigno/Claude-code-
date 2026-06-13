import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Task } from '@/types';
import { CategoryMeta } from '@/constants/categories';
import { theme } from '@/theme';
import { TaskCard } from './TaskCard';

interface Props {
  category: CategoryMeta;
  tasks: Task[];
  hasVoiceNote: (t: Task) => boolean;
  onToggleDone: (id: string) => void;
  onOpenTask: (t: Task) => void;
}

/** Feature #8 — tasks grouped under a category header. */
export function CategorySection({
  category,
  tasks,
  hasVoiceNote,
  onToggleDone,
  onOpenTask,
}: Props) {
  if (tasks.length === 0) return null;
  const openCount = tasks.filter((t) => t.status !== 'done').length;

  return (
    <View style={styles.section}>
      <View style={[styles.header, { borderRightColor: category.color }]}>
        <Text style={styles.headerText}>
          {category.emoji} {category.label}
        </Text>
        <Text style={styles.count}>{openCount}</Text>
      </View>
      {tasks.map((t) => (
        <TaskCard
          key={t.id}
          task={t}
          hasVoiceNote={hasVoiceNote(t)}
          onToggleDone={() => onToggleDone(t.id)}
          onPress={() => onOpenTask(t)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: theme.spacing(5) },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing(2),
    paddingHorizontal: theme.spacing(3),
    borderRightWidth: 4,
    marginBottom: theme.spacing(2),
  },
  headerText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'right',
  },
  count: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textMuted,
    minWidth: 24,
    textAlign: 'center',
  },
});
