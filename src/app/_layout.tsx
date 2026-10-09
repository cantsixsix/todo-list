/**
 * Layout raiz: monta os "providers" (tema, login, dados, avisos) e decide
 * quais telas existem conforme o usuário está ou não logado.
 */
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SetupNeeded } from '@/components/SetupNeeded';
import { SnackbarProvider } from '@/components/Snackbar';
import { isSupabaseConfigured } from '@/lib/supabase';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { DataProvider } from '@/providers/DataProvider';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        {isSupabaseConfigured ? (
          <SnackbarProvider>
            <AuthProvider>
              <DataProvider>
                <RootNavigator />
              </DataProvider>
            </AuthProvider>
          </SnackbarProvider>
        ) : (
          <SetupNeeded />
        )}
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const { session, loading } = useAuth();
  const { colors, scheme } = useTheme();

  // Pinta o fundo nativo (evita "flash" branco no modo escuro).
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.background).catch(() => {});
  }, [colors.background]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const loggedIn = session !== null;

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        {/* Telas só para quem está logado */}
        <Stack.Protected guard={loggedIn}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="task/[id]" options={{ title: 'Tarefa', presentation: 'modal' }} />
          <Stack.Screen name="list/[id]" options={{ title: '' }} />
          <Stack.Screen name="reset-password" options={{ title: 'Nova senha' }} />
        </Stack.Protected>

        {/* Telas só para quem NÃO está logado */}
        <Stack.Protected guard={!loggedIn}>
          <Stack.Screen name="sign-in" options={{ headerShown: false }} />
        </Stack.Protected>

        {/* Pública: a Play Store exige um link para a política de privacidade */}
        <Stack.Screen name="privacy" options={{ title: 'Privacidade' }} />
      </Stack>
    </>
  );
}
