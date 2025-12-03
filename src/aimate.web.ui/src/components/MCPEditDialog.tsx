import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { RefreshCw, Eye, EyeOff, Lock, CheckCircle2, XCircle, Loader2, Wrench, ChevronDown, ChevronRight, AlertCircle } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { toast } from "sonner";
import { toolsService } from "../api/services/tools.service";
import type { MCPTool, ToolPermission } from "../context/AdminSettingsContext";

interface MCPConnector {
  id: string;
  name: string;
  type: string;
  url: string;
  auth: string;
  authToken: string;
  mcpId: string;
  description: string;
  visibility: 'private' | 'public';
  groups: string[];
  enabled: boolean;
  tools?: MCPTool[];
  lastTested?: string;
  connectionStatus?: 'unknown' | 'connected' | 'failed';
}

interface MCPEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connector?: MCPConnector | null;
  onSave: (connector: MCPConnector) => void;
  onDelete?: (id: string) => void;
}

export function MCPEditDialog({
  open,
  onOpenChange,
  connector,
  onSave,
  onDelete,
}: MCPEditDialogProps) {
  const [formData, setFormData] = useState<MCPConnector>(
    connector || {
      id: Date.now().toString(),
      name: "",
      type: "MCP Streamable HTTP",
      url: "",
      auth: "Bearer",
      authToken: "",
      mcpId: "",
      description: "",
      visibility: "private",
      groups: [],
      enabled: true,
      tools: [],
      connectionStatus: 'unknown',
    }
  );

  const [showAuthToken, setShowAuthToken] = useState(false);
  const [testing, setTesting] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latency?: number } | null>(null);
  const [toolsExpanded, setToolsExpanded] = useState(true);

  // Reset state when dialog opens with a new connector
  useEffect(() => {
    if (open) {
      setFormData(
        connector || {
          id: Date.now().toString(),
          name: "",
          type: "MCP Streamable HTTP",
          url: "",
          auth: "Bearer",
          authToken: "",
          mcpId: "",
          description: "",
          visibility: "private",
          groups: [],
          enabled: true,
          tools: [],
          connectionStatus: 'unknown',
        }
      );
      setTestResult(null);
    }
  }, [open, connector]);

  const handleSave = () => {
    if (!formData.url) {
      toast.error("URL is required");
      return;
    }
    if (!formData.name) {
      toast.error("Name is required");
      return;
    }
    onSave(formData);
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (connector && onDelete) {
      onDelete(connector.id);
      onOpenChange(false);
    }
  };

  const handleTestConnection = async () => {
    if (!formData.url) {
      toast.error("Please enter a URL first");
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const result = await toolsService.testConnection(
        formData.url,
        formData.auth,
        formData.authToken
      );

      setTestResult(result);
      setFormData(prev => ({
        ...prev,
        connectionStatus: result.success ? 'connected' : 'failed',
        lastTested: new Date().toISOString(),
      }));

      if (result.success) {
        toast.success(`Connected! Latency: ${result.latency}ms`);
      } else {
        toast.error(`Connection failed: ${result.message}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setTestResult({ success: false, message });
      toast.error(`Test failed: ${message}`);
    } finally {
      setTesting(false);
    }
  };

  const handleDiscoverTools = async () => {
    if (!formData.url) {
      toast.error("Please enter a URL first");
      return;
    }

    setDiscovering(true);

    try {
      const discoveredTools = await toolsService.discoverTools(
        formData.url,
        formData.auth,
        formData.authToken
      );

      // Merge with existing tools, preserving permissions
      const existingToolMap = new Map(
        (formData.tools || []).map(t => [t.name, t])
      );

      const mergedTools: MCPTool[] = discoveredTools.map(tool => ({
        name: tool.name,
        description: tool.description,
        permission: existingToolMap.get(tool.name)?.permission || 'ask',
      }));

      setFormData(prev => ({
        ...prev,
        tools: mergedTools,
      }));

      toast.success(`Discovered ${mergedTools.length} tools`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Failed to discover tools: ${message}`);
    } finally {
      setDiscovering(false);
    }
  };

  const handleToolPermissionChange = (toolName: string, permission: ToolPermission) => {
    setFormData(prev => ({
      ...prev,
      tools: (prev.tools || []).map(tool =>
        tool.name === toolName ? { ...tool, permission } : tool
      ),
    }));
  };

  const setAllToolPermissions = (permission: ToolPermission) => {
    setFormData(prev => ({
      ...prev,
      tools: (prev.tools || []).map(tool => ({ ...tool, permission })),
    }));
  };

  const getPermissionBadge = (permission: ToolPermission) => {
    switch (permission) {
      case 'always':
        return <Badge className="bg-green-600 text-white text-xs">Always</Badge>;
      case 'ask':
        return <Badge className="bg-yellow-600 text-white text-xs">Ask</Badge>;
      case 'never':
        return <Badge className="bg-red-600 text-white text-xs">Never</Badge>;
    }
  };

  const handleImport = () => {
    // Create file input and trigger click
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const importedData = JSON.parse(text);

        // Validate required fields
        if (!importedData.url) {
          toast.error("Invalid connector file: missing URL");
          return;
        }

        // Merge imported data with defaults, preserving the current ID if editing
        const newFormData: MCPConnector = {
          id: connector?.id || Date.now().toString(),
          name: importedData.name || '',
          type: importedData.type || 'MCP Streamable HTTP',
          url: importedData.url || '',
          auth: importedData.auth || 'None',
          authToken: '', // Never import auth tokens for security
          mcpId: importedData.mcpId || '',
          description: importedData.description || '',
          visibility: importedData.visibility || 'private',
          groups: importedData.groups || [],
          enabled: importedData.enabled ?? true,
          tools: importedData.tools || [],
          connectionStatus: 'unknown',
        };

        setFormData(newFormData);
        setTestResult(null);
        toast.success(`Imported "${newFormData.name || 'connector'}" - please add auth token if required`);
      } catch (err) {
        toast.error("Failed to parse JSON file");
        console.error('[MCPEditDialog] Import error:', err);
      }
    };
    input.click();
  };

  const handleExport = () => {
    // Export connector as JSON
    const exportData = {
      ...formData,
      authToken: '', // Don't export sensitive data
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mcp-${formData.mcpId || formData.name || 'connector'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Connector exported");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[100vw] h-[100dvh] max-w-none rounded-none sm:w-[95vw] sm:h-[90vh] sm:max-h-[90vh] sm:max-w-2xl sm:rounded-lg p-0 gap-0 flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0 px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex flex-row items-center justify-between">
          <DialogTitle>
            {connector ? "Edit MCP Connection" : "Add MCP Connection"}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleImport}
              className="cursor-pointer"
            >
              Import
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExport}
              className="cursor-pointer"
            >
              Export
            </Button>
          </div>
          <DialogDescription className="sr-only">
            Configure MCP connector settings including connection, authentication, and tool permissions
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-hidden">
          <div className="px-6 py-4 space-y-4">
            {/* Connection Type */}
            <div className="flex items-center justify-between">
              <Label htmlFor="connection-type">Type</Label>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {formData.type}
              </span>
            </div>

            {/* URL and Connection Test */}
            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <div className="flex gap-2">
                <Input
                  id="url"
                  value={formData.url}
                  onChange={(e) =>
                    setFormData({ ...formData, url: e.target.value, connectionStatus: 'unknown' })
                  }
                  placeholder="https://echo.firebird.co.nz"
                  className="flex-1"
                />
                <Button
                  size="icon"
                  variant="outline"
                  className="cursor-pointer"
                  onClick={handleTestConnection}
                  disabled={testing || !formData.url}
                  title="Test connection"
                >
                  {testing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : testResult?.success ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : testResult?.success === false ? (
                    <XCircle className="h-4 w-4 text-red-500" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
                <Switch
                  checked={formData.enabled}
                  onCheckedChange={(enabled) =>
                    setFormData({ ...formData, enabled })
                  }
                  className="data-[state=checked]:bg-green-600"
                />
              </div>
              {testResult && (
                <p className={`text-xs ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
                  {testResult.message}
                  {testResult.latency && ` (${testResult.latency}ms)`}
                </p>
              )}
            </div>

            {/* Auth */}
            <div className="space-y-2">
              <Label htmlFor="auth">Auth</Label>
              <Select
                value={formData.auth}
                onValueChange={(auth) => setFormData({ ...formData, auth })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="None">None</SelectItem>
                  <SelectItem value="Bearer">Bearer</SelectItem>
                  <SelectItem value="API Key">API Key</SelectItem>
                  <SelectItem value="OAuth">OAuth</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Auth Token */}
            {formData.auth !== "None" && (
              <div className="space-y-2">
                <Label htmlFor="auth-token">Auth Token</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="auth-token"
                      type={showAuthToken ? "text" : "password"}
                      value={formData.authToken}
                      onChange={(e) =>
                        setFormData({ ...formData, authToken: e.target.value })
                      }
                      placeholder="••••••••••••••••••••••••••••••••"
                      className="pr-10"
                    />
                  </div>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setShowAuthToken(!showAuthToken)}
                    className="cursor-pointer"
                  >
                    {showAuthToken ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            <Separator />

            {/* ID and Name */}
            <div className="space-y-2">
              <Label htmlFor="mcp-id">ID</Label>
              <Input
                id="mcp-id"
                value={formData.mcpId}
                onChange={(e) =>
                  setFormData({ ...formData, mcpId: e.target.value })
                }
                placeholder="EchoMCP"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="EchoMCP"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Echo MCP Connector"
              />
            </div>

            <Separator />

            {/* Tools Section */}
            <Collapsible open={toolsExpanded} onOpenChange={setToolsExpanded}>
              <div className="flex items-center justify-between">
                <CollapsibleTrigger className="flex items-center gap-2 hover:opacity-80">
                  {toolsExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <h4 className="font-medium flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    Tools
                    {formData.tools && formData.tools.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {formData.tools.length}
                      </Badge>
                    )}
                  </h4>
                </CollapsibleTrigger>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDiscoverTools}
                  disabled={discovering || !formData.url}
                  className="cursor-pointer"
                >
                  {discovering ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Discover Tools
                </Button>
              </div>

              <CollapsibleContent className="mt-3">
                {formData.tools && formData.tools.length > 0 ? (
                  <div className="space-y-3">
                    {/* Bulk permission actions */}
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>Set all:</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-xs"
                        onClick={() => setAllToolPermissions('always')}
                      >
                        Always
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-xs"
                        onClick={() => setAllToolPermissions('ask')}
                      >
                        Ask
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-xs"
                        onClick={() => setAllToolPermissions('never')}
                      >
                        Never
                      </Button>
                    </div>

                    {/* Tool list */}
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {formData.tools.map((tool) => (
                        <div
                          key={tool.name}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800"
                        >
                          <div className="flex-1 min-w-0 mr-3">
                            <div className="flex items-center gap-2">
                              <Wrench className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
                              <span className="font-medium text-sm truncate">{tool.name}</span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                              {tool.description}
                            </p>
                          </div>
                          <Select
                            value={tool.permission}
                            onValueChange={(value: ToolPermission) =>
                              handleToolPermissionChange(tool.name, value)
                            }
                          >
                            <SelectTrigger className="w-24 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="always">
                                <span className="text-green-600">Always</span>
                              </SelectItem>
                              <SelectItem value="ask">
                                <span className="text-yellow-600">Ask</span>
                              </SelectItem>
                              <SelectItem value="never">
                                <span className="text-red-600">Never</span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No tools discovered yet</p>
                    <p className="text-xs mt-1">Click "Discover Tools" to fetch available tools from the server</p>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>

            <Separator />

            {/* Visibility */}
            <div className="space-y-3">
              <h4 className="font-medium">Visibility</h4>
              <div className="p-4 bg-card rounded-lg border border-border">
                <div className="flex items-start gap-3">
                  <Lock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <Select
                      value={formData.visibility}
                      onValueChange={(visibility: "private" | "public") =>
                        setFormData({ ...formData, visibility })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="private">Private</SelectItem>
                        <SelectItem value="public">Public</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground mt-2">
                      Only select users and groups with permission can access
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Groups */}
            <div className="space-y-3">
              <h4 className="font-medium">Groups</h4>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select a group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="group1">Group 1</SelectItem>
                  <SelectItem value="group2">Group 2</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground px-3">
                No groups with access, add a group to grant access
              </p>
            </div>

            <Separator />

            {/* Warning */}
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Warning:</strong> MCP support is experimental and its specification changes
                often, which can lead to incompatibilities. OpenAPI specification support
                is directly maintained by the Open WebUI team, making it the more
                reliable option for compatibility.{" "}
                <button className="text-yellow-600 dark:text-yellow-400 underline hover:text-yellow-700 dark:hover:text-yellow-300 cursor-pointer">
                  Read more →
                </button>
              </p>
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex justify-between">
          {connector && onDelete ? (
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="cursor-pointer"
            >
              Delete
            </Button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="cursor-pointer">
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
