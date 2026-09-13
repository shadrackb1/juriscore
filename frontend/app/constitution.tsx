import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { searchConstitution, getConstitutionChapters } from '../lib/api';
import { theme, radius, spacing } from '../lib/theme';

interface ArticleItem {
  article_num?: number;
  title?: string;
  content?: string;
  chapter?: string;
  id?: string;
  [key: string]: any;
}

export default function ConstitutionScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<ArticleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (q?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = q?.trim() ? await searchConstitution(q.trim()) : await getConstitutionChapters();
      if (Array.isArray(data)) {
        setItems(data);
      } else if (data?.results) {
        setItems(data.results);
      } else if (data?.chapters) {
        const flat: ArticleItem[] = [];
        for (const ch of data.chapters) {
          if (ch.articles) {
            for (const a of ch.articles) {
              flat.push({ ...a, chapter: ch.title });
            }
          } else {
            flat.push(ch);
          }
        }
        setItems(flat);
      } else {
        setItems([]);
      }
    } catch (e: any) {
      setError(e?.message || 'Could not load constitution.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Constitution of Kenya</Text>
        <View style={styles.back} />
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={theme.textMuted} />
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="Search articles and rights…"
          placeholderTextColor={theme.textMuted}
          selectionColor={theme.accent}
          returnKeyType="search"
          onSubmitEditing={() => load(query)}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.accent} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={32} color={theme.error} />
          <Text style={styles.emptyTitle}>Could not load</Text>
          <Text style={styles.emptyText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item, idx) => String(item.id || item.article_num || idx)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyTitle}>No matches</Text>
              <Text style={styles.emptyText}>Try a different article number or keyword.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              {!!item.chapter && <Text style={styles.chapter}>{item.chapter}</Text>}
              <Text style={styles.articleTitle}>
                {item.article_num != null ? `Article ${item.article_num}` : ''}
                {item.title ? `${item.article_num != null ? ' — ' : ''}${item.title}` : item.title || 'Provision'}
              </Text>
              <Text style={styles.content} numberOfLines={8}>
                {item.content || item.text || item.excerpt || 'Text not available in this build.'}
              </Text>
            </View>
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
  title: { color: theme.text, fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: theme.inputBg,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    minHeight: 46,
  },
  input: { flex: 1, color: theme.text, fontSize: 15, paddingVertical: 10 },
  list: { padding: spacing.lg, paddingTop: 0 },
  card: {
    backgroundColor: theme.bgCard,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 10,
  },
  chapter: {
    color: theme.accent,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  articleTitle: { color: theme.text, fontSize: 15, fontWeight: '700', lineHeight: 20 },
  content: { color: theme.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { color: theme.text, fontSize: 16, fontWeight: '700', marginTop: 10 },
  emptyText: { color: theme.textMuted, fontSize: 13, textAlign: 'center', marginTop: 6 },
});
