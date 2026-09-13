import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { listGazettes } from '../lib/api';
import { theme, radius, spacing } from '../lib/theme';

export default function GazettesScreen() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listGazettes();
      if (Array.isArray(data)) setItems(data);
      else if (data?.results) setItems(data.results);
      else if (data?.items) setItems(data.items);
      else setItems([]);
    } catch (e: any) {
      setError(e?.message || 'Could not load gazettes.');
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
        <Text style={styles.title}>Kenya Gazette</Text>
        <View style={styles.back} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.accent} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item, idx) => String(item.id || idx)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="newspaper-outline" size={36} color={theme.textMuted} />
              <Text style={styles.emptyTitle}>No gazettes</Text>
              <Text style={styles.emptyText}>
                {error || 'Gazette notices will appear here when the API provides them.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.date}>
                {item.date || item.published_at || item.gazette_date || 'Notice'}
              </Text>
              <Text style={styles.cardTitle} numberOfLines={3}>
                {item.title || item.name || item.subject || 'Untitled notice'}
              </Text>
              {!!(item.excerpt || item.description) && (
                <Text style={styles.excerpt} numberOfLines={3}>
                  {item.excerpt || item.description}
                </Text>
              )}
              {!!(item.status === 'placeholder' || item.is_demo) && (
                <Text style={styles.demoTag}>Sample data</Text>
              )}
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
  title: { color: theme.text, fontSize: 20, fontWeight: '700' },
  list: { padding: spacing.lg, paddingTop: 0 },
  card: {
    backgroundColor: theme.bgCard,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 10,
  },
  date: { color: theme.accent, fontSize: 12, fontWeight: '700' },
  cardTitle: { color: theme.text, fontSize: 15, fontWeight: '700', marginTop: 6, lineHeight: 20 },
  excerpt: { color: theme.textSecondary, fontSize: 13, marginTop: 8, lineHeight: 18 },
  demoTag: {
    color: theme.warning,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 10,
    textTransform: 'uppercase',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { color: theme.text, fontSize: 16, fontWeight: '700', marginTop: 12 },
  emptyText: { color: theme.textMuted, fontSize: 13, textAlign: 'center', marginTop: 6, lineHeight: 18 },
});
