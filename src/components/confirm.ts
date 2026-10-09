import { Alert, Platform } from 'react-native';

/**
 * Pergunta de confirmação que funciona no celular (Alert nativo) e na web
 * (window.confirm — o Alert do React Native não aparece no navegador).
 */
export function confirm(title: string, message: string, confirmLabel = 'Apagar'): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
    ], { cancelable: true, onDismiss: () => resolve(false) });
  });
}
