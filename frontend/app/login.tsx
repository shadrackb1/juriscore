import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../lib/auth';
import { theme } from '../lib/theme';

type Mode = 'login' | 'signup';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [university, setUniversity] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError('Enter your email and password.');
      return;
    }
    if (mode === 'signup' && !name.trim()) {
      setError('Enter your name to create an account.');
      return;
    }
    if (mode === 'signup' && password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(email.trim(), password);
      } else {
        await signUp(name.trim(), email.trim(), password, university.trim() || undefined);
      }
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e?.message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brandBlock}>
            <View style={styles.logoMark}>
              <Ionicons name="scale" size={28} color="#fff" />
            </View>
            <Text style={styles.brand}>Juriscore</Text>
            <Text style={styles.tagline}>
              Case law, statutes, and research tools for Kenyan law students.
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.modeRow}>
              <TouchableOpacity
                style={[styles.modeBtn, mode === 'login' && styles.modeBtnActive]}
                onPress={() => {
                  setMode('login');
                  setError(null);
                }}
                disabled={loading}
              >
                <Text style={[styles.modeText, mode === 'login' && styles.modeTextActive]}>
                  Sign in
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeBtn, mode === 'signup' && styles.modeBtnActive]}
                onPress={() => {
                  setMode('signup');
                  setError(null);
                }}
                disabled={loading}
              >
                <Text style={[styles.modeText, mode === 'signup' && styles.modeTextActive]}>
                  Create account
                </Text>
              </TouchableOpacity>
            </View>

            {mode === 'signup' && (
              <Field
                label="Full name"
                value={name}
                onChangeText={setName}
                placeholder="Jane Mwangi"
                autoCapitalize="words"
                icon="person-outline"
              />
            )}

            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@law.ac.ke"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              icon="mail-outline"
            />

            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              icon="lock-closed-outline"
              trailing={
                <TouchableOpacity
                  onPress={() => setShowPassword((s) => !s)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={theme.textMuted}
                  />
                </TouchableOpacity>
              }
            />

            {mode === 'signup' && (
              <Field
                label="University (optional)"
                value={university}
                onChangeText={setUniversity}
                placeholder="e.g. University of Nairobi"
                autoCapitalize="words"
                icon="school-outline"
              />
            )}

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={theme.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              accessibilityRole="button"
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>
                  {mode === 'login' ? 'Sign in' : 'Create account'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.footerNote}>
            Research Kenyan case law without wading through raw PDFs.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  icon,
  trailing,
  ...input
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  trailing?: React.ReactNode;
} & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <Ionicons name={icon} size={18} color={theme.textMuted} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholderTextColor={theme.textMuted}
          selectionColor={theme.accent}
          {...input}
        />
        {trailing}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  brandBlock: { alignItems: 'center', marginBottom: 28 },
  logoMark: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  brand: {
    color: theme.text,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  tagline: {
    color: theme.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    maxWidth: 280,
  },
  card: {
    backgroundColor: theme.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 20,
  },
  modeRow: {
    flexDirection: 'row',
    backgroundColor: theme.inputBg,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  modeBtnActive: { backgroundColor: theme.primaryLight },
  modeText: { color: theme.textSecondary, fontSize: 13, fontWeight: '600' },
  modeTextActive: { color: '#fff' },
  field: { marginBottom: 14 },
  label: {
    color: theme.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.inputBg,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1,
    color: theme.text,
    fontSize: 15,
    paddingVertical: 12,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  errorText: { color: theme.error, fontSize: 13, flex: 1 },
  submitBtn: {
    backgroundColor: theme.primaryLight,
    borderRadius: 12,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  footerNote: {
    color: theme.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
  },
});
