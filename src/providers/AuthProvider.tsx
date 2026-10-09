/**
 * Guarda a sessão de login e expõe ações de autenticação para as telas.
 */
import type { Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { deleteMyAccount } from '@/lib/api';
import { supabase } from '@/lib/supabase';

interface AuthValue {
  session: Session | null;
  /** true até sabermos se existe uma sessão salva no aparelho. */
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  /** Retorna true se o Supabase pediu confirmação por e-mail. */
  signUp: (email: string, password: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

/** Para onde o link do e-mail leva o usuário (site na web, o próprio app no celular). */
function redirectUrl(path: string) {
  return Platform.OS === 'web' ? `${window.location.origin}/${path}` : Linking.createURL(path);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .finally(() => setLoading(false));

    // Avisa o app sempre que a pessoa entra, sai ou o token é renovado.
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      session,
      loading,
      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error(translateAuthError(error.message));
      },
      async signUp(email, password) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirectUrl('') },
        });
        if (error) throw new Error(translateAuthError(error.message));
        return data.session === null;
      },
      async resetPassword(email) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: redirectUrl('reset-password'),
        });
        if (error) throw new Error(translateAuthError(error.message));
      },
      async updatePassword(password) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw new Error(translateAuthError(error.message));
      },
      async signOut() {
        await supabase.auth.signOut();
      },
      async deleteAccount() {
        await deleteMyAccount();
        // A sessão local ainda existe; limpamos só neste aparelho.
        await supabase.auth.signOut({ scope: 'local' });
      },
    }),
    [session, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>');
  return ctx;
}

/** Mensagens do Supabase vêm em inglês; traduzimos as mais comuns. */
export function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (m.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar (veja sua caixa de entrada).';
  if (m.includes('already registered')) return 'Já existe uma conta com este e-mail.';
  if (m.includes('password should be at least')) return 'A senha precisa ter pelo menos 6 caracteres.';
  if (m.includes('unable to validate email') || m.includes('invalid format')) return 'E-mail inválido.';
  if (m.includes('rate limit') || m.includes('only request this after')) return 'Muitas tentativas. Aguarde um pouco e tente de novo.';
  if (m.includes('network') || m.includes('fetch')) return 'Sem conexão com a internet.';
  return message;
}
