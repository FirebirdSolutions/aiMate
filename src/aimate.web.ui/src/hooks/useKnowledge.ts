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
          name: 'aiMate Safety Protocol.pdf',
          type: 'pdf',
          size: 245678,
          uploadedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
          status: 'processed',
          chunkCount: 45,
          workspaceId: wsId || 'default',
          tags: ['safety', 'protocol'],
        },
        {
          id: 'doc-2',
          name: 'NZ Crisis Resources.docx',
          type: 'docx',
          size: 89234,
          uploadedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
          status: 'processed',
          chunkCount: 28,
          workspaceId: wsId || 'default',
          tags: ['crisis', 'resources', 'nz'],
        },
        {
          id: 'doc-3',
          name: 'API Documentation.md',
          type: 'markdown',
          size: 34567,
          uploadedAt: new Date(Date.now() - 86400000).toISOString(),
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
        name: file.name,
        type: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString(),
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
            ? { ...doc, status: 'processed', chunkCount: Math.floor(Math.random() * 50) + 10 }
            : doc
        ));
      }, 3000);
      
      return mockDoc;
    }

    try {
      setUploading(true);
      const doc = await knowledgeService.uploadDocument(file, {
        workspaceId: workspaceId,
        ...data,
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
        doc.name.toLowerCase().includes(query.toLowerCase()) ||
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
        query,
        results: documents.slice(0, limit).map(doc => ({
          document: doc,
          relevanceScore: Math.random(),
          chunks: [
            {
              id: `chunk-${doc.id}-1`,
              content: `Sample content from ${doc.name}...`,
              pageNumber: 1,
            }
          ],
        })),
      };
    }

    try {
      return await knowledgeService.semanticSearch(query, workspaceId, limit);
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
          doc.id === documentId ? { ...doc, status: 'processed' } : doc
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
    deleteDocument,
    updateDocument,
    searchDocuments,
    semanticSearch,
    reprocessDocument,
    getDocumentChunks,
  };
}
