import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/theme';

interface Props {
  recording: boolean;
  processing: boolean;
  onPress: () => void;
  label: string;
}

/** The big one-tap record button on the home screen (Feature #1). */
export function RecordButton({ recording, processing, onPress, label }: Props) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (recording) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1.18,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 1,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }
    pulse.setValue(1);
    return undefined;
  }, [recording, pulse]);

  return (
    <View style={styles.wrap}>
      <Animated.View style={{ transform: [{ scale: pulse }] }}>
        <Pressable
          onPress={onPress}
          disabled={processing}
          style={({ pressed }) => [
            styles.button,
            recording && styles.buttonRecording,
            processing && styles.buttonDisabled,
            pressed && styles.buttonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={label}
        >
          <Text style={styles.icon}>{recording ? '■' : '🎙️'}</Text>
        </Pressable>
      </Animated.View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: theme.spacing(5) },
  button: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  buttonRecording: { backgroundColor: theme.colors.danger },
  buttonDisabled: { opacity: 0.5 },
  buttonPressed: { opacity: 0.85 },
  icon: { fontSize: 72, color: '#fff' },
  label: {
    color: theme.colors.textOnDark,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
});
