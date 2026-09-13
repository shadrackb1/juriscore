import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  searchCases,
  createBookmark,
  SearchResult,
} from '../../lib/api';
import { theme, radius, spacing } from '../../lib/theme';

const FILTERS = [
  { label: 'All', value: '' },
  { label: 'Cases', value: 'case' },
  { label: 'Statutes', value: 'statute' },
  { label: 'Digests', value: 'case_digest' },
  { label: 'Reports', value: 'law_report' },
  { label: 'Gazettes', value: 'gazette' },
];

export default function SearchScreen() {
  const params = useLocalSearchParams<{ q?: string; filter?: string }>();
  const router = useRouter();
  const [query, setQuery] = useState(params.q || '');
  const [filter, setFilter] = useState(params.filter || '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});

  const runSearch = useCallback(async (q: string, f: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const res = await searchCases(q.trim(), {
        doc_type: f || undefined,
        limit: 30,
      });
      setResults(res.results || []);
    } catch (e: any) {
      setError(e?.message || 'Search failed. Check that the API is running.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (params.q) {
      setQuery(params.q);
      runSearch(params.q, params.filter || '');
    }
  }, [params.q, params.filter]);

  const onBookmark = async (item: SearchResult) => {
    const key = item.id || item.url || item.title;
    setSavingId(key);
    try {
      await createBookmark({
        resource_type: item.doc_type === 'statute' ? 'statutes' : 'cases',
        resource_id: key,
        title: item.title,
        metadata: {
          citation: item.citation,
          court: item.court,
          year: item.year,
          url: item.url || item.search_url,
        },
      });
      setSavedIds((prev) => ({ ...prev, [key]: true }));
    } catch {
      setError('Could not save bookmark. Sign in and try again.');
    } finally {
      setSavingId(null);
    }
  };

  const renderItem = ({ item }: { item: SearchResult }) => {
    const key = item.id || item.url || item.title;
    const saved = savedIds[key];
    return (
      <TouchableOpacity
        style={styles.resultCard}
        onPress={() => {
          if (item.url || item.search_url) {
            router.push({
              pathname: '/document',
              params: {
                url: item.url || item.search_url,
                title: item.title,
              },
            } as any);
          }
        }}
      >
        <View style={styles.resultTop}>
          <Text style={styles.docType}>
            {(item.doc_type || 'document').replace(/_/g, ' ')}
          </Text>
          {item.court ? <Text style={styles.court}>{item.court}</Text> : null}
          {item.year ? <Text style={styles.year}>{item.year}</Text> : null}
        </View>
        <Text style={styles.resultTitle}>{item.title}</Text>
        {!!item.citation && <Text style={styles.citation}>{item.citation}</Text>}
        <Text style={styles.excerpt} numberOfLines={4}>
          {item.excerpt}
        </Text>
        <View style={styles.resultActions}>
          {item.source ? <Text style={styles.source}>{item.source}</Text> : <View />}
          <TouchableOpacity
            onPress={() => onBookmark(item)}
            disabled={savingId === key || saved}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={18}
              color={saved ? theme.accent : theme.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Search</Text>
          <TouchableOpacity onPress={() => router.push('/constitution')}>
            <Text style={styles.headerLink}>Constitution</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.inputWrap}>
            <Ionicons name="search" size={18} color={theme.textMuted} />
            <TextInput
              style={styles.input}
              value={query}
              onChangeText={setQuery}
              placeholder="Cases, statutes, legal concepts…"
              placeholderTextColor={theme.textMuted}
              selectionColor={theme.accent}
              returnKeyType="search"
              onSubmitEditing={() => runSearch(query, filter)}
              autoCorrect={false}
            />
            {!!query && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={18} color={theme.textMuted} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={styles.goBtn}
            onPress={() => runSearch(query, filter)}
            disabled={loading || !query.trim()}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        <FlatList
          horizontal
          data={FILTERS}
          keyExtractor={(item) => item.value || 'all'}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          style={styles.filterList}
          renderItem={({ item }) => {
            const active = filter === item.value;
            return (
              <TouchableOpacity
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => {
                  setFilter(item.value);
                  if (query.trim()) runSearch(query, item.value);
                }}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={theme.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {!searched && !loading ? (
          <View style={styles.emptyState}>
            <Ionicons name="search" size={36} color={theme.textMuted} />
            <Text style={styles.emptyTitle}>Search Kenyan law</Text>
            <Text style={styles.emptyText}>
              Find cases, statutes, digests, and law reports from local and live sources.
            </Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item, idx) => `${item.id || item.url || idx}`}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              loading ? null : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>No results</Text>
                  <Text style={styles.emptyText}>Try broader terms or clear filters.</Text>
                </View>
              )
            }
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  title: { color: theme.text, fontSize: 24, fontWeight: '700' },
  headerLink: { color: theme.accent, fontSize: 14, fontWeight: '600' },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.inputBg,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  input: {
    flex: 1,
    color: theme.text,
    fontSize: 15,
    paddingVertical: 12,
  },
  goBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: theme.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterList: { flexGrow: 0, marginBottom: spacing.sm },
  filterRow: { paddingHorizontal: spacing.lg, gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: theme.chipBg,
    borderWidth: 1,
    borderColor: theme.border,
  },
  filterChipActive: {
    backgroundColor: theme.accentSoft,
    borderColor: theme.accent,
  },
  filterText: { color: theme.textSecondary, fontSize: 13, fontWeight: '600' },
  filterTextActive: { color: theme.accent },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: spacing.lg,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: radius.sm,
    padding: 10,
    marginBottom: spacing.sm,
  },
  errorText: { color: theme.error, fontSize: 13, flex: 1 },
  list: { padding: spacing.lg, paddingTop: spacing.sm },
  resultCard: {
    backgroundColor: theme.bgCard,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 10,
  },
  resultTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' },
  docType: {
    color: theme.accent,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  court: { color: theme.textMuted, fontSize: 12 },
  year: { color: theme.textMuted, fontSize: 12 },
  resultTitle: { color: theme.text, fontSize: 15, fontWeight: '700', lineHeight: 20 },
  citation: { color: theme.textSecondary, fontSize: 12, marginTop: 4 },
  excerpt: { color: theme.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 8 },
  resultActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  source: { color: theme.textMuted, fontSize: 11, fontWeight: '600' },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  emptyTitle: { color: theme.text, fontSize: 16, fontWeight: '700', marginTop: 12 },
  emptyText: {
    color: theme.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});
