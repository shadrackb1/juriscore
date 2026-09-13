import React, { useCallback, useEffect, useState } from 'react';
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
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { listDeckCards, addFlashcard, Flashcard } from '../../lib/api';
import { theme, radius, spacing } from '../../lib/theme';

export default function DeckStudyScreen() {
  const { deckId, title } = useLocalSearchParams<{ deckId: string; title?: string }>();
  const router = useRouter();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [studyMode, setStudyMode] = useState(false);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!deckId) return;
    setLoading(true);
    try {
      const data = await listDeckCards(deckId);
      setCards(data);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not load cards.');
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, [deckId]);

  useEffect(() => {
    load();
  }, [load]);

  const addCard = async () => {
    if (!deckId || !front.trim() || !back.trim()) return;
    setSaving(true);
    try {
      const card = await addFlashcard(deckId, front.trim(), back.trim());
      setCards((prev) => [...prev, card]);
      setFront('');
      setBack('');
      setModalOpen(false);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not add card.');
    } finally {
      setSaving(false);
    }
  };

  const current = cards[index];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {title || 'Deck'}
        </Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalOpen(true)}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.accent} />
        </View>
      ) : studyMode && current ? (
        <View style={styles.studyWrap}>
          <Text style={styles.progress}>
            {index + 1} of {cards.length}
          </Text>
          <View style={styles.cardFace}>
            <Text style={styles.cardLabel}>{revealed ? 'Answer' : 'Prompt'}</Text>
            <Text style={styles.cardText}>{revealed ? current.back : current.front}</Text>
          </View>
          {!revealed ? (
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setRevealed(true)}>
              <Text style={styles.primaryText}>Show answer</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.gradeRow}>
              <TouchableOpacity
                style={styles.gradeBtn}
                onPress={() => {
                  setRevealed(false);
                  setIndex((i) => Math.min(i + 1, cards.length - 1));
                }}
              >
                <Text style={styles.gradeText}>Again</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.gradeBtn, styles.gradeGood]}
                onPress={() => {
                  setRevealed(false);
                  if (index + 1 >= cards.length) setStudyMode(false);
                  else setIndex((i) => i + 1);
                }}
              >
                <Text style={styles.gradeText}>Got it</Text>
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStudyMode(false)}>
            <Text style={styles.secondaryText}>Exit study</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={cards}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            cards.length > 0 ? (
              <TouchableOpacity style={styles.primaryBtn} onPress={() => { setIndex(0); setRevealed(false); setStudyMode(true); }}>
                <Ionicons name="play" size={16} color="#fff" />
                <Text style={styles.primaryText}>Study deck</Text>
              </TouchableOpacity>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="documents-outline" size={36} color={theme.textMuted} />
              <Text style={styles.emptyTitle}>No cards yet</Text>
              <Text style={styles.emptyText}>Add prompts and answers to start reviewing.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.cardItem}>
              <Text style={styles.cardFront}>{item.front}</Text>
              <Text style={styles.cardBack}>{item.back}</Text>
            </View>
          )}
        />
      )}

      <Modal visible={modalOpen} transparent animationType="fade" onRequestClose={() => setModalOpen(false)}>
        <View style={styles.overlay}>
          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modal}>
            <Text style={styles.modalTitle}>Add card</Text>
            <TextInput
              style={styles.input}
              value={front}
              onChangeText={setFront}
              placeholder="Front / prompt"
              placeholderTextColor={theme.textMuted}
              multiline
            />
            <TextInput
              style={[styles.input, styles.inputTall]}
              value={back}
              onChangeText={setBack}
              placeholder="Back / answer"
              placeholderTextColor={theme.textMuted}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setModalOpen(false)}>
                <Text style={styles.cancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.create, (!front.trim() || !back.trim() || saving) && styles.disabled]}
                onPress={addCard}
                disabled={!front.trim() || !back.trim() || saving}
              >
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.createText}>Add</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
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
    gap: 8,
  },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { color: theme.text, fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center' },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: theme.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { padding: spacing.lg, paddingTop: 0, gap: 10 },
  cardItem: {
    backgroundColor: theme.bgCard,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radius.md,
    padding: 14,
  },
  cardFront: { color: theme.text, fontSize: 15, fontWeight: '700', lineHeight: 20 },
  cardBack: { color: theme.textSecondary, fontSize: 13, marginTop: 8, lineHeight: 18 },
  studyWrap: { flex: 1, padding: spacing.lg },
  progress: { color: theme.textMuted, textAlign: 'center', marginBottom: 16, fontWeight: '600' },
  cardFace: {
    flex: 1,
    backgroundColor: theme.bgCard,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radius.lg,
    padding: 24,
    marginBottom: 16,
    justifyContent: 'center',
  },
  cardLabel: {
    color: theme.accent,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  cardText: { color: theme.text, fontSize: 20, fontWeight: '600', lineHeight: 28 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.primaryLight,
    borderRadius: radius.md,
    minHeight: 48,
    marginBottom: 10,
  },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  gradeRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  gradeBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.bgCard,
  },
  gradeGood: { backgroundColor: theme.primaryLight, borderColor: theme.primaryLight },
  gradeText: { color: theme.text, fontWeight: '700' },
  secondaryBtn: { alignItems: 'center', padding: 12 },
  secondaryText: { color: theme.textSecondary, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { color: theme.text, fontSize: 16, fontWeight: '700', marginTop: 12 },
  emptyText: { color: theme.textMuted, fontSize: 13, textAlign: 'center', marginTop: 6 },
  overlay: {
    flex: 1,
    backgroundColor: theme.overlay,
    justifyContent: 'center',
    padding: 20,
  },
  modalScroll: { maxHeight: '80%' },
  modal: {
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
    minHeight: 48,
    textAlignVertical: 'top',
  },
  inputTall: { minHeight: 100 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 16 },
  cancel: { color: theme.textSecondary, fontWeight: '600', padding: 8 },
  create: {
    backgroundColor: theme.primaryLight,
    borderRadius: radius.sm,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 80,
    alignItems: 'center',
  },
  createText: { color: '#fff', fontWeight: '700' },
  disabled: { opacity: 0.5 },
});
