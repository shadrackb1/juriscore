import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
const TOKEN_KEY = 'juriscore_token';

async function readToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') return await AsyncStorage.getItem(TOKEN_KEY);
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return AsyncStorage.getItem(TOKEN_KEY);
  }
}

async function clearToken(): Promise<void> {
  try {
    if (Platform.OS === 'web') await AsyncStorage.removeItem(TOKEN_KEY);
    else await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    await AsyncStorage.removeItem(TOKEN_KEY);
  }
}

export const api: AxiosInstance = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await readToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  university?: string | null;
}

export interface ChatMessage {
  message: string;
  session_id?: string;
}

export interface ChatResponse {
  response: string;
  session_id: string;
  results?: any[];
  sources?: string[];
}

export interface SearchResult {
  id: string;
  title: string;
  citation?: string;
  court?: string;
  year?: number;
  doc_type?: string;
  excerpt: string;
  url?: string;
  search_url?: string;
  score?: number;
  source?: string;
}

export interface SearchResponse {
  count: number;
  results: SearchResult[];
  jurisdiction?: string;
  source?: string;
  sources_used?: string[];
  facets?: Record<string, any>;
}

export interface SearchFilters {
  doc_type?: string;
  court?: string;
  jurisdiction?: string;
  source?: string;
  limit?: number;
}

export interface NotebookFolder {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface NotebookEntry {
  id: string;
  notebook_id: string;
  case_id?: string | null;
  statute_id?: string | null;
  note_text?: string | null;
  created_at: string;
}

export interface FlashcardDeck {
  id: string;
  user_id: string;
  title: string;
  subject?: string | null;
  created_at: string;
}

export interface Flashcard {
  id: string;
  deck_id: string;
  front: string;
  back: string;
  interval: number;
  ease_factor: number;
  next_review: string;
  created_at: string;
}

export interface BookmarkItem {
  id: string;
  resource_type: string;
  resource_id: string;
  title: string;
  metadata?: Record<string, any> | null;
  collection_id?: string | null;
  created_at: string;
}

export async function login(email: string, password: string) {
  const res = await api.post<{ token: string; user: AuthUser }>('/auth/login', { email, password });
  return res.data;
}

export async function signup(name: string, email: string, password: string, university?: string) {
  const res = await api.post<{ token: string; user: AuthUser }>('/auth/signup', {
    name,
    email,
    password,
    university,
  });
  return res.data;
}

export async function getMe() {
  const res = await api.get<AuthUser>('/auth/me');
  return res.data;
}

export async function sendChatMessage(message: string, sessionId?: string): Promise<ChatResponse> {
  const res = await api.post<ChatResponse>('/chat/send', {
    message,
    session_id: sessionId,
  });
  return res.data;
}

export async function getChatHistory(sessionId: string) {
  const res = await api.get(`/chat/history/${sessionId}`);
  return res.data;
}

export async function searchCases(query: string, filters: SearchFilters = {}): Promise<SearchResponse> {
  const params: Record<string, any> = { q: query };
  if (filters.doc_type) params.doc_type = filters.doc_type;
  if (filters.court) params.court = filters.court;
  if (filters.jurisdiction) params.jurisdiction = filters.jurisdiction;
  if (filters.source) params.source = filters.source;
  if (filters.limit) params.limit = filters.limit;
  const res = await api.get<SearchResponse>('/search', { params });
  return res.data;
}

export async function getAcademicWorkspace() {
  const res = await api.get('/workspaces/academic');
  return res.data;
}

export async function listNotebookFolders(): Promise<NotebookFolder[]> {
  const res = await api.get<NotebookFolder[]>('/notebook/folders');
  return res.data;
}

export async function createNotebookFolder(name: string): Promise<NotebookFolder> {
  const res = await api.post<NotebookFolder>('/notebook/folders', { name });
  return res.data;
}

export async function listNotebookEntries(folderId: string): Promise<NotebookEntry[]> {
  const res = await api.get<NotebookEntry[]>(`/notebook/folders/${folderId}/entries`);
  return res.data;
}

export async function createNotebookEntry(
  folderId: string,
  payload: { case_id?: string; statute_id?: string; note_text?: string },
): Promise<NotebookEntry> {
  const res = await api.post<NotebookEntry>(`/notebook/folders/${folderId}/entries`, payload);
  return res.data;
}

export async function listFlashcardDecks(): Promise<FlashcardDeck[]> {
  const res = await api.get<FlashcardDeck[]>('/flashcards/decks');
  return res.data;
}

export async function createFlashcardDeck(title: string, subject?: string): Promise<FlashcardDeck> {
  const res = await api.post<FlashcardDeck>('/flashcards/decks', { title, subject });
  return res.data;
}

export async function addFlashcard(deckId: string, front: string, back: string): Promise<Flashcard> {
  const res = await api.post<Flashcard>(`/flashcards/decks/${deckId}/cards`, { front, back });
  return res.data;
}

export async function listDeckCards(deckId: string): Promise<Flashcard[]> {
  const res = await api.get<Flashcard[]>(`/flashcards/decks/${deckId}/cards`);
  return res.data;
}

export async function listBookmarks(tab?: string): Promise<BookmarkItem[]> {
  const res = await api.get<BookmarkItem[]>('/bookmarks/', { params: tab ? { tab } : {} });
  return res.data;
}

export async function createBookmark(payload: {
  resource_type: string;
  resource_id: string;
  title: string;
  metadata?: Record<string, any>;
}): Promise<BookmarkItem> {
  const res = await api.post<BookmarkItem>('/bookmarks/', payload);
  return res.data;
}

export async function deleteBookmark(id: string) {
  const res = await api.delete(`/bookmarks/${id}`);
  return res.data;
}

export async function listSearchHistory() {
  const res = await api.get('/history');
  return res.data;
}

export async function getConstitutionChapters() {
  const res = await api.get('/constitution/chapters');
  return res.data;
}

export async function searchConstitution(q?: string) {
  const res = await api.get('/constitution/search', { params: q ? { q } : {} });
  return res.data;
}

export async function searchStatutes(q?: string, capNumber?: string) {
  const res = await api.get('/statutes/search', {
    params: {
      ...(q ? { q } : {}),
      ...(capNumber ? { cap_number: capNumber } : {}),
    },
  });
  return res.data;
}

export async function listGazettes() {
  const res = await api.get('/gazettes/', { params: { limit: 50 } });
  return res.data;
}

export async function healthCheck() {
  try {
    const res = await axios.get(`${API_BASE}/health`, { timeout: 5000 });
    return res.data;
  } catch {
    return null;
  }
}

export { API_BASE, clearToken };
