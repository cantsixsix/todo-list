import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/** Vibração leve de confirmação (só no celular; na web não faz nada). */
export function tap() {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function success() {
  if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}
