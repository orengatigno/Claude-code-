import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { CATEGORIES, getCategory } from '@/constants/categories';
import { STR } from '@/constants/strings';
import { theme } from '@/theme';
import { useTasksStore } from '@/store/useTasksStore';
import { formatReminder, REMINDER_PRESETS } from '@/lib/datetime';
import { playAudio } from '@/services/audio';
import type { CategoryId, SourceType } from '@/types';
import type { RootStackParamList } from '@/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'TaskDetail'>;

const SOURCE_LABEL: Record<SourceType, string> = {
  voice: STR.detail.sourceVoice,
  image: STR.detail.sourceImage,
  manual: STR.detail.sourceManual,
};

export function TaskDetailScreen({ route, navigation }: Props) {
  const { taskId } = route.params;
  const task = useTasksStore((s) => s.tasks.find((t) => t.id === taskId));
  const voiceNote = useTasksStore((s) => (task ? s.voiceNoteFor(task) : null));
  const editTask = useTasksStore((s) => s.editTask);
  const setReminder = useTasksStore((s) => s.setReminder);
  const removeTask = useTasksStore((s) => s.removeTask);

  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');

  if (!task) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.muted}>{STR.common.error}</Text>
      </SafeAreaView>
    );
  }

  async function save() {
    await editTask(taskId, { title: title.trim() || task!.title, description: description.trim() || null });
    navigation.goBack();
  }

  async function pickCategory(category: CategoryId) {
    await editTask(taskId, { category });
  }

  async function applyPreset(compute: () => Date) {
    await setReminder(taskId, compute().toISOString());
  }

  async function confirmDelete() {
    Alert.alert(STR.tasks.delete, '', [
      { text: STR.detail.cancel, style: 'cancel' },
      {
        text: STR.tasks.delete,
        style: 'destructive',
        onPress: async () => {
          await removeTask(taskId);
          navigation.goBack();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Title (Feature #9 — edit text) */}
        <Text style={styles.label}>{STR.detail.taskTitle}</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          multiline
          textAlign="right"
        />

        <Text style={styles.label}>{STR.detail.description}</Text>
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          value={description}
          onChangeText={setDescription}
          multiline
          textAlign="right"
          placeholder="—"
        />

        {/* Category (Feature #9 — change category) */}
        <Text style={styles.label}>{STR.detail.category}</Text>
        <View style={styles.chipsWrap}>
          {CATEGORIES.map((cat) => {
            const active = cat.id === task.category;
            return (
              <Pressable
                key={cat.id}
                onPress={() => pickCategory(cat.id)}
                style={[
                  styles.chip,
                  active && { backgroundColor: cat.color, borderColor: cat.color },
                ]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {cat.emoji} {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Reminder (Feature #9 — add/change reminder time) */}
        <Text style={styles.label}>{STR.detail.reminder}</Text>
        <Text style={styles.reminderValue}>
          {task.reminder_at ? `⏰ ${formatReminder(task.reminder_at)}` : STR.tasks.needsScheduling}
        </Text>
        <View style={styles.chipsWrap}>
          {REMINDER_PRESETS.map((p) => (
            <Pressable key={p.label} style={styles.chip} onPress={() => applyPreset(p.compute)}>
              <Text style={styles.chipText}>{p.label}</Text>
            </Pressable>
          ))}
          {task.reminder_at && (
            <Pressable
              style={[styles.chip, styles.chipDanger]}
              onPress={() => setReminder(taskId, null)}
            >
              <Text style={styles.chipText}>{STR.detail.clearReminder}</Text>
            </Pressable>
          )}
        </View>

        {/* Original source (Feature #12 — original voice note attached) */}
        <Text style={styles.label}>{STR.detail.source}</Text>
        <Text style={styles.muted}>{SOURCE_LABEL[task.source_type]}</Text>
        {voiceNote?.transcript ? (
          <>
            <Text style={[styles.label, { marginTop: theme.spacing(2) }]}>
              {STR.detail.transcript}
            </Text>
            <Text style={styles.transcript}>{voiceNote.transcript}</Text>
          </>
        ) : null}
        {voiceNote?.audio_url ? (
          <Pressable
            style={styles.listenBtn}
            onPress={() => playAudio(voiceNote.audio_url!).catch(() => {})}
          >
            <Text style={styles.listenText}>▶︎ {STR.tasks.listenOriginal}</Text>
          </Pressable>
        ) : null}

        {/* Actions */}
        <View style={styles.footer}>
          <Pressable style={[styles.bigBtn, styles.saveBtn]} onPress={save}>
            <Text style={styles.bigBtnText}>{STR.detail.save}</Text>
          </Pressable>
          <Pressable style={[styles.bigBtn, styles.deleteBtn]} onPress={confirmDelete}>
            <Text style={styles.bigBtnText}>{STR.tasks.delete}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

void getCategory; // kept for future inline category badge use

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  scroll: { padding: theme.spacing(4), gap: theme.spacing(2) },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textMuted,
    textAlign: 'right',
    marginTop: theme.spacing(3),
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: theme.radius.md,
    padding: theme.spacing(3),
    fontSize: 17,
    color: theme.colors.text,
    writingDirection: 'rtl',
  },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
  chipsWrap: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: theme.spacing(2),
  },
  chip: {
    paddingVertical: theme.spacing(2),
    paddingHorizontal: theme.spacing(3),
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#fff',
  },
  chipDanger: { borderColor: theme.colors.danger },
  chipText: { fontSize: 14, color: theme.colors.text },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  reminderValue: {
    fontSize: 16,
    color: theme.colors.primary,
    textAlign: 'right',
    marginBottom: theme.spacing(1),
  },
  muted: { fontSize: 15, color: theme.colors.textMuted, textAlign: 'right' },
  transcript: {
    fontSize: 15,
    color: theme.colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
    backgroundColor: '#fff',
    borderRadius: theme.radius.md,
    padding: theme.spacing(3),
  },
  listenBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing(3),
    alignItems: 'center',
    marginTop: theme.spacing(2),
  },
  listenText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  footer: { flexDirection: 'row-reverse', gap: theme.spacing(3), marginTop: theme.spacing(6) },
  bigBtn: { flex: 1, paddingVertical: theme.spacing(4), borderRadius: theme.radius.md, alignItems: 'center' },
  saveBtn: { backgroundColor: theme.colors.success },
  deleteBtn: { backgroundColor: theme.colors.danger },
  bigBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
