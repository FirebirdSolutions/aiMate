/**
 * Knowledge Base Hook
 * 
 * Manages knowledge base documents, search, and RAG
 */

import { useState, useEffect, useCallback } from 'react';
import { knowledgeService, KnowledgeDocumentDto, UploadDocumentDto } from '../api/services';
import { AppConfig } from '../utils/config';

export function useKnowledge(workspaceId?: string) {
  const [documents, setDocuments] = useState<KnowledgeDocumentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // ============================================================================
  // LOAD DOCUMENTS
  // ============================================================================

  const loadDocuments = useCallback(async (wsId?: string) => {
    if (AppConfig.isOfflineMode()) {
      // Use mock documents in offline mode
      const mockDocs: KnowledgeDocumentDto[] = [
        {
          id: 'doc-1',
          title: 'aiMate Safety Protocol',
          fileName: 'aiMate Safety Protocol.pdf',
          fileType: 'pdf',
          fileSize: 245678,
          createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
          updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
          status: 'ready',
          chunkCount: 45,
          workspaceId: wsId || 'default',
          tags: ['safety', 'protocol'],
        },
        {
          id: 'doc-2',
          title: 'NZ Crisis Resources',
          fileName: 'NZ Crisis Resources.docx',
          fileType: 'docx',
          fileSize: 89234,
          createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
          updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
          status: 'ready',
          chunkCount: 28,
          workspaceId: wsId || 'default',
          tags: ['crisis', 'resources', 'nz'],
        },
        {
          id: 'doc-3',
          title: 'API Documentation',
          fileName: 'API Documentation.md',
          fileType: 'markdown',
          fileSize: 34567,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString(),
          status: 'processing',
          chunkCount: 0,
          workspaceId: wsId || 'default',
          tags: ['api', 'docs'],
        },
      ];
      setDocuments(mockDocs);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await knowledgeService.getDocuments(wsId);
      setDocuments(data);
      setError(null);
    } catch (err) {
      console.error('[useKnowledge] Failed to load documents:', err);
      setError('Failed to load documents');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================================================
  // UPLOAD DOCUMENT
  // ============================================================================

  const uploadDocument = useCallback(async (file: File, data?: Partial<UploadDocumentDto>) => {
    if (AppConfig.isOfflineMode()) {
      const mockDoc: KnowledgeDocumentDto = {
        id: `doc-${Date.now()}`,
        title: file.name,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'processing',
        chunkCount: 0,
        workspaceId: workspaceId || 'default',
        tags: data?.tags || [],
      };
      setDocuments(prev => [mockDoc, ...prev]);

      // Simulate processing
      setTimeout(() => {
        setDocuments(prev => prev.map(doc =>
          doc.id === mockDoc.id
            ? { ...doc, status: 'ready', chunkCount: Math.floor(Math.random() * 50) + 10 }
            : doc
        ));
      }, 3000);

      return mockDoc;
    }

    try {
      setUploading(true);
      const doc = await knowledgeService.uploadDocument(file, {
        workspaceId: workspaceId,
        tags: data?.tags,
      });
      setDocuments(prev => [doc, ...prev]);
      return doc;
    } catch (err) {
      console.error('[useKnowledge] Failed to upload document:', err);
      throw err;
    } finally {
      setUploading(false);
    }
  }, [workspaceId]);

  // ============================================================================
  // DELETE DOCUMENT
  // ============================================================================

  const deleteDocument = useCallback(async (documentId: string) => {
    // Optimistic update
    setDocuments(prev => prev.filter(doc => doc.id !== documentId));

    if (AppConfig.isOfflineMode()) {
      return;
    }

    try {
      await knowledgeService.deleteDocument(documentId);
    } catch (err) {
      console.error('[useKnowledge] Failed to delete document:', err);
      await loadDocuments(workspaceId); // Revert
      throw err;
    }
  }, [workspaceId, loadDocuments]);

  // ============================================================================
  // UPDATE DOCUMENT
  // ============================================================================

  const updateDocument = useCallback(async (
    documentId: string,
    updates: Partial<KnowledgeDocumentDto>
  ) => {
    // Optimistic update
    setDocuments(prev => prev.map(doc =>
      doc.id === documentId ? { ...doc, ...updates } : doc
    ));

    if (AppConfig.isOfflineMode()) {
      return;
    }

    try {
      await knowledgeService.updateDocument(documentId, updates);
    } catch (err) {
      console.error('[useKnowledge] Failed to update document:', err);
      await loadDocuments(workspaceId); // Revert
      throw err;
    }
  }, [workspaceId, loadDocuments]);

  // ============================================================================
  // SEARCH DOCUMENTS
  // ============================================================================

  const searchDocuments = useCallback(async (query: string) => {
    if (AppConfig.isOfflineMode()) {
      return documents.filter(doc =>
        doc.fileName.toLowerCase().includes(query.toLowerCase()) ||
        doc.tags?.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      );
    }

    try {
      return await knowledgeService.searchDocuments(query, workspaceId);
    } catch (err) {
      console.error('[useKnowledge] Failed to search documents:', err);
      throw err;
    }
  }, [documents, workspaceId]);

  // ============================================================================
  // SEMANTIC SEARCH
  // ============================================================================

  const semanticSearch = useCallback(async (query: string, limit: number = 10) => {
    if (AppConfig.isOfflineMode()) {
      return {
        results: documents.slice(0, limit).map(doc => ({
          id: `res-${doc.id}`,
          title: doc.title,
          content: `Sample content from ${doc.fileName}...`,
          score: Math.random(),
          relevance: 'high' as const,
        })),
        totalResults: documents.length,
        queryTime: 100,
      };
    }

    try {
      return await knowledgeService.semanticSearch({ query, workspaceId, limit });
    } catch (err) {
      console.error('[useKnowledge] Failed to perform semantic search:', err);
      throw err;
    }
  }, [documents, workspaceId]);

  // ============================================================================
  // REPROCESS DOCUMENT
  // ============================================================================

  const reprocessDocument = useCallback(async (documentId: string) => {
    // Optimistic update
    setDocuments(prev => prev.map(doc =>
      doc.id === documentId ? { ...doc, status: 'processing' } : doc
    ));

    if (AppConfig.isOfflineMode()) {
      setTimeout(() => {
        setDocuments(prev => prev.map(doc =>
          doc.id === documentId ? { ...doc, status: 'ready' } : doc
        ));
      }, 2000);
      return;
    }

    try {
      await knowledgeService.reprocessDocument(documentId);
      await loadDocuments(workspaceId);
    } catch (err) {
      console.error('[useKnowledge] Failed to reprocess document:', err);
      await loadDocuments(workspaceId); // Revert
      throw err;
    }
  }, [workspaceId, loadDocuments]);

  // ============================================================================
  // GET DOCUMENT CHUNKS
  // ============================================================================

  const getDocumentChunks = useCallback(async (documentId: string) => {
    if (AppConfig.isOfflineMode()) {
      return Array.from({ length: 5 }, (_, i) => ({
        id: `chunk-${documentId}-${i}`,
        content: `This is chunk ${i + 1} of the document. It contains relevant information that has been extracted and processed.`,
        pageNumber: i + 1,
        embedding: [],
      }));
    }

    try {
      return await knowledgeService.getDocumentChunks(documentId);
    } catch (err) {
      console.error('[useKnowledge] Failed to get document chunks:', err);
      throw err;
    }
  }, []);

  // ============================================================================
  // SAVE TEXT AS KNOWLEDGE
  // ============================================================================

  const saveTextAsKnowledge = useCallback(async (
    content: string,
    title?: string,
    tags?: string[]
  ) => {
    // Generate a title if not provided
    const docTitle = title || `Note - ${new Date().toLocaleString()}`;
    const fileName = `${docTitle.replace(/[^a-z0-9]/gi, '_')}.md`;

    // Create a text blob and convert to file
    const blob = new Blob([content], { type: 'text/markdown' });
    const file = new File([blob], fileName, { type: 'text/markdown' });

    // Use the existing upload function
    return uploadDocument(file, { tags });
  }, [uploadDocument]);

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  useEffect(() => {
    loadDocuments(workspaceId);
  }, [workspaceId, loadDocuments]);

  return {
    documents,
    loading,
    uploading,
    error,

    // Actions
    refresh: () => loadDocuments(workspaceId),
    uploadDocument,
    saveTextAsKnowledge,
    deleteDocument,
    updateDocument,
    searchDocuments,
    semanticSearch,
    reprocessDocument,
    getDocumentChunks,
  };
}
