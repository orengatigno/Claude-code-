import {
  createAudioPlayer,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  RecordingPresets,
  AudioModule,
} from 'expo-audio';
import type { AudioPlayer, AudioRecorder } from 'expo-audio';

let recorder: AudioRecorder | null = null;
let player: AudioPlayer | null = null;

export async function requestMicPermission(): Promise<boolean> {
  const { granted } = await requestRecordingPermissionsAsync();
  return granted;
}

export async function startRecording(): Promise<void> {
  await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
  recorder = new AudioModule.AudioRecorder(RecordingPresets.HIGH_QUALITY);
  await recorder.prepareToRecordAsync();
  recorder.record();
}

/** Stops the active recording and returns the local file URI. */
export async function stopRecording(): Promise<string | null> {
  if (!recorder) return null;
  await recorder.stop();
  const uri = recorder.uri;
  recorder.release();
  recorder = null;
  await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
  return uri ?? null;
}

export async function playAudio(uri: string): Promise<void> {
  if (player) {
    player.remove();
    player = null;
  }
  player = createAudioPlayer(uri);
  player.play();
}
