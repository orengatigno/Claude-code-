import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { CategorySection } from '@/components/CategorySection';
import { CATEGORIES } from '@/constants/categories';
import { STR } from '@/constants/strings';
import { theme } from '@/theme';
import { useTasksStore } from '@/store/useTasksStore';
import type { Task } from '@/types';
import type { RootStackParamList } from '@/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Tasks'>;

export function TasksScreen({ navigation }: Props) {
  const tasks = useTasksStore((s) => s.tasks);
  const toggleDone = useTasksStore((s) => s.toggleDone);
  const voiceNoteFor = useTasksStore((s) => s.voiceNoteFor);

  // Feature #8 — group by category, keeping a stable category order; within a
  // category, open tasks first then done, newest first.
  const grouped = useMemo(() => {
    const byCat = new Map<string, Task[]>();
    for (const t of tasks) {
      const arr = byCat.get(t.category) ?? [];
      arr.push(t);
      byCat.set(t.category, arr);
    }
    for (const arr of byCat.values()) {
      arr.sort((a, b) => {
        if ((a.status === 'done') !== (b.status === 'done')) {
          return a.status === 'done' ? 1 : -1;
        }
        return b.created_at.localeCompare(a.created_at);
      });
    }
    return byCat;
  }, [tasks]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {tasks.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{STR.tasks.empty}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {CATEGORIES.map((cat) => (
            <CategorySection
              key={cat.id}
              category={cat}
              tasks={grouped.get(cat.id) ?? []}
              hasVoiceNote={(t) => Boolean(voiceNoteFor(t))}
              onToggleDone={toggleDone}
              onOpenTask={(t) => navigation.navigate('TaskDetail', { taskId: t.id })}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  scroll: { padding: theme.spacing(4) },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing(8) },
  emptyText: {
    fontSize: 18,
    color: theme.colors.textMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
});
