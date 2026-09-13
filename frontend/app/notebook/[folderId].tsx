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
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { listNotebookEntries, createNotebookEntry, NotebookEntry } from '../../lib/api';
import { theme, radius, spacing } from '../../lib/theme';

export default function NotebookFolderScreen() {
  const { folderId, name } = useLocalSearchParams<{ folderId: string; name?: string }>();
  const router = useRouter();
  const [entries, setEntries] = useState<NotebookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!folderId) return;
    setLoading(true);
    try {
      const data = await listNotebookEntries(folderId);
      setEntries(data);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not load entries.');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [folderId]);

  useEffect(() => {
    load();
  }, [load]);

  const saveNote = async () => {
    if (!folderId || !noteText.trim()) return;
    setSaving(true);
    try {
      const entry = await createNotebookEntry(folderId, { note_text: noteText.trim() });
      setEntries((prev) => [entry, ...prev]);
      setNoteText('');
      setModalOpen(false);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not save note.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {name || 'Notebook'}
        </Text>
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
          data={entries}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="document-text-outline" size={36} color={theme.textMuted} />
              <Text style={styles.emptyTitle}>No notes yet</Text>
              <Text style={styles.emptyText}>
                Capture briefs, case facts, holdings, or study reminders here.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.entry}>
              <Text style={styles.entryText}>{item.note_text || 'Saved case reference'}</Text>
              <Text style={styles.entryDate}>
                {item.created_at ? new Date(item.created_at).toLocaleString() : ''}
              </Text>
            </View>
          )}
        />
      )}

      <Modal visible={modalOpen} transparent animationType="fade" onRequestClose={() => setModalOpen(false)}>
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>New note</Text>
            <TextInput
              style={[styles.input, styles.inputTall]}
              value={noteText}
              onChangeText={setNoteText}
              placeholder="Write a case brief, holding, or study note…"
              placeholderTextColor={theme.textMuted}
              multiline
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setModalOpen(false)}>
                <Text style={styles.cancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.create, (!noteText.trim() || saving) && styles.disabled]}
                onPress={saveNote}
                disabled={!noteText.trim() || saving}
              >
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.createText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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
  list: { padding: spacing.lg, paddingTop: 0 },
  entry: {
    backgroundColor: theme.bgCard,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 10,
  },
  entryText: { color: theme.text, fontSize: 14, lineHeight: 20 },
  entryDate: { color: theme.textMuted, fontSize: 11, marginTop: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { color: theme.text, fontSize: 16, fontWeight: '700', marginTop: 12 },
  emptyText: { color: theme.textMuted, fontSize: 13, textAlign: 'center', marginTop: 6, lineHeight: 18 },
  overlay: {
    flex: 1,
    backgroundColor: theme.overlay,
    justifyContent: 'center',
    padding: 20,
  },
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
    textAlignVertical: 'top',
  },
  inputTall: { minHeight: 140 },
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
