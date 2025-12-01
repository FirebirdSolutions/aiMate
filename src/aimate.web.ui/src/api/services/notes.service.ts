/**
 * Notes Service
 *
 * Handles notes CRUD operations for attaching notes to chat context
 */

import { apiClient } from '../client';
import {
  NoteDto,
  CreateNoteDto,
  UpdateNoteDto,
  ApiSuccessResponse,
} from '../types';
import { AppConfig } from '../../utils/config';

// Storage key for offline mode
const STORAGE_KEY = 'aiMate_notes';

// Mock notes for offline mode
const MOCK_NOTES: NoteDto[] = [
  {
    id: 'note-1',
    title: 'Project Requirements',
    content: `# aiMate Requirements\n\n## Core Features\n- Real-time streaming chat\n- Multi-workspace support\n- Knowledge base integration\n\n## Technical Stack\n- React 18 + TypeScript\n- Tailwind CSS\n- shadcn/ui components`,
    contentType: 'Markdown',
    tags: ['project', 'requirements'],
    ownerId: 'user-1',
    visibility: 'Private',
    isFavorite: true,
    isPinned: true,
    isArchived: false,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-11-01T14:30:00Z',
  },
  {
    id: 'note-2',
    title: 'Meeting Notes - Sprint Planning',
    content: `## Sprint Planning\n\n**Date**: 2024-11-20\n**Attendees**: Team\n\n### Goals\n1. Complete model evaluation feature\n2. Implement custom models\n3. Fix attachment handling\n\n### Action Items\n- [ ] Review PRs\n- [ ] Update documentation`,
    contentType: 'Markdown',
    tags: ['meeting', 'sprint'],
    ownerId: 'user-1',
    visibility: 'Private',
    isFavorite: false,
    isPinned: false,
    isArchived: false,
    createdAt: '2024-11-20T09:00:00Z',
    updatedAt: '2024-11-20T11:00:00Z',
  },
];

// Load notes from localStorage
function loadNotes(): NoteDto[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (err) {
    console.error('Failed to load notes:', err);
  }
  return [...MOCK_NOTES];
}

// Save notes to localStorage
function saveNotes(notes: NoteDto[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch (err) {
    console.error('Failed to save notes:', err);
  }
}

class NotesService {
  /**
   * Get all notes
   */
  async getNotes(params?: {
    collection?: string;
    tags?: string[];
    visibility?: string;
  }): Promise<NoteDto[]> {
    if (AppConfig.isOfflineMode()) {
      let notes = loadNotes();

      if (params?.collection) {
        notes = notes.filter(n => n.collection === params.collection);
      }
      if (params?.tags && params.tags.length > 0) {
        notes = notes.filter(n =>
          params.tags!.some(tag => n.tags.includes(tag))
        );
      }
      if (params?.visibility) {
        notes = notes.filter(n => n.visibility === params.visibility);
      }

      return notes;
    }

    const queryParams = new URLSearchParams();
    if (params?.collection) queryParams.append('collection', params.collection);
    if (params?.tags) params.tags.forEach(tag => queryParams.append('tags', tag));
    if (params?.visibility) queryParams.append('visibility', params.visibility);

    const query = queryParams.toString();
    return apiClient.get<NoteDto[]>(`/notes${query ? `?${query}` : ''}`);
  }

  /**
   * Get note by ID
   */
  async getNote(id: string): Promise<NoteDto | null> {
    if (AppConfig.isOfflineMode()) {
      const notes = loadNotes();
      return notes.find(n => n.id === id) || null;
    }
    return apiClient.get<NoteDto>(`/notes/${id}`);
  }

  /**
   * Get multiple notes by IDs
   */
  async getNotesByIds(ids: string[]): Promise<NoteDto[]> {
    if (ids.length === 0) return [];

    if (AppConfig.isOfflineMode()) {
      const notes = loadNotes();
      return notes.filter(n => ids.includes(n.id));
    }

    // Batch fetch for efficiency
    const notePromises = ids.map(id => this.getNote(id));
    const results = await Promise.all(notePromises);
    return results.filter((n): n is NoteDto => n !== null);
  }

  /**
   * Create a new note
   */
  async createNote(data: CreateNoteDto): Promise<NoteDto> {
    const newNote: NoteDto = {
      id: `note-${Date.now()}`,
      title: data.title,
      content: data.content,
      contentType: data.contentType || 'Markdown',
      tags: data.tags || [],
      collection: data.collection,
      category: data.category,
      color: data.color,
      ownerId: 'current-user',
      visibility: 'Private',
      isFavorite: false,
      isPinned: false,
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (AppConfig.isOfflineMode()) {
      const notes = loadNotes();
      notes.unshift(newNote);
      saveNotes(notes);
      return newNote;
    }

    return apiClient.post<NoteDto>('/notes', data);
  }

  /**
   * Update a note
   */
  async updateNote(id: string, data: UpdateNoteDto): Promise<NoteDto> {
    if (AppConfig.isOfflineMode()) {
      const notes = loadNotes();
      const index = notes.findIndex(n => n.id === id);
      if (index >= 0) {
        notes[index] = {
          ...notes[index],
          ...data,
          updatedAt: new Date().toISOString(),
        };
        saveNotes(notes);
        return notes[index];
      }
      throw new Error('Note not found');
    }

    return apiClient.put<NoteDto>(`/notes/${id}`, data);
  }

  /**
   * Delete a note
   */
  async deleteNote(id: string): Promise<ApiSuccessResponse> {
    if (AppConfig.isOfflineMode()) {
      const notes = loadNotes();
      const filtered = notes.filter(n => n.id !== id);
      saveNotes(filtered);
      return { success: true, message: 'Note deleted' };
    }

    return apiClient.delete<ApiSuccessResponse>(`/notes/${id}`);
  }

  /**
   * Search notes
   */
  async searchNotes(query: string): Promise<NoteDto[]> {
    if (AppConfig.isOfflineMode()) {
      const notes = loadNotes();
      const lowerQuery = query.toLowerCase();
      return notes.filter(n =>
        n.title.toLowerCase().includes(lowerQuery) ||
        n.content.toLowerCase().includes(lowerQuery) ||
        n.tags.some(t => t.toLowerCase().includes(lowerQuery))
      );
    }

    return apiClient.get<NoteDto[]>(`/notes/search?q=${encodeURIComponent(query)}`);
  }

  /**
   * Toggle favorite status
   */
  async toggleFavorite(id: string): Promise<NoteDto> {
    const note = await this.getNote(id);
    if (!note) throw new Error('Note not found');
    return this.updateNote(id, { isFavorite: !note.isFavorite });
  }

  /**
   * Toggle pinned status
   */
  async togglePinned(id: string): Promise<NoteDto> {
    const note = await this.getNote(id);
    if (!note) throw new Error('Note not found');
    return this.updateNote(id, { isPinned: !note.isPinned });
  }

  /**
   * Archive a note
   */
  async archiveNote(id: string): Promise<NoteDto> {
    return this.updateNote(id, { isArchived: true });
  }

  /**
   * Unarchive a note
   */
  async unarchiveNote(id: string): Promise<NoteDto> {
    return this.updateNote(id, { isArchived: false });
  }

  /**
   * Get note content formatted for chat context
   */
  formatNoteForContext(note: NoteDto): string {
    return `[Note: ${note.title}]\n${note.content}`;
  }
}

export const notesService = new NotesService();
export default notesService;
