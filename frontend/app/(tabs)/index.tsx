import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { theme, radius, spacing } from '../../lib/theme';
import { searchCases, listNotebookFolders, healthCheck } from '../../lib/api';

const BROWSE = [
  { id: 'constitution', title: 'Constitution', subtitle: 'Bill of Rights & chapters', icon: 'document-text', route: '/constitution' as const },
  { id: 'legislation', title: 'Legislation', subtitle: 'Acts & statutes', icon: 'library', route: '/(tabs)/search' as const, params: { filter: 'statute' } },
  { id: 'gazettes', title: 'Gazettes', subtitle: 'Kenya Gazette notices', icon: 'newspaper', route: '/gazettes' as const },
  { id: 'flashcards', title: 'Flashcards', subtitle: 'Spaced repetition decks', icon: 'layers', route: '/flashcards' as const },
  { id: 'bookmarks', title: 'Bookmarks', subtitle: 'Saved cases & notes', icon: 'bookmark', route: '/bookmarks' as const },
  { id: 'cases', title: 'Case law', subtitle: 'Search judgments', icon: 'scale', route: '/(tabs)/search' as const, params: { filter: 'case' } },
];

const QUICK = [
  'Bill of Rights',
  'Land law Kenya',
  'Criminal procedure',
  'Employment Act',
  'Judicial review',
];

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [ready, setReady] = useState<boolean | null>(null);
  const [recent, setRecent] = useState<{ title: string; citation?: string; id: string }[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [health, sample] = await Promise.all([
        healthCheck(),
        searchCases('constitution', { limit: 4 }),
      ]);
      setReady(!!health);
      setRecent(
        (sample?.results || []).slice(0, 4).map((r) => ({
          id: r.id || r.title,
          title: r.title,
          citation: r.citation,
        })),
      );
    } catch {
      setReady(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>Juriscore</Text>
            <Text style={styles.greeting}>Hello, {firstName}</Text>
          </View>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push('/bookmarks')}
            accessibilityLabel="Bookmarks"
          >
            <Ionicons name="bookmark-outline" size={20} color={theme.text} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => router.push('/(tabs)/search')}
          accessibilityRole="button"
        >
          <Ionicons name="search" size={18} color={theme.textMuted} />
          <Text style={styles.searchPlaceholder}>Search case law, statutes, concepts…</Text>
        </TouchableOpacity>

        {ready === false && (
          <View style={styles.banner}>
            <Ionicons name="cloud-offline-outline" size={16} color={theme.warning} />
            <Text style={styles.bannerText}>
              API offline. Start the backend with uvicorn api.backend.main:app
            </Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Browse</Text>
        <View style={styles.grid}>
          {BROWSE.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: item.route,
                  params: item.params,
                } as any)
              }
            >
              <View style={styles.cardIcon}>
                <Ionicons name={item.icon as any} size={20} color={theme.accent} />
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSub}>{item.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Quick searches</Text>
        <View style={styles.chips}>
          {QUICK.map((q) => (
            <TouchableOpacity
              key={q}
              style={styles.chip}
              onPress={() => router.push({ pathname: '/(tabs)/search', params: { q } } as any)}
            >
              <Text style={styles.chipText}>{q}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>From the corpus</Text>
          {ready === true ? null : ready === null ? <ActivityIndicator size="small" color={theme.accent} /> : null}
        </View>
        {recent.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="documents-outline" size={28} color={theme.textMuted} />
            <Text style={styles.emptyTitle}>No sample results yet</Text>
            <Text style={styles.emptyText}>Run a search once the API is online.</Text>
          </View>
        ) : (
          recent.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.listItem}
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/search',
                  params: { q: item.title },
                } as any)
              }
            >
              <View style={styles.listIcon}>
                <Ionicons name="document-outline" size={16} color={theme.accent} />
              </View>
              <View style={styles.listBody}>
                <Text style={styles.listTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                {!!item.citation && <Text style={styles.listMeta}>{item.citation}</Text>}
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  scroll: { padding: spacing.lg, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  eyebrow: {
    color: theme.accent,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  greeting: { color: theme.text, fontSize: 26, fontWeight: '700', marginTop: 4 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: theme.bgCard,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.inputBg,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    minHeight: 48,
    marginBottom: spacing.lg,
  },
  searchPlaceholder: { color: theme.textMuted, fontSize: 14 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderRadius: radius.sm,
    padding: 10,
    marginBottom: spacing.lg,
  },
  bannerText: { color: theme.warning, fontSize: 12, flex: 1, lineHeight: 16 },
  sectionTitle: {
    color: theme.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: spacing.xl,
  },
  card: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: theme.bgCard,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radius.md,
    padding: 14,
    minHeight: 110,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: theme.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  cardTitle: { color: theme.text, fontSize: 15, fontWeight: '700' },
  cardSub: { color: theme.textMuted, fontSize: 12, marginTop: 4, lineHeight: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.xl },
  chip: {
    backgroundColor: theme.chipBg,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: { color: theme.textSecondary, fontSize: 13, fontWeight: '600' },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.bgCard,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 8,
  },
  listIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: theme.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listBody: { flex: 1 },
  listTitle: { color: theme.text, fontSize: 14, fontWeight: '600', lineHeight: 18 },
  listMeta: { color: theme.textMuted, fontSize: 12, marginTop: 2 },
  empty: {
    alignItems: 'center',
    padding: 28,
    backgroundColor: theme.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: theme.border,
  },
  emptyTitle: { color: theme.text, fontWeight: '700', marginTop: 10 },
  emptyText: { color: theme.textMuted, fontSize: 13, marginTop: 4, textAlign: 'center' },
});
