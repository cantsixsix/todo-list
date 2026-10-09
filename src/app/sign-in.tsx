/**
 * Entrar, criar conta e recuperar senha.
 * Celular: marca no topo e formulário abaixo.
 * Computador: painel da marca à esquerda (benefícios) e formulário à direita.
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import { Link } from 'expo-router';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View, type TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, TextField, ThemedText } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { BRAND } from '@/theme/brand';
import { fonts, radius, space, type } from '@/theme/tokens';
import { useIsWide } from '@/theme/useLayout';

type Mode = 'signIn' | 'signUp' | 'forgot';

const BENEFITS: { icon: React.ComponentProps<typeof Ionicons>['name']; text: string }[] = [
  { icon: 'sync', text: 'Sincroniza na hora entre celular e computador' },
  { icon: 'cloud-offline-outline', text: 'Funciona mesmo sem internet' },
  { icon: 'repeat', text: 'Tarefas que se repetem sozinhas' },
  { icon: 'lock-closed-outline', text: 'Seus dados protegidos e só seus' },
];

export default function SignInScreen() {
  const { colors } = useTheme();
  const wide = useIsWide();
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<Mode>('signIn');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const emailRef = useRef<TextInput>(null);
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
    if (mode === 'signUp' && name.trim().length < 2) return setError('Digite seu nome.');
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) return setError('Digite um e-mail válido.');
    if (mode !== 'forgot' && password.length < 6) return setError('A senha precisa ter pelo menos 6 caracteres.');

    setBusy(true);
    try {
      if (mode === 'signIn') {
        await signIn(cleanEmail, password);
      } else if (mode === 'signUp') {
        const needsConfirmation = await signUp(name, cleanEmail, password);
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

  const titles: Record<Mode, [string, string]> = {
    signIn: ['Bem-vindo de volta', 'Entre para ver suas tarefas.'],
    signUp: ['Crie sua conta', 'Leva menos de um minuto. É grátis.'],
    forgot: ['Recuperar senha', 'Enviaremos um link para o seu e-mail.'],
  };
  const actions: Record<Mode, string> = { signIn: 'Entrar', signUp: 'Criar conta grátis', forgot: 'Enviar link' };

  const form = (
    <View style={styles.form}>
      {!wide ? (
        <View style={styles.brandSmall}>
          <View style={[styles.logo, { backgroundColor: BRAND.indigo }]}>
            <Ionicons name="checkmark" size={30} color={BRAND.onBrand} />
          </View>
          <Text style={[type.title, { color: colors.text, fontFamily: fonts.extrabold }]}>Tarefas</Text>
        </View>
      ) : null}

      <View style={styles.heading}>
        <ThemedText variant="display">{titles[mode][0]}</ThemedText>
        <ThemedText muted>{titles[mode][1]}</ThemedText>
      </View>

      {mode === 'signUp' ? (
        <TextField
          label="Nome"
          icon="person-outline"
          value={name}
          onChangeText={setName}
          autoComplete="name"
          textContentType="name"
          autoCapitalize="words"
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
          placeholder="Como quer ser chamado?"
        />
      ) : null}
      <TextField
        ref={emailRef}
        label="E-mail"
        icon="mail-outline"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        placeholder="voce@email.com"
        returnKeyType={mode === 'forgot' ? 'send' : 'next'}
        onSubmitEditing={() => (mode === 'forgot' ? submit() : passwordRef.current?.focus())}
      />
      {mode !== 'forgot' ? (
        <TextField
          ref={passwordRef}
          label="Senha"
          icon="lock-closed-outline"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder={mode === 'signUp' ? 'Mínimo de 6 caracteres' : '••••••'}
          autoComplete={mode === 'signUp' ? 'new-password' : 'current-password'}
          textContentType={mode === 'signUp' ? 'newPassword' : 'password'}
          returnKeyType="go"
          onSubmitEditing={submit}
        />
      ) : null}

      {mode === 'signIn' ? (
        <Text
          onPress={() => switchMode('forgot')}
          accessibilityRole="button"
          style={[type.small, styles.forgot, { color: colors.link, fontFamily: fonts.semibold }]}
        >
          Esqueci minha senha
        </Text>
      ) : null}

      {error ? (
        <View style={[styles.notice, { backgroundColor: colors.dangerSoft }]}>
          <Ionicons name="alert-circle" size={18} color={colors.danger} />
          <ThemedText variant="small" style={[styles.flex, { color: colors.danger }]}>
            {error}
          </ThemedText>
        </View>
      ) : null}
      {info ? (
        <View style={[styles.notice, { backgroundColor: colors.successSoft }]}>
          <Ionicons name="checkmark-circle" size={18} color={colors.success} />
          <ThemedText variant="small" style={[styles.flex, { color: colors.success }]}>
            {info}
          </ThemedText>
        </View>
      ) : null}

      <Button title={actions[mode]} onPress={submit} loading={busy} />

      {mode === 'signUp' ? (
        <ThemedText muted variant="caption" style={styles.center}>
          Ao criar a conta você concorda com os{' '}
          <Link href="/terms" style={{ color: colors.link }}>
            Termos de Uso
          </Link>{' '}
          e a{' '}
          <Link href="/privacy" style={{ color: colors.link }}>
            Política de Privacidade
          </Link>
          .
        </ThemedText>
      ) : null}

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {mode === 'signIn' ? (
        <ThemedText muted variant="small" style={styles.center}>
          Novo por aqui?{' '}
          <Text onPress={() => switchMode('signUp')} accessibilityRole="button" style={{ color: colors.link, fontFamily: fonts.semibold }}>
            Crie sua conta
          </Text>
        </ThemedText>
      ) : (
        <ThemedText muted variant="small" style={styles.center}>
          Já tem conta?{' '}
          <Text onPress={() => switchMode('signIn')} accessibilityRole="button" style={{ color: colors.link, fontFamily: fonts.semibold }}>
            Entrar
          </Text>
        </ThemedText>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: wide ? colors.surface : colors.background }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.flex, wide && styles.row]}>
          {wide ? (
            <View style={[styles.brandPanel, { backgroundColor: BRAND.indigo }]}>
              <View style={styles.brandRow}>
                <View style={[styles.logoSmall, { backgroundColor: BRAND.onBrand }]}>
                  <Ionicons name="checkmark" size={22} color={BRAND.indigo} />
                </View>
                <Text style={[type.title, { color: BRAND.onBrand }]}>Tarefas</Text>
              </View>
              <View style={styles.pitch}>
                <Text style={[type.display, styles.pitchTitle, { color: BRAND.onBrand }]}>
                  Organize o dia em segundos.
                </Text>
                {BENEFITS.map((b) => (
                  <View key={b.text} style={styles.benefit}>
                    <View style={styles.benefitIcon}>
                      <Ionicons name={b.icon} size={18} color={BRAND.onBrand} />
                    </View>
                    <Text style={[type.bodyMedium, { color: BRAND.onBrand, opacity: 0.95 }]}>{b.text}</Text>
                  </View>
                ))}
              </View>
              <Link href="/privacy" style={[type.caption, { color: BRAND.onBrand, opacity: 0.8 }]}>
                Política de privacidade
              </Link>
            </View>
          ) : null}
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            {form}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: space.xl },
  form: { width: '100%', maxWidth: 420, alignSelf: 'center', gap: space.lg },
  brandSmall: { alignItems: 'center', gap: space.md, marginBottom: space.sm },
  logo: { width: 64, height: 64, borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center' },
  heading: { gap: space.xs + 2 },
  forgot: { alignSelf: 'flex-end', marginTop: -space.xs },
  notice: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.md, borderRadius: radius.md },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: space.xs },
  center: { textAlign: 'center' },
  brandPanel: { flex: 1, maxWidth: 520, padding: space.xxxl, justifyContent: 'space-between' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  logoSmall: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  pitch: { gap: space.xl },
  pitchTitle: { fontSize: 40, lineHeight: 46, marginBottom: space.sm },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  benefitIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
