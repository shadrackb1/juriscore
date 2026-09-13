import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { API_BASE } from '../../lib/api';
import { theme, radius, spacing } from '../../lib/theme';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const onSignOut = () => {
    Alert.alert('Sign out', 'You will need to sign in again to sync notebooks and bookmarks.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.name || 'U')
                .split(' ')
                .map((p) => p[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{user?.name || 'Guest'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          {!!user?.university && <Text style={styles.university}>{user.university}</Text>}
        </View>

        <Text style={styles.section}>Your library</Text>
        <SectionLink
          icon="bookmark-outline"
          label="Bookmarks"
          onPress={() => router.push('/bookmarks')}
        />
        <SectionLink
          icon="layers-outline"
          label="Flashcards"
          onPress={() => router.push('/flashcards')}
        />
        <SectionLink
          icon="book-outline"
          label="Notebook"
          onPress={() => router.push('/(tabs)/notebook')}
        />
        <SectionLink
          icon="document-text-outline"
          label="Constitution"
          onPress={() => router.push('/constitution')}
        />
        <SectionLink
          icon="newspaper-outline"
          label="Gazettes"
          onPress={() => router.push('/gazettes')}
        />

        <Text style={styles.section}>App</Text>
        <View style={styles.infoRow}>
          <Ionicons name="server-outline" size={18} color={theme.textMuted} />
          <View style={styles.infoBody}>
            <Text style={styles.infoLabel}>API base</Text>
            <Text style={styles.infoValue}>{API_BASE}</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="information-circle-outline" size={18} color={theme.textMuted} />
          <View style={styles.infoBody}>
            <Text style={styles.infoLabel}>About</Text>
            <Text style={styles.infoValue}>
              Legal research for Kenyan law students — cases, statutes, and study tools.
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.signOut} onPress={onSignOut}>
          <Ionicons name="log-out-outline" size={18} color={theme.error} />
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionLink({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.link} onPress={onPress}>
      <Ionicons name={icon} size={18} color={theme.accent} />
      <Text style={styles.linkLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  scroll: { padding: spacing.lg, paddingBottom: 40 },
  hero: { alignItems: 'center', paddingVertical: 20, marginBottom: 12 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: '700' },
  name: { color: theme.text, fontSize: 22, fontWeight: '700' },
  email: { color: theme.textSecondary, fontSize: 14, marginTop: 4 },
  university: { color: theme.textMuted, fontSize: 13, marginTop: 4 },
  section: {
    color: theme.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 18,
    marginBottom: 8,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.bgCard,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    minHeight: 48,
    marginBottom: 8,
  },
  linkLabel: { flex: 1, color: theme.text, fontSize: 15, fontWeight: '600' },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: theme.bgCard,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 8,
  },
  infoBody: { flex: 1 },
  infoLabel: { color: theme.text, fontSize: 14, fontWeight: '600' },
  infoValue: { color: theme.textMuted, fontSize: 12, marginTop: 4, lineHeight: 16 },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 28,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.4)',
    borderRadius: radius.md,
    minHeight: 48,
  },
  signOutText: { color: theme.error, fontSize: 15, fontWeight: '700' },
});
