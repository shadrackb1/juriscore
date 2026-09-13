import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { listFlashcardDecks, createFlashcardDeck, FlashcardDeck } from '../../lib/api';
import { theme, radius, spacing } from '../../lib/theme';

export default function FlashcardsScreen() {
  const router = useRouter();
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listFlashcardDecks();
      setDecks(data);
    } catch (e: any) {
      setError(e?.message || 'Could not load decks.');
      setDecks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const createDeck = async () => {
    if (!title.trim()) return;
    setCreating(true);
    try {
      const deck = await createFlashcardDeck(title.trim(), subject.trim() || undefined);
      setDecks((prev) => [deck, ...prev]);
      setTitle('');
      setSubject('');
      setModalOpen(false);
      router.push({ pathname: '/flashcards/[deckId]', params: { deckId: deck.id, title: deck.title } } as any);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not create deck.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Flashcards</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalOpen(true)}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.accent} />
        </View>
      ) : (
        <FlatList
          data={decks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="layers-outline" size={36} color={theme.textMuted} />
              <Text style={styles.emptyTitle}>No decks yet</Text>
              <Text style={styles.emptyText}>
                Build flashcards for cases, statutes, and doctrine, then review with spaced repetition.
              </Text>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.deck}
              onPress={() =>
                router.push({
                  pathname: '/flashcards/[deckId]',
                  params: { deckId: item.id, title: item.title },
                } as any)
              }
            >
              <View style={styles.deckIcon}>
                <Ionicons name="layers" size={20} color={theme.accent} />
              </View>
              <View style={styles.deckBody}>
                <Text style={styles.deckTitle}>{item.title}</Text>
                <Text style={styles.deckMeta}>{item.subject || 'General'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
            </TouchableOpacity>
          )}
        />
      )}

      <Modal visible={modalOpen} transparent animationType="fade" onRequestClose={() => setModalOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>New deck</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Deck title"
              placeholderTextColor={theme.textMuted}
              autoFocus
            />
            <TextInput
              style={styles.input}
              value={subject}
              onChangeText={setSubject}
              placeholder="Subject (optional)"
              placeholderTextColor={theme.textMuted}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setModalOpen(false)}>
                <Text style={styles.cancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.create, (!title.trim() || creating) && styles.disabled]}
                onPress={createDeck}
                disabled={!title.trim() || creating}
              >
                {creating ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.createText}>Create</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: theme.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { padding: spacing.lg, paddingTop: 0 },
  deck: {
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
  deckIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: theme.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deckBody: { flex: 1 },
  deckTitle: { color: theme.text, fontSize: 15, fontWeight: '700' },
  deckMeta: { color: theme.textMuted, fontSize: 12, marginTop: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { color: theme.text, fontSize: 16, fontWeight: '700', marginTop: 12 },
  emptyText: { color: theme.textMuted, fontSize: 13, textAlign: 'center', marginTop: 6, lineHeight: 18 },
  errorText: { color: theme.error, fontSize: 12, marginTop: 12, textAlign: 'center' },
  overlay: {
    flex: 1,
    backgroundColor: theme.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modal: {
    width: '100%',
    backgroundColor: theme.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 20,
  },
  modalTitle: { color: theme.text, fontSize: 18, fontWeight: '700', marginBottom: 14 },
  input: {
    backgroundColor: theme.inputBg,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radius.md,
    color: theme.text,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 12,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 16 },
  cancel: { color: theme.textSecondary, fontWeight: '600', padding: 8 },
  create: {
    backgroundColor: theme.primaryLight,
    borderRadius: radius.sm,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 90,
    alignItems: 'center',
  },
  createText: { color: '#fff', fontWeight: '700' },
  disabled: { opacity: 0.5 },
});
