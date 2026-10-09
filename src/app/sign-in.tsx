/** Entrar, criar conta e recuperar senha — tudo numa tela só. */
import Ionicons from '@expo/vector-icons/Ionicons';
import { Link } from 'expo-router';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, TextField, ThemedText } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/theme/ThemeProvider';

type Mode = 'signIn' | 'signUp' | 'forgot';

export default function SignInScreen() {
  const { colors } = useTheme();
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<Mode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const passwordRef = useRef<TextInput>(null);

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setInfo(null);
  };

  const submit = async () => {
    setError(null);
    setInfo(null);
    const cleanEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) return setError('Digite um e-mail válido.');
    if (mode !== 'forgot' && password.length < 6) return setError('A senha precisa ter pelo menos 6 caracteres.');

    setBusy(true);
    try {
      if (mode === 'signIn') {
        await signIn(cleanEmail, password);
      } else if (mode === 'signUp') {
        const needsConfirmation = await signUp(cleanEmail, password);
        if (needsConfirmation) {
          setInfo('Conta criada! Enviamos um link de confirmação para o seu e-mail.');
          setMode('signIn');
        }
      } else {
        await resetPassword(cleanEmail);
        setInfo('Se existir uma conta com esse e-mail, você vai receber um link para criar uma nova senha.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const titles: Record<Mode, string> = {
    signIn: 'Bem-vindo de volta',
    signUp: 'Crie sua conta',
    forgot: 'Recuperar senha',
  };
  const actions: Record<Mode, string> = { signIn: 'Entrar', signUp: 'Criar conta', forgot: 'Enviar link' };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <View style={[styles.logo, { backgroundColor: colors.primary }]}>
              <Ionicons name="checkmark-done" size={36} color={colors.primaryText} />
            </View>
            <ThemedText style={styles.appName}>Tarefas</ThemedText>
            <ThemedText muted style={styles.center}>
              Organize seu dia. Sincroniza entre celular e computador.
            </ThemedText>
          </View>

          <ThemedText style={styles.title}>{titles[mode]}</ThemedText>

          <TextField
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            returnKeyType={mode === 'forgot' ? 'send' : 'next'}
            onSubmitEditing={() => (mode === 'forgot' ? submit() : passwordRef.current?.focus())}
          />
          {mode !== 'forgot' ? (
            <TextField
              ref={passwordRef}
              label="Senha"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete={mode === 'signUp' ? 'new-password' : 'current-password'}
              textContentType={mode === 'signUp' ? 'newPassword' : 'password'}
              returnKeyType="go"
              onSubmitEditing={submit}
            />
          ) : null}

          {error ? <ThemedText style={{ color: colors.danger }}>{error}</ThemedText> : null}
          {info ? <ThemedText style={{ color: colors.success }}>{info}</ThemedText> : null}

          <Button title={actions[mode]} onPress={submit} loading={busy} />

          {mode === 'signIn' ? (
            <>
              <Button title="Esqueci minha senha" variant="ghost" onPress={() => switchMode('forgot')} />
              <Button title="Não tem conta? Cadastre-se" variant="secondary" onPress={() => switchMode('signUp')} />
            </>
          ) : (
            <Button title="Já tenho conta" variant="ghost" onPress={() => switchMode('signIn')} />
          )}

          <Link href="/privacy" style={[styles.center, styles.link, { color: colors.textMuted }]}>
            Política de privacidade
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 24, gap: 14, maxWidth: 440, width: '100%', alignSelf: 'center', flexGrow: 1, justifyContent: 'center' },
  brand: { alignItems: 'center', gap: 8, marginBottom: 16 },
  logo: { width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  appName: { fontSize: 28, fontWeight: '800' },
  title: { fontSize: 20, fontWeight: '700' },
  center: { textAlign: 'center' },
  link: { fontSize: 14, marginTop: 8 },
});
