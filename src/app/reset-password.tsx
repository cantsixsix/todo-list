/** Aberta pelo link "esqueci minha senha" do e-mail: define a nova senha. */
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { useSnackbar } from '@/components/Snackbar';
import { Button, TextField, ThemedText } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/theme/ThemeProvider';

export default function ResetPasswordScreen() {
  const { colors } = useTheme();
  const { updatePassword } = useAuth();
  const snack = useSnackbar();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (password.length < 6) return setError('A senha precisa ter pelo menos 6 caracteres.');
    setBusy(true);
    setError(null);
    try {
      await updatePassword(password);
      snack({ text: 'Senha alterada!' });
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <View style={styles.content}>
        <ThemedText>Escolha uma nova senha para sua conta.</ThemedText>
        <TextField
          label="Nova senha"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          onSubmitEditing={submit}
        />
        {error ? <ThemedText style={{ color: colors.danger }}>{error}</ThemedText> : null}
        <Button title="Salvar nova senha" onPress={submit} loading={busy} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({ content: { padding: 16, gap: 16 } });
