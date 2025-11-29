/**
 * Admin Data Hook
 * 
 * Manages admin data fetching, caching, and mutations
 */

import { useState, useEffect, useCallback } from 'react';
import {
  adminService,
  connectionsService,
  ModelDto,
  ConnectionDto,
  McpServerDto,
  AdminDashboardDto,
} from '../api/services';
import { AppConfig } from '../utils/config';

export function useAdmin() {
  const [dashboard, setDashboard] = useState<AdminDashboardDto | null>(null);
  const [models, setModels] = useState<ModelDto[]>([]);
  const [connections, setConnections] = useState<ConnectionDto[]>([]);
  const [mcpServers, setMcpServers] = useState<McpServerDto[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // DASHBOARD
  // ============================================================================

  const loadDashboard = useCallback(async () => {
    if (AppConfig.isOfflineMode()) {
      // Use mock data in offline mode
      setDashboard({
        totalUsers: 3,
        activeUsers: 2,
        totalWorkspaces: 5,
        totalConversations: 12,
        totalMessages: 234,
        systemHealth: 'Healthy',
        uptime: 99.9,
        lastBackup: new Date().toISOString(),
        totalTokensUsed: 125000,
        totalCostTracked: 2.50,
      });
      return;
    }

    try {
      const data = await adminService.getDashboard();
      setDashboard(data);
    } catch (err) {
      console.error('[useAdmin] Failed to load dashboard:', err);
      // Fallback to mock data on error
      setDashboard({
        totalUsers: 0,
        activeUsers: 0,
        totalWorkspaces: 0,
        totalConversations: 0,
        totalMessages: 0,
        systemHealth: 'Degraded',
        uptime: 0,
        lastBackup: new Date().toISOString(),
        totalTokensUsed: 0,
        totalCostTracked: 0,
      });
    }
  }, []);

  // ============================================================================
  // MODELS
  // ============================================================================

  const loadModels = useCallback(async () => {
    if (AppConfig.isOfflineMode()) {
      // Use mock models in offline mode
      setModels([
        { 
          id: 'gpt-4', 
          name: 'GPT-4', 
          provider: 'OpenAI',
          isActive: true,
          contextWindow: 8192,
          color: 'text-purple-500',
          capabilities: ['chat', 'code', 'analysis'],
        },
        { 
          id: 'gpt-4-turbo', 
          name: 'GPT-4 Turbo', 
          provider: 'OpenAI',
          isActive: true,
          contextWindow: 128000,
          color: 'text-blue-500',
          capabilities: ['chat', 'code', 'analysis', 'vision'],
        },
        { 
          id: 'gpt-3.5-turbo', 
          name: 'GPT-3.5 Turbo', 
          provider: 'OpenAI',
          isActive: true,
          contextWindow: 16384,
          color: 'text-green-500',
          capabilities: ['chat', 'code'],
        },
        { 
          id: 'claude-3-opus', 
          name: 'Claude 3 Opus', 
          provider: 'Anthropic',
          isActive: true,
          contextWindow: 200000,
          color: 'text-orange-500',
          capabilities: ['chat', 'code', 'analysis'],
        },
        { 
          id: 'claude-3-sonnet', 
          name: 'Claude 3 Sonnet', 
          provider: 'Anthropic',
          isActive: true,
          contextWindow: 200000,
          color: 'text-amber-500',
          capabilities: ['chat', 'code'],
        },
      ]);
      return;
    }

    try {
      const data = await adminService.getModels();
      setModels(data);
    } catch (err) {
      console.error('[useAdmin] Failed to load models:', err);
      setModels([]);
    }
  }, []);

  const toggleModel = useCallback(async (modelId: string) => {
    // Optimistic update
    setModels(prev => prev.map(m => 
      m.id === modelId ? { ...m, isActive: !m.isActive } : m
    ));

    if (AppConfig.isOfflineMode()) {
      return;
    }

    try {
      await adminService.toggleModel(modelId);
      await loadModels(); // Refresh
    } catch (err) {
      console.error('[useAdmin] Failed to toggle model:', err);
      // Revert optimistic update
      await loadModels();
    }
  }, [loadModels]);

  const createModel = useCallback(async (data: Partial<ModelDto>) => {
    if (AppConfig.isOfflineMode()) {
      const newModel: ModelDto = {
        id: `model-${Date.now()}`,
        name: data.name || 'New Model',
        provider: data.provider || 'Custom',
        isActive: data.isActive ?? true,
        contextWindow: data.contextWindow || 4096,
        ...data,
      };
      setModels(prev => [...prev, newModel]);
      return newModel;
    }

    try {
      const model = await adminService.createModel(data);
      await loadModels();
      return model;
    } catch (err) {
      console.error('[useAdmin] Failed to create model:', err);
      throw err;
    }
  }, [loadModels]);

  const updateModel = useCallback(async (modelId: string, data: Partial<ModelDto>) => {
    // Optimistic update
    setModels(prev => prev.map(m => 
      m.id === modelId ? { ...m, ...data } : m
    ));

    if (AppConfig.isOfflineMode()) {
      return;
    }

    try {
      await adminService.updateModel(modelId, data);
      await loadModels();
    } catch (err) {
      console.error('[useAdmin] Failed to update model:', err);
      await loadModels(); // Revert
      throw err;
    }
  }, [loadModels]);

  const deleteModel = useCallback(async (modelId: string) => {
    // Optimistic update
    setModels(prev => prev.filter(m => m.id !== modelId));

    if (AppConfig.isOfflineMode()) {
      return;
    }

    try {
      await adminService.deleteModel(modelId);
    } catch (err) {
      console.error('[useAdmin] Failed to delete model:', err);
      await loadModels(); // Revert
      throw err;
    }
  }, [loadModels]);

  // ============================================================================
  // CONNECTIONS
  // ============================================================================

  const loadConnections = useCallback(async () => {
    if (AppConfig.isOfflineMode()) {
      // Use mock connections in offline mode
      setConnections([
        {
          id: '1',
          provider: 'OpenAI',
          name: 'OpenAI API',
          isActive: true,
          apiKeyPrefix: 'sk-proj-...',
          createdAt: new Date().toISOString(),
          models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
        },
        {
          id: '2',
          provider: 'Anthropic',
          name: 'Anthropic API',
          isActive: false,
          apiKeyPrefix: 'sk-ant-...',
          createdAt: new Date().toISOString(),
          models: ['claude-3-opus', 'claude-3-sonnet'],
        },
      ]);
      return;
    }

    try {
      const data = await connectionsService.getConnections();
      setConnections(data);
    } catch (err) {
      console.error('[useAdmin] Failed to load connections:', err);
      setConnections([]);
    }
  }, []);

  const toggleConnection = useCallback(async (connectionId: string) => {
    // Optimistic update
    let wasActive = false;
    setConnections(prev => {
      const connection = prev.find(c => c.id === connectionId);
      wasActive = connection?.isActive || false;
      return prev.map(c => 
        c.id === connectionId ? { ...c, isActive: !c.isActive } : c
      );
    });

    if (AppConfig.isOfflineMode()) {
      return;
    }

    try {
      if (wasActive) {
        await connectionsService.deactivateConnection(connectionId);
      } else {
        await connectionsService.activateConnection(connectionId);
      }
      await loadConnections();
    } catch (err) {
      console.error('[useAdmin] Failed to toggle connection:', err);
      await loadConnections(); // Revert
    }
  }, [loadConnections]);

  const createConnection = useCallback(async (data: any) => {
    if (AppConfig.isOfflineMode()) {
      const newConnection: ConnectionDto = {
        id: `conn-${Date.now()}`,
        provider: data.provider,
        name: data.name,
        isActive: data.isActive ?? true,
        apiKeyPrefix: data.apiKey?.substring(0, 10) + '...',
        createdAt: new Date().toISOString(),
        models: [],
      };
      setConnections(prev => [...prev, newConnection]);
      return newConnection;
    }

    try {
      const connection = await connectionsService.createConnection(data);
      await loadConnections();
      return connection;
    } catch (err) {
      console.error('[useAdmin] Failed to create connection:', err);
      throw err;
    }
  }, [loadConnections]);

  const updateConnection = useCallback(async (connectionId: string, data: any) => {
    // Optimistic update
    setConnections(prev => prev.map(c => 
      c.id === connectionId ? { ...c, ...data } : c
    ));

    if (AppConfig.isOfflineMode()) {
      return;
    }

    try {
      await connectionsService.updateConnection(connectionId, data);
      await loadConnections();
    } catch (err) {
      console.error('[useAdmin] Failed to update connection:', err);
      await loadConnections(); // Revert
      throw err;
    }
  }, [loadConnections]);

  const deleteConnection = useCallback(async (connectionId: string) => {
    // Optimistic update
    setConnections(prev => prev.filter(c => c.id !== connectionId));

    if (AppConfig.isOfflineMode()) {
      return;
    }

    try {
      await connectionsService.deleteConnection(connectionId);
    } catch (err) {
      console.error('[useAdmin] Failed to delete connection:', err);
      await loadConnections(); // Revert
      throw err;
    }
  }, [loadConnections]);

  const testConnection = useCallback(async (connectionId: string) => {
    if (AppConfig.isOfflineMode()) {
      return {
        success: true,
        message: 'Connection test successful (offline mode)',
        provider: 'OpenAI',
        availableModels: ['gpt-4', 'gpt-3.5-turbo'],
      };
    }

    try {
      return await connectionsService.testConnection(connectionId);
    } catch (err) {
      console.error('[useAdmin] Failed to test connection:', err);
      throw err;
    }
  }, []);

  // ============================================================================
  // MCP SERVERS
  // ============================================================================

  const loadMcpServers = useCallback(async () => {
    if (AppConfig.isOfflineMode()) {
      // Use mock MCP servers in offline mode
      setMcpServers([
        {
          id: '1',
          name: 'GitHub MCP',
          description: 'GitHub repository management',
          isActive: true,
          status: 'Connected',
          tools: ['create_issue', 'list_repos', 'search_code'],
          version: '1.0.0',
        },
        {
          id: '2',
          name: 'Slack MCP',
          description: 'Slack messaging integration',
          isActive: false,
          status: 'Disconnected',
          tools: ['send_message', 'list_channels'],
          version: '1.2.0',
        },
      ]);
      return;
    }

    try {
      const data = await adminService.getMcpServers();
      setMcpServers(data);
    } catch (err) {
      console.error('[useAdmin] Failed to load MCP servers:', err);
      setMcpServers([]);
    }
  }, []);

  const toggleMcpServer = useCallback(async (serverId: string) => {
    // Optimistic update
    setMcpServers(prev => prev.map(s => 
      s.id === serverId ? { ...s, isActive: !s.isActive } : s
    ));

    if (AppConfig.isOfflineMode()) {
      return;
    }

    try {
      await adminService.toggleMcpServer(serverId);
      await loadMcpServers();
    } catch (err) {
      console.error('[useAdmin] Failed to toggle MCP server:', err);
      await loadMcpServers(); // Revert
    }
  }, [loadMcpServers]);

  const createMcpServer = useCallback(async (data: Partial<McpServerDto>) => {
    if (AppConfig.isOfflineMode()) {
      const newServer: McpServerDto = {
        id: `mcp-${Date.now()}`,
        name: data.name || 'New MCP Server',
        description: data.description || '',
        isActive: data.isActive ?? true,
        status: 'Disconnected',
        tools: data.tools || [],
        version: data.version || '1.0.0',
      };
      setMcpServers(prev => [...prev, newServer]);
      return newServer;
    }

    try {
      const server = await adminService.createMcpServer(data);
      await loadMcpServers();
      return server;
    } catch (err) {
      console.error('[useAdmin] Failed to create MCP server:', err);
      throw err;
    }
  }, [loadMcpServers]);

  const updateMcpServer = useCallback(async (serverId: string, data: Partial<McpServerDto>) => {
    // Optimistic update
    setMcpServers(prev => prev.map(s => 
      s.id === serverId ? { ...s, ...data } : s
    ));

    if (AppConfig.isOfflineMode()) {
      return;
    }

    try {
      await adminService.updateMcpServer(serverId, data);
      await loadMcpServers();
    } catch (err) {
      console.error('[useAdmin] Failed to update MCP server:', err);
      await loadMcpServers(); // Revert
      throw err;
    }
  }, [loadMcpServers]);

  const deleteMcpServer = useCallback(async (serverId: string) => {
    // Optimistic update
    setMcpServers(prev => prev.filter(s => s.id !== serverId));

    if (AppConfig.isOfflineMode()) {
      return;
    }

    try {
      await adminService.deleteMcpServer(serverId);
    } catch (err) {
      console.error('[useAdmin] Failed to delete MCP server:', err);
      await loadMcpServers(); // Revert
      throw err;
    }
  }, [loadMcpServers]);

  // ============================================================================
  // USERS
  // ============================================================================

  const loadUsers = useCallback(async () => {
    if (AppConfig.isOfflineMode()) {
      // Use mock users in offline mode
      setUsers([
        { id: '1', username: 'Rich', email: 'rich@example.com', userTier: 'Admin', isActive: true, createdAt: new Date().toISOString() },
        { id: '2', username: 'John Doe', email: 'john@example.com', userTier: 'BYOK', isActive: true, createdAt: new Date().toISOString() },
        { id: '3', username: 'Jane Smith', email: 'jane@example.com', userTier: 'Free', isActive: false, createdAt: new Date().toISOString() },
      ]);
      return;
    }

    try {
      const data = await adminService.getUsers();
      setUsers(data);
    } catch (err) {
      console.error('[useAdmin] Failed to load users:', err);
      setUsers([]);
    }
  }, []);

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        loadDashboard(),
        loadModels(),
        loadConnections(),
        loadMcpServers(),
        loadUsers(),
      ]);
    } catch (err) {
      console.error('[useAdmin] Failed to load admin data:', err);
      setError('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }, [loadDashboard, loadModels, loadConnections, loadMcpServers, loadUsers]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  return {
    // Data
    dashboard,
    models,
    connections,
    mcpServers,
    users,
    
    // State
    loading,
    error,
    
    // Actions
    refresh: loadAll,
    
    // Models
    toggleModel,
    createModel,
    updateModel,
    deleteModel,
    
    // Connections
    toggleConnection,
    createConnection,
    updateConnection,
    deleteConnection,
    testConnection,
    
    // MCP Servers
    toggleMcpServer,
    createMcpServer,
    updateMcpServer,
    deleteMcpServer,
    
    // Users
    refreshUsers: loadUsers,
  };
}
