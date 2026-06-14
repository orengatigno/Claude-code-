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
  // Switch the audio session back to playback so the speaker isn't muted.
  await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
  return uri ?? null;
}

/** Tears down any active player. Safe to call repeatedly. */
export function stopPlayback(): void {
  if (player) {
    try {
      player.pause();
      player.remove();
    } catch {
      // already released
    }
    player = null;
  }
}

/**
 * Plays an audio file. Always stops any previous playback first so presses
 * never stack on top of each other. `onFinish` fires when playback ends so the
 * UI can reset its Play/Stop toggle.
 */
export function playAudio(uri: string, onFinish?: () => void): void {
  stopPlayback();
  const p = createAudioPlayer(uri);
  player = p;
  p.addListener('playbackStatusUpdate', (status) => {
    if (status.didJustFinish) {
      stopPlayback();
      onFinish?.();
    }
  });
  p.play();
}

export function isPlaying(): boolean {
  return Boolean(player?.playing);
}
