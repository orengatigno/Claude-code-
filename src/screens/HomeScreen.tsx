import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RecordButton } from '@/components/RecordButton';
import { STR, buildConfirmation } from '@/constants/strings';
import { theme } from '@/theme';
import { useTasksStore } from '@/store/useTasksStore';
import {
  requestMicPermission,
  startRecording,
  stopRecording,
} from '@/services/audio';
import { requestNotificationPermissions } from '@/services/notifications';
import type { RootStackParamList } from '@/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const [recording, setRecording] = useState(false);
  const processing = useTasksStore((s) => s.isProcessing);
  const processVoiceNote = useTasksStore((s) => s.processVoiceNote);
  const processImage = useTasksStore((s) => s.processImage);
  const taskCount = useTasksStore((s) => s.tasks.length);

  const label = processing
    ? STR.home.processing
    : recording
      ? STR.home.recording
      : STR.home.tapToRecord;

  // Feature #1 — one tap to start, tap again to stop & process.
  async function handleRecordPress() {
    try {
      if (!recording) {
        const ok = await requestMicPermission();
        if (!ok) {
          Alert.alert(STR.home.micPermission);
          return;
        }
        await requestNotificationPermissions();
        await startRecording();
        setRecording(true);
      } else {
        setRecording(false);
        const uri = await stopRecording();
        if (!uri) return;
        const { categories } = await processVoiceNote(uri);
        Alert.alert(buildConfirmation(categories));
      }
    } catch (e) {
      setRecording(false);
      console.warn(e);
      Alert.alert(STR.common.error, e instanceof Error ? e.message : undefined);
    }
  }

  // Feature #10 — take/upload a photo, OCR, extract tasks.
  async function handleAddPhoto() {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });
      if (result.canceled || !result.assets[0]) return;
      const { categories } = await processImage(result.assets[0].uri);
      Alert.alert(buildConfirmation(categories));
    } catch (e) {
      console.warn(e);
      Alert.alert(STR.common.error, e instanceof Error ? e.message : undefined);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.appTitle}>{STR.appTitle}</Text>

      <View style={styles.center}>
        <RecordButton
          recording={recording}
          processing={processing}
          onPress={handleRecordPress}
          label={label}
        />
        {processing && (
          <ActivityIndicator style={{ marginTop: theme.spacing(6) }} color="#fff" />
        )}
      </View>

      <View style={styles.actions}>
        <Pressable
          style={styles.secondaryBtn}
          onPress={handleAddPhoto}
          disabled={processing}
        >
          <Text style={styles.secondaryText}>📷 {STR.home.addPhoto}</Text>
        </Pressable>

        <Pressable
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate('Tasks')}
          disabled={processing}
        >
          <Text style={styles.secondaryText}>
            📋 {STR.home.viewTasks}
            {taskCount > 0 ? ` (${taskCount})` : ''}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    paddingHorizontal: theme.spacing(5),
  },
  appTitle: {
    color: theme.colors.textOnDark,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: theme.spacing(3),
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  actions: {
    gap: theme.spacing(3),
    paddingBottom: theme.spacing(6),
  },
  secondaryBtn: {
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing(4),
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  secondaryText: {
    color: theme.colors.textOnDark,
    fontSize: 18,
    fontWeight: '600',
  },
});
