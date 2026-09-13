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
import {
  listNotebookFolders,
  createNotebookFolder,
  listNotebookEntries,
  NotebookFolder,
} from '../../lib/api';
import { theme, radius, spacing } from '../../lib/theme';

export default function NotebookScreen() {
  const router = useRouter();
  const [folders, setFolders] = useState<NotebookFolder[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listNotebookFolders();
      setFolders(data);
      const nextCounts: Record<string, number> = {};
      await Promise.all(
        data.slice(0, 12).map(async (f) => {
          try {
            const entries = await listNotebookEntries(f.id);
            nextCounts[f.id] = entries.length;
          } catch {
            nextCounts[f.id] = 0;
          }
        }),
      );
      setCounts(nextCounts);
    } catch (e: any) {
      setError(e?.message || 'Could not load notebooks.');
      setFolders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const createFolder = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const folder = await createNotebookFolder(newName.trim());
      setFolders((prev) => [folder, ...prev]);
      setNewName('');
      setModalOpen(false);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not create notebook.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Notebook</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalOpen(true)}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addText}>New</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.accent} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={32} color={theme.textMuted} />
          <Text style={styles.emptyTitle}>Notebooks unavailable</Text>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.retry} onPress={load}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={folders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="book-outline" size={36} color={theme.textMuted} />
              <Text style={styles.emptyTitle}>No notebooks yet</Text>
              <Text style={styles.emptyText}>
                Create a notebook to save case notes, briefs, and study material.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.folder}
              onPress={() =>
                router.push({
                  pathname: '/notebook/[folderId]',
                  params: { folderId: item.id, name: item.name },
                } as any)
              }
            >
              <View style={styles.folderIcon}>
                <Ionicons name="folder" size={20} color={theme.accent} />
              </View>
              <View style={styles.folderBody}>
                <Text style={styles.folderName}>{item.name}</Text>
                <Text style={styles.folderMeta}>
                  {counts[item.id] != null ? `${counts[item.id]} entries` : 'Open folder'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
            </TouchableOpacity>
          )}
        />
      )}

      <Modal visible={modalOpen} transparent animationType="fade" onRequestClose={() => setModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New notebook</Text>
            <TextInput
              style={styles.modalInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="e.g. Constitutional Law notes"
              placeholderTextColor={theme.textMuted}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setModalOpen(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalCreate, (!newName.trim() || creating) && styles.disabled]}
                onPress={createFolder}
                disabled={!newName.trim() || creating}
              >
                {creating ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalCreateText}>Create</Text>
                )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  title: { color: theme.text, fontSize: 24, fontWeight: '700' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.primaryLight,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  list: { padding: spacing.lg, paddingTop: 0 },
  folder: {
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
  folderIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: theme.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  folderBody: { flex: 1 },
  folderName: { color: theme.text, fontSize: 15, fontWeight: '700' },
  folderMeta: { color: theme.textMuted, fontSize: 12, marginTop: 2 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: { color: theme.text, fontSize: 16, fontWeight: '700', marginTop: 12 },
  emptyText: {
    color: theme.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  retry: {
    marginTop: 16,
    backgroundColor: theme.primaryLight,
    borderRadius: radius.sm,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryText: { color: '#fff', fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: theme.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 20,
  },
  modalTitle: { color: theme.text, fontSize: 18, fontWeight: '700', marginBottom: 14 },
  modalInput: {
    backgroundColor: theme.inputBg,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radius.md,
    color: theme.text,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 16,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  modalCancel: { paddingHorizontal: 14, paddingVertical: 10 },
  modalCancelText: { color: theme.textSecondary, fontWeight: '600' },
  modalCreate: {
    backgroundColor: theme.primaryLight,
    borderRadius: radius.sm,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 96,
    alignItems: 'center',
  },
  modalCreateText: { color: '#fff', fontWeight: '700' },
  disabled: { opacity: 0.5 },
});
