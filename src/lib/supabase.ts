/**
 * Cliente do Supabase (banco Postgres + login + tempo real).
 *
 * As chaves vêm de variáveis de ambiente EXPO_PUBLIC_* (arquivo .env.local).
 * A chave "anon" é pública por definição: quem protege os dados são as
 * políticas de Row Level Security definidas em supabase/migrations.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** false quando o .env.local ainda não foi preenchido — o app mostra instruções. */
export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = createClient(
  // Valores de reserva só para o app abrir e mostrar a tela de configuração.
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder',
  {
    auth: {
      // No celular a sessão fica no AsyncStorage; na web, no localStorage (padrão).
      ...(Platform.OS !== 'web' ? { storage: AsyncStorage, lock: processLock } : {}),
      autoRefreshToken: true,
      persistSession: true,
      // Na web, lê o token que vem na URL depois de clicar no link de e-mail.
      detectSessionInUrl: Platform.OS === 'web',
    },
  },
);

// No celular, só renova o token enquanto o app está em primeiro plano.
// (Recomendação oficial do Supabase para React Native.)
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
