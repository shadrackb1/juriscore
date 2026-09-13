import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { listBookmarks, deleteBookmark, BookmarkItem } from '../lib/api';
import { theme, radius, spacing } from '../lib/theme';

const TABS = [
  { label: 'All', value: '' },
  { label: 'Cases', value: 'cases' },
  { label: 'Statutes', value: 'statutes' },
];

export default function BookmarksScreen() {
  const router = useRouter();
  const [tab, setTab] = useState('');
  const [items, setItems] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listBookmarks(tab || undefined);
      setItems(data);
    } catch (e: any) {
      setError(e?.message || 'Could not load bookmarks.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const remove = (item: BookmarkItem) => {
    Alert.alert('Remove bookmark', item.title, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteBookmark(item.id);
            setItems((prev) => prev.filter((b) => b.id !== item.id));
          } catch (e: any) {
            Alert.alert('Error', e?.message || 'Could not remove bookmark.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Bookmarks</Text>
        <View style={styles.back} />
      </View>

      <View style={styles.tabs}>
        {TABS.map((t) => {
          const active = tab === t.value;
          return (
            <TouchableOpacity
              key={t.value || 'all'}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setTab(t.value)}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.accent} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="bookmark-outline" size={36} color={theme.textMuted} />
              <Text style={styles.emptyTitle}>No bookmarks</Text>
              <Text style={styles.emptyText}>
                Save cases from search results to keep them here.
              </Text>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => {
                const url = item.metadata?.url;
                if (url) {
                  router.push({ pathname: '/document', params: { url, title: item.title } } as any);
                }
              }}
            >
              <View style={styles.cardBody}>
                <Text style={styles.type}>{item.resource_type}</Text>
                <Text style={styles.cardTitle}>{item.title}</Text>
                {!!item.metadata?.citation && (
                  <Text style={styles.meta}>{item.metadata.citation}</Text>
                )}
              </View>
              <TouchableOpacity onPress={() => remove(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="trash-outline" size={18} color={theme.textMuted} />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { color: theme.text, fontSize: 20, fontWeight: '700' },
  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: theme.chipBg,
    borderWidth: 1,
    borderColor: theme.border,
  },
  tabActive: { backgroundColor: theme.accentSoft, borderColor: theme.accent },
  tabText: { color: theme.textSecondary, fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: theme.accent },
  list: { padding: spacing.lg, paddingTop: 0 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.bgCard,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 10,
  },
  cardBody: { flex: 1 },
  type: {
    color: theme.accent,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardTitle: { color: theme.text, fontSize: 14, fontWeight: '700', marginTop: 4, lineHeight: 19 },
  meta: { color: theme.textMuted, fontSize: 12, marginTop: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { color: theme.text, fontSize: 16, fontWeight: '700', marginTop: 12 },
  emptyText: { color: theme.textMuted, fontSize: 13, textAlign: 'center', marginTop: 6, lineHeight: 18 },
  errorText: { color: theme.error, fontSize: 12, marginTop: 12, textAlign: 'center' },
});
