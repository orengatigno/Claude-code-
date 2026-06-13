import { Audio } from 'expo-av';

// Thin wrapper around expo-av recording so screens stay declarative.

let recording: Audio.Recording | null = null;
let playbackSound: Audio.Sound | null = null;

export async function requestMicPermission(): Promise<boolean> {
  const { granted } = await Audio.requestPermissionsAsync();
  return granted;
}

export async function startRecording(): Promise<void> {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
  });
  const { recording: rec } = await Audio.Recording.createAsync(
    Audio.RecordingOptionsPresets.HIGH_QUALITY,
  );
  recording = rec;
}

/** Stops recording and returns the local file URI of the captured audio. */
export async function stopRecording(): Promise<string | null> {
  if (!recording) return null;
  await recording.stopAndUnloadAsync();
  await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
  const uri = recording.getURI();
  recording = null;
  return uri ?? null;
}

export async function playAudio(uri: string): Promise<void> {
  if (playbackSound) {
    await playbackSound.unloadAsync();
    playbackSound = null;
  }
  const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
  playbackSound = sound;
  sound.setOnPlaybackStatusUpdate((status) => {
    if (status.isLoaded && status.didJustFinish) {
      sound.unloadAsync();
      playbackSound = null;
    }
  });
}
