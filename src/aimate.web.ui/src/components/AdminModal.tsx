import { useState, useMemo, useEffect } from "react";
import { useDebug, useUIEventLogger } from "./DebugContext";
import { useAdminSettings } from "../context/AdminSettingsContext";
import { useAdmin } from "../hooks/useAdmin";
import { AppConfig } from "../utils/config";
import { ConnectionEditDialog } from "./ConnectionEditDialog";
import { ModelEditDialog } from "./ModelEditDialog";
import { MCPEditDialog } from "./MCPEditDialog";
import { PluginEditDialog } from "./PluginEditDialog";
import { AgentEditDialog } from "./AgentEditDialog";
import { useAgents, AgentPreset } from "../hooks/useAgents";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { ShieldCheck, Users, Database, FileText, BarChart3, Pencil, Sparkles, Search, Code, Wrench, CloudSun, Plus, Settings, Layers, Download, X, Upload, Eye, Trash2, Edit2, Puzzle, Bot, Copy, Trophy, Boxes, MoreVertical, Volume2, Image, Link2 } from "lucide-react";
import { ModelLeaderboard } from "./ModelLeaderboard";
import { CustomModelEditDialog } from "./CustomModelEditDialog";
import { useCustomModels } from "../hooks/useCustomModels";
import { PromptSuggestionsCompact } from "./PromptSuggestions";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { ScrollArea } from "./ui/scroll-area";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Separator } from "./ui/separator";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Slider } from "./ui/slider";
import { BaseModal } from "./BaseModal";
import { toast } from "sonner";

interface AdminModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enabledModels?: Record<string, boolean>;
  onToggleModel?: (modelId: string) => void;
}

export function AdminModal({ open, onOpenChange, enabledModels, onToggleModel }: AdminModalProps) {
  const { logUIEvent } = useUIEventLogger();
  const { addLog } = useDebug();

  useEffect(() => {
    if (open) {
      logUIEvent('Admin Panel opened', 'ui:admin:open');
      addLog({
        action: 'Admin Panel opened',
        category: 'admin:open',
        api: 'api/v1/GetAdminSettings',
        type: 'info'
      });
    }
  }, [open, logUIEvent, addLog]);

  // MVP visible tabs - others hidden until needed
  const visibleTabs = ['general', 'interface', 'connections', 'models', 'customModels', 'evaluation', 'agents', 'plugins', 'mcp', 'documents', 'websearch', 'images', 'audio', 'codeexecution'];

  const tabs = useMemo(() => [
    {
      id: "general",
      label: "General",
      icon: ShieldCheck,
      content: <GeneralTab />,
    },
    {
      id: "interface",
      label: "Interface",
      icon: Layers,
      content: <InterfaceTab />,
    },
    {
      id: "users",
      label: "Users & Groups",
      icon: Users,
      content: <UsersGroupsTab />,
    },
    {
      id: "connections",
      label: "Connections",
      icon: Database,
      content: <ConnectionsTab />,
    },
    {
      id: "models",
      label: "Models",
      icon: BarChart3,
      content: <ModelsTab enabledModels={enabledModels} onToggleModel={onToggleModel} />,
    },
    {
      id: "customModels",
      label: "Custom Models",
      icon: Boxes,
      content: <CustomModelsTab />,
    },
    {
      id: "evaluation",
      label: "Evaluation",
      icon: Trophy,
      content: <EvaluationTab />,
    },
    {
      id: "agents",
      label: "Agents",
      icon: Bot,
      content: <AgentsTab />,
    },
    {
      id: "plugins",
      label: "Plugins",
      icon: Puzzle,
      content: <PluginsTab />,
    },
    {
      id: "mcp",
      label: "MCP",
      icon: Database,
      content: <MCPTab />,
    },
    {
      id: "documents",
      label: "Documents",
      icon: FileText,
      content: <DocumentsTab />,
    },
    {
      id: "websearch",
      label: "Web Search",
      icon: Search,
      content: <WebSearchTab />,
    },
    {
      id: "codeexecution",
      label: "Code Execution",
      icon: Code,
      content: <CodeExecutionTab />,
    },
    {
      id: "audio",
      label: "Audio",
      icon: Volume2,
      content: <AudioTab />,
    },
    {
      id: "images",
      label: "Images",
      icon: Sparkles,
      content: <ImagesTab />,
    },
  ].filter(tab => visibleTabs.includes(tab.id)), [enabledModels, onToggleModel]);

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Admin Panel"
      description="Administrator settings and configurations"
      icon={ShieldCheck}
      size="lg"
      showSave={false}
      showDelete={false}
      tabs={tabs}
    />
  );
}

function GeneralTab() {
  const { debugEnabled, setDebugEnabled, addLog, debugSettings, updateDebugSettings } = useDebug();
  const { settings, updateGeneral } = useAdminSettings();
  const [offlineMode, setOfflineModeState] = useState(AppConfig.isOfflineMode());

  const handleOfflineModeChange = (checked: boolean) => {
    AppConfig.setOfflineMode(checked);
    setOfflineModeState(checked);
    addLog({
      action: `Offline mode: ${checked ? 'enabled' : 'disabled'}`,
      category: 'admin:general:offline',
      api: 'api/v1/admin/settings/general',
      payload: { offlineMode: checked },
      type: 'info'
    });
    // Reload to apply offline mode change across all components
    window.location.reload();
  };

  const handleAdminEnabledChange = (checked: boolean) => {
    updateGeneral({ adminEnabled: checked });
    addLog({
      action: `Admin panel: ${checked ? 'enabled' : 'disabled'}`,
      category: 'admin:general:admin',
      api: 'api/v1/admin/settings/general',
      payload: { adminEnabled: checked },
      type: 'info'
    });
  };

  const handleUserRegistrationChange = (checked: boolean) => {
    updateGeneral({ userRegistration: checked });
    addLog({
      action: `User registration: ${checked ? 'enabled' : 'disabled'}`,
      category: 'admin:general:registration',
      api: 'api/v1/admin/settings/general',
      payload: { userRegistration: checked },
      type: 'info'
    });
  };

  const handleApiAccessChange = (checked: boolean) => {
    updateGeneral({ apiAccess: checked });
    addLog({
      action: `API access: ${checked ? 'enabled' : 'disabled'}`,
      category: 'admin:general:api',
      api: 'api/v1/admin/settings/general',
      payload: { apiAccess: checked },
      type: 'info'
    });
  };

  const handleDebugModeChange = (checked: boolean) => {
    setDebugEnabled(checked);
    addLog({
      action: `Debug mode: ${checked ? 'enabled' : 'disabled'}`,
      category: 'admin:general:debug',
      api: 'api/v1/admin/settings/general',
      payload: { debugEnabled: checked },
      type: checked ? 'success' : 'warning'
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold mb-3">General Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="admin-enabled">Enable Admin Panel</Label>
            <Switch
              id="admin-enabled"
              checked={settings.general.adminEnabled}
              onCheckedChange={handleAdminEnabledChange}
              className="data-[state=checked]:bg-purple-600"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="user-registration">Allow User Registration</Label>
            <Switch
              id="user-registration"
              checked={settings.general.userRegistration}
              onCheckedChange={handleUserRegistrationChange}
              className="data-[state=checked]:bg-purple-600"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="api-access">Enable API Access</Label>
            <Switch
              id="api-access"
              checked={settings.general.apiAccess}
              onCheckedChange={handleApiAccessChange}
              className="data-[state=checked]:bg-purple-600"
            />
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="font-semibold mb-3">Developer Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="offline-mode">Offline Mode</Label>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Use mock data instead of live APIs (persists in browser storage)
              </p>
            </div>
            <Switch
              id="offline-mode"
              checked={offlineMode}
              onCheckedChange={handleOfflineModeChange}
              className="data-[state=checked]:bg-purple-600"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="debug-mode">Debug Mode</Label>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Display debug console with API calls and payloads
              </p>
            </div>
            <Switch
              id="debug-mode"
              checked={debugEnabled}
              onCheckedChange={handleDebugModeChange}
              className="data-[state=checked]:bg-purple-600"
            />
          </div>
        </div>
      </div>

      {debugEnabled && (
        <>
          <Separator />

          <div>
            <h3 className="font-semibold mb-3">Debug Configuration</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-payloads">Show Request Payloads</Label>
                <Switch
                  id="show-payloads"
                  checked={debugSettings.showPayloads}
                  onCheckedChange={(v) => updateDebugSettings({ showPayloads: v })}
                  className="data-[state=checked]:bg-purple-600"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="show-responses">Show API Responses</Label>
                <Switch
                  id="show-responses"
                  checked={debugSettings.showResponses}
                  onCheckedChange={(v) => updateDebugSettings({ showResponses: v })}
                  className="data-[state=checked]:bg-purple-600"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="show-timestamps">Show Timestamps</Label>
                <Switch
                  id="show-timestamps"
                  checked={debugSettings.showTimestamps}
                  onCheckedChange={(v) => updateDebugSettings({ showTimestamps: v })}
                  className="data-[state=checked]:bg-purple-600"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="log-ui-events">Log UI Events</Label>
                <Switch
                  id="log-ui-events"
                  checked={debugSettings.logUIEvents}
                  onCheckedChange={(v) => updateDebugSettings({ logUIEvents: v })}
                  className="data-[state=checked]:bg-purple-600"
                />
              </div>

              <Separator />

              <div>
                <Label className="mb-2 block">Log Levels</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="log-info" className="text-sm">Info</Label>
                    <Switch
                      id="log-info"
                      checked={debugSettings.logLevels.info}
                      onCheckedChange={(v) => updateDebugSettings({ logLevels: { ...debugSettings.logLevels, info: v } })}
                      className="data-[state=checked]:bg-purple-600"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="log-success" className="text-sm">Success</Label>
                    <Switch
                      id="log-success"
                      checked={debugSettings.logLevels.success}
                      onCheckedChange={(v) => updateDebugSettings({ logLevels: { ...debugSettings.logLevels, success: v } })}
                      className="data-[state=checked]:bg-purple-600"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="log-warning" className="text-sm">Warning</Label>
                    <Switch
                      id="log-warning"
                      checked={debugSettings.logLevels.warning}
                      onCheckedChange={(v) => updateDebugSettings({ logLevels: { ...debugSettings.logLevels, warning: v } })}
                      className="data-[state=checked]:bg-purple-600"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="log-error" className="text-sm">Error</Label>
                    <Switch
                      id="log-error"
                      checked={debugSettings.logLevels.error}
                      onCheckedChange={(v) => updateDebugSettings({ logLevels: { ...debugSettings.logLevels, error: v } })}
                      className="data-[state=checked]:bg-purple-600"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-logs">Maximum Log Entries</Label>
                <Input
                  id="max-logs"
                  type="number"
                  value={debugSettings.maxLogs}
                  onChange={(e) => updateDebugSettings({ maxLogs: parseInt(e.target.value) || 200 })}
                  min={50}
                  max={1000}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function InterfaceTab() {
  const { settings, updateInterface } = useAdminSettings();
  const iface = settings.interface;

  const addBanner = () => {
    updateInterface({
      banners: [...iface.banners, { id: Date.now().toString(), type: "Type", text: "Test", enabled: true }]
    });
  };

  const removeBanner = (id: string) => {
    updateInterface({
      banners: iface.banners.filter(b => b.id !== id)
    });
  };

  const updateBanner = (id: string, updates: Partial<typeof iface.banners[0]>) => {
    updateInterface({
      banners: iface.banners.map(b => b.id === id ? { ...b, ...updates } : b)
    });
  };

  const addPromptSuggestion = () => {
    updateInterface({
      promptSuggestions: [...iface.promptSuggestions, {
        id: Date.now().toString(),
        title: "Title (e.g. Tell me a fun fact)",
        subtitle: "Subtitle (e.g. about the Roman Empire)",
        prompt: "Prompt (e.g. Tell me a fun fact about the Roman Empire)"
      }]
    });
  };

  const removePromptSuggestion = (id: string) => {
    updateInterface({
      promptSuggestions: iface.promptSuggestions.filter(p => p.id !== id)
    });
  };

  const updatePromptSuggestion = (id: string, updates: Partial<typeof iface.promptSuggestions[0]>) => {
    updateInterface({
      promptSuggestions: iface.promptSuggestions.map(p => p.id === id ? { ...p, ...updates } : p)
    });
  };

  return (
    <div className="space-y-6">
      {/* Task Model */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h3 className="font-semibold">Task Model</h3>
          <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
            onClick={() => alert('Task Models are used for automatic tasks like title generation and query rewriting.')}
            title="Task Models are used for automatic tasks like title generation and query rewriting."
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <circle cx="12" cy="12" r="10" strokeWidth="2" />
              <text x="12" y="16" textAnchor="middle" className="text-xs" fill="currentColor">?</text>
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <Label>Local Task Model</Label>
            <Select value={iface.localTaskModel} onValueChange={(v) => updateInterface({ localTaskModel: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Current Model">Current Model</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>External Task Model</Label>
            <Select value={iface.externalTaskModel} onValueChange={(v) => updateInterface({ externalTaskModel: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Current Model">Current Model</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      {/* Title Generation */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Title Generation</h3>
          <Switch
            checked={iface.titleGeneration}
            onCheckedChange={(v) => updateInterface({ titleGeneration: v })}
            className="data-[state=checked]:bg-purple-600"
          />
        </div>
        <div className="space-y-2">
          <Label>Title Generation Prompt</Label>
          <Textarea
            value={iface.titleGenerationPrompt}
            onChange={(e) => updateInterface({ titleGenerationPrompt: e.target.value })}
            className="min-h-[60px]"
            placeholder="Leave empty to use the default prompt, or enter a custom prompt"
          />
        </div>
      </div>

      {/* Toggle Sections */}
      <div className="flex items-center justify-between">
        <Label>Follow Up Generation</Label>
        <Switch
          checked={iface.followUpGeneration}
          onCheckedChange={(v) => updateInterface({ followUpGeneration: v })}
          className="data-[state=checked]:bg-purple-600"
        />
      </div>

      <div className="flex items-center justify-between">
        <Label>Tags Generation</Label>
        <Switch
          checked={iface.tagsGeneration}
          onCheckedChange={(v) => updateInterface({ tagsGeneration: v })}
          className="data-[state=checked]:bg-purple-600"
        />
      </div>

      <div className="flex items-center justify-between">
        <Label>Retrieval Query Generation</Label>
        <Switch
          checked={iface.retrievalQueryGeneration}
          onCheckedChange={(v) => updateInterface({ retrievalQueryGeneration: v })}
          className="data-[state=checked]:bg-purple-600"
        />
      </div>

      <div className="flex items-center justify-between">
        <Label>Web Search Query Generation</Label>
        <Switch
          checked={iface.webSearchQueryGeneration}
          onCheckedChange={(v) => updateInterface({ webSearchQueryGeneration: v })}
          className="data-[state=checked]:bg-purple-600"
        />
      </div>

      {/* Query Generation Prompt */}
      <div className="space-y-2">
        <Label>Query Generation Prompt</Label>
        <Textarea
          value={iface.queryGenerationPrompt}
          onChange={(e) => updateInterface({ queryGenerationPrompt: e.target.value })}
          className="min-h-[60px]"
          placeholder="Leave empty to use the default prompt, or enter a custom prompt"
        />
      </div>

      <div className="flex items-center justify-between">
        <Label>Autocomplete Generation</Label>
        <Switch
          checked={iface.autocompleteGeneration}
          onCheckedChange={(v) => updateInterface({ autocompleteGeneration: v })}
          className="data-[state=checked]:bg-purple-600"
        />
      </div>

      {/* Image Prompt Generation Prompt */}
      <div className="space-y-2">
        <Label>Image Prompt Generation Prompt</Label>
        <Textarea
          value={iface.imagePromptGenerationPrompt}
          onChange={(e) => updateInterface({ imagePromptGenerationPrompt: e.target.value })}
          className="min-h-[60px]"
          placeholder="Leave empty to use the default prompt, or enter a custom prompt"
        />
      </div>

      {/* Tools Function Calling Prompt */}
      <div className="space-y-2">
        <Label>Tools Function Calling Prompt</Label>
        <Textarea
          value={iface.toolsFunctionCallingPrompt}
          onChange={(e) => updateInterface({ toolsFunctionCallingPrompt: e.target.value })}
          className="min-h-[60px]"
          placeholder="Leave empty to use the default prompt, or enter a custom prompt"
        />
      </div>

      <Separator />

      {/* UI Section */}
      <div>
        <h3 className="font-semibold mb-4">UI</h3>

        {/* Banners */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <Label>Banners</Label>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 cursor-pointer"
              onClick={addBanner}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {iface.banners.map((banner) => (
            <div key={banner.id} className="flex gap-2 items-center p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <div className="flex gap-2 flex-1">
                <Select value={banner.type} onValueChange={(v) => updateBanner(banner.id, { type: v })}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Type">Type</SelectItem>
                    <SelectItem value="Info">Info</SelectItem>
                    <SelectItem value="Warning">Warning</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={banner.text}
                  onChange={(e) => updateBanner(banner.id, { text: e.target.value })}
                  className="flex-1"
                />
              </div>
              <div className="flex gap-1">
                <Switch
                  checked={banner.enabled}
                  onCheckedChange={(v) => updateBanner(banner.id, { enabled: v })}
                  className="data-[state=checked]:bg-purple-600"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 cursor-pointer"
                  onClick={() => removeBanner(banner.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Default Prompt Suggestions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Default Prompt Suggestions</Label>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 cursor-pointer"
              onClick={addPromptSuggestion}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {iface.promptSuggestions.map((suggestion) => (
            <div key={suggestion.id} className="space-y-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg relative">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 absolute top-2 right-2 cursor-pointer"
                onClick={() => removePromptSuggestion(suggestion.id)}
              >
                <X className="h-3 w-3" />
              </Button>
              <Input
                value={suggestion.title}
                onChange={(e) => updatePromptSuggestion(suggestion.id, { title: e.target.value })}
                className="text-sm"
              />
              <Input
                value={suggestion.subtitle}
                onChange={(e) => updatePromptSuggestion(suggestion.id, { subtitle: e.target.value })}
                className="text-xs text-gray-500 dark:text-gray-400"
              />
              <Textarea
                value={suggestion.prompt}
                onChange={(e) => updatePromptSuggestion(suggestion.id, { prompt: e.target.value })}
                className="min-h-[60px] text-sm"
              />
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Note */}
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Adjusting these settings will apply changes universally to all users.
      </p>

      {/* Import/Export Buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="cursor-pointer"
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                  try {
                    const suggestions = JSON.parse(event.target?.result as string);
                    updateInterface({ promptSuggestions: suggestions });
                  } catch {
                    alert('Invalid JSON file');
                  }
                };
                reader.readAsText(file);
              }
            };
            input.click();
          }}
        >
          <Upload className="h-4 w-4 mr-2" />
          Import Prompt Suggestions
        </Button>
        <Button
          variant="outline"
          className="cursor-pointer"
          onClick={() => {
            const element = document.createElement('a');
            element.setAttribute('href', `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(iface.promptSuggestions, null, 2))}`);
            element.setAttribute('download', `prompt-suggestions-${new Date().toISOString().split('T')[0]}.json`);
            element.style.display = 'none';
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
          }}
        >
          <Download className="h-4 w-4 mr-2" />
          Export Prompt Suggestions ({iface.promptSuggestions.length})
        </Button>
      </div>
    </div>
  );
}

function UsersGroupsTab() {
  const [view, setView] = useState<"users" | "groups" | "roles">("users");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editType, setEditType] = useState<"user" | "group" | "role">("user");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const { users: apiUsers } = useAdmin();

  const users = apiUsers.map(u => ({
    id: u.id,
    name: u.username,
    email: u.email,
    role: u.userTier,
    group: u.userTier === 'Admin' ? 'Admins' : u.userTier === 'BYOK' ? 'Power Users' : 'Users',
  }));

  const [groups, setGroups] = useState([
    {
      id: "1",
      name: "Admins",
      users: 1,
      maxMessages: "Unlimited",
      canAddTools: true,
      canCreateProjects: true,
      canUseWebSearch: true,
      canUseCodeInterpreter: true,
    },
    {
      id: "2",
      name: "Power Users",
      users: 1,
      maxMessages: "500/day",
      canAddTools: true,
      canCreateProjects: true,
      canUseWebSearch: true,
      canUseCodeInterpreter: false,
    },
    {
      id: "3",
      name: "Users",
      users: 1,
      maxMessages: "100/day",
      canAddTools: false,
      canCreateProjects: false,
      canUseWebSearch: true,
      canUseCodeInterpreter: false,
    },
  ]);

  const handleEdit = (item: any, type: "user" | "group") => {
    setSelectedItem(item);
    setEditType(type);
    setEditDialogOpen(true);
  };

  const handleAdd = (type: "user" | "group") => {
    setSelectedItem(null);
    setEditType(type);
    setEditDialogOpen(true);
  };

  const handleSave = (item: any) => {
    if (editType === "user") {
      if (selectedItem) {
        // setUsers(users.map((u) => (u.id === item.id ? item : u)));
        console.warn('User editing not yet implemented - users are managed via API');
      } else {
        // setUsers([...users, { ...item, id: Date.now().toString() }]);
        console.warn('User creation not yet implemented - users are managed via API');
      }
    } else {
      if (selectedItem) {
        setGroups(groups.map((g) => (g.id === item.id ? item : g)));
      } else {
        setGroups([...groups, { ...item, id: Date.now().toString(), users: 0 }]);
      }
    }
    setEditDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (editType === "user") {
      // setUsers(users.filter((u) => u.id !== id));
      console.warn('User deletion not yet implemented - users are managed via API');
    } else {
      setGroups(groups.filter((g) => g.id !== id));
    }
    setEditDialogOpen(false);
  };

  return (
    <>
      {/* User/Group Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="w-[100vw] h-auto max-h-[90vh] max-w-none rounded-none sm:w-[95vw] sm:max-w-xl sm:rounded-lg md:max-w-2xl p-0 gap-0 flex flex-col">
          <DialogHeader className="flex-shrink-0 px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <DialogTitle>
              {selectedItem ? `Edit ${editType === "user" ? "User" : "Group"}` : `Add ${editType === "user" ? "User" : "Group"}`}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 overflow-hidden">
            <div className="px-6 py-4 space-y-4">
              {editType === "user" ? (
                <UserForm item={selectedItem} onSave={handleSave} />
              ) : (
                <GroupForm item={selectedItem} onSave={handleSave} />
              )}
            </div>
          </ScrollArea>

          <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex justify-between">
            {selectedItem ? (
              <Button variant="destructive" onClick={() => handleDelete(selectedItem.id)} className="cursor-pointer">
                Delete
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="cursor-pointer">
                Cancel
              </Button>
              <Button onClick={() => {
                // Get form data from form component via ref or state
                const formElement = document.querySelector('form');
                if (formElement) {
                  const formData = new FormData(formElement);
                  handleSave(Object.fromEntries(formData));
                }
              }} className="cursor-pointer">
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        {/* View Toggle */}
        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg w-fit">
          <Button
            variant={view === "users" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("users")}
            className="cursor-pointer"
          >
            Users
          </Button>
          <Button
            variant={view === "groups" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("groups")}
            className="cursor-pointer"
          >
            Groups
          </Button>
        </div>

        {view === "users" ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">User Management</h3>
              <Button onClick={() => handleAdd("user")} size="sm" className="cursor-pointer">
                <Plus className="h-4 w-4 mr-1" />
                Add User
              </Button>
            </div>
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <span className="text-purple-600 dark:text-purple-400 font-medium">
                        {user.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium">{user.name}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Role: </span>
                      <span className="font-medium">{user.role}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Group: </span>
                      <span className="font-medium">{user.group}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 cursor-pointer"
                      onClick={() => handleEdit(user, "user")}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Group Management</h3>
              <Button onClick={() => handleAdd("group")} size="sm" className="cursor-pointer">
                <Plus className="h-4 w-4 mr-1" />
                Add Group
              </Button>
            </div>
            <div className="space-y-2">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-purple-500" />
                      <div>
                        <h4 className="font-medium">{group.name}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{group.users} users</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 cursor-pointer"
                      onClick={() => handleEdit(group, "group")}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Messages: </span>
                      <span>{group.maxMessages}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Add Tools: </span>
                      <span>{group.canAddTools ? "✓" : "✗"}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Create Projects: </span>
                      <span>{group.canCreateProjects ? "✓" : "✗"}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Web Search: </span>
                      <span>{group.canUseWebSearch ? "✓" : "✗"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function UserForm({ item, onSave }: { item: any; onSave: (item: any) => void }) {
  const [formData, setFormData] = useState(item || {
    name: "",
    email: "",
    role: "User",
    group: "Users",
  });

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="user-name">Name</Label>
        <Input
          id="user-name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="User name"
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="user-email">Email</Label>
        <Input
          id="user-email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="user@example.com"
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="user-role">Role</Label>
        <Select value={formData.role} onValueChange={(role) => setFormData({ ...formData, role })}>
          <SelectTrigger className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Admin">Admin</SelectItem>
            <SelectItem value="User">User</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="user-group">Group</Label>
        <Select value={formData.group} onValueChange={(group) => setFormData({ ...formData, group })}>
          <SelectTrigger className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Admins">Admins</SelectItem>
            <SelectItem value="Power Users">Power Users</SelectItem>
            <SelectItem value="Users">Users</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <div>
        <h3 className="font-semibold mb-3">Password</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="user-password">New Password</Label>
            <Input
              id="user-password"
              type="password"
              placeholder="Leave empty to keep current password"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="user-confirm-password">Confirm Password</Label>
            <Input
              id="user-confirm-password"
              type="password"
              placeholder="Confirm new password"
              className="mt-2"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function GroupForm({ item, onSave }: { item: any; onSave: (item: any) => void }) {
  const [formData, setFormData] = useState(item || {
    name: "",
    maxMessages: "100/day",
    canAddTools: false,
    canCreateProjects: false,
    canUseWebSearch: true,
    canUseCodeInterpreter: false,
    canUploadFiles: true,
    canAccessKnowledge: true,
  });

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="group-name">Group Name</Label>
        <Input
          id="group-name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Group name"
          className="mt-2"
        />
      </div>

      <Separator />

      <div>
        <h3 className="font-semibold mb-3">Limits</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="max-messages">Max Messages</Label>
            <Select
              value={formData.maxMessages}
              onValueChange={(maxMessages) => setFormData({ ...formData, maxMessages })}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Unlimited">Unlimited</SelectItem>
                <SelectItem value="500/day">500 per day</SelectItem>
                <SelectItem value="100/day">100 per day</SelectItem>
                <SelectItem value="50/day">50 per day</SelectItem>
                <SelectItem value="10/day">10 per day</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="font-semibold mb-3">Capabilities</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="can-add-tools">Add Tools</Label>
            <Switch
              id="can-add-tools"
              checked={formData.canAddTools}
              onCheckedChange={(canAddTools) => setFormData({ ...formData, canAddTools })}
              className="data-[state=checked]:bg-purple-600"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="can-create-projects">Create Projects</Label>
            <Switch
              id="can-create-projects"
              checked={formData.canCreateProjects}
              onCheckedChange={(canCreateProjects) => setFormData({ ...formData, canCreateProjects })}
              className="data-[state=checked]:bg-purple-600"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="can-use-websearch">Use Web Search</Label>
            <Switch
              id="can-use-websearch"
              checked={formData.canUseWebSearch}
              onCheckedChange={(canUseWebSearch) => setFormData({ ...formData, canUseWebSearch })}
              className="data-[state=checked]:bg-purple-600"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="can-use-code">Use Code Interpreter</Label>
            <Switch
              id="can-use-code"
              checked={formData.canUseCodeInterpreter}
              onCheckedChange={(canUseCodeInterpreter) => setFormData({ ...formData, canUseCodeInterpreter })}
              className="data-[state=checked]:bg-purple-600"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="can-upload">Upload Files</Label>
            <Switch
              id="can-upload"
              checked={formData.canUploadFiles}
              onCheckedChange={(canUploadFiles) => setFormData({ ...formData, canUploadFiles })}
              className="data-[state=checked]:bg-purple-600"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="can-knowledge">Access Knowledge Base</Label>
            <Switch
              id="can-knowledge"
              checked={formData.canAccessKnowledge}
              onCheckedChange={(canAccessKnowledge) => setFormData({ ...formData, canAccessKnowledge })}
              className="data-[state=checked]:bg-purple-600"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ConnectionsTab() {
  const { addLog } = useDebug();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<any>(null);
  const { connections, toggleConnection, createConnection, updateConnection, deleteConnection: deleteConnectionApi, testConnection, addModelsFromConnection } = useAdmin();

  // Map ConnectionDto to dialog Connection format
  const mapToDialogConnection = (conn: any) => ({
    id: conn.id,
    name: conn.name,
    type: conn.provider || 'Custom',
    url: conn.url || '',
    auth: 'None',
    headers: '',
    prefixId: '',
    providerType: conn.provider || 'Custom',
    modelIds: conn.models || [],
    tags: [],
    enabled: conn.isActive ?? conn.enabled ?? true,
  });

  const handleEdit = (connection: any) => {
    setSelectedConnection(mapToDialogConnection(connection));
    setEditDialogOpen(true);
    addLog({
      action: `Editing connection: ${connection.name}`,
      category: 'admin:connections:edit',
      payload: { connectionId: connection.id, name: connection.name },
      type: 'info'
    });
  };

  const handleAdd = () => {
    setSelectedConnection(null);
    setEditDialogOpen(true);
    addLog({
      action: 'Adding new connection',
      category: 'admin:connections:add',
      type: 'info'
    });
  };

  const handleSave = async (connection: any) => {
    try {
      if (selectedConnection) {
        await updateConnection(connection.id, connection);
        addLog({
          action: `Connection updated: ${connection.name}`,
          category: 'admin:connections:update',
          api: 'api/v1/admin/connections',
          payload: connection,
          type: 'success'
        });
      } else {
        await createConnection(connection);
        addLog({
          action: `Connection created: ${connection.name}`,
          category: 'admin:connections:create',
          api: 'api/v1/admin/connections',
          payload: connection,
          type: 'success'
        });
      }
      setEditDialogOpen(false);
    } catch (err) {
      console.error('[ConnectionsTab] Failed to save connection:', err);
      addLog({
        action: `Failed to save connection: ${connection.name}`,
        category: 'admin:connections:error',
        payload: { error: String(err) },
        type: 'error'
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const conn = connections.find(c => c.id === id);
      await deleteConnectionApi(id);
      addLog({
        action: `Connection deleted: ${conn?.name || id}`,
        category: 'admin:connections:delete',
        api: 'api/v1/admin/connections',
        payload: { connectionId: id },
        type: 'warning'
      });
      setEditDialogOpen(false);
    } catch (err) {
      console.error('[ConnectionsTab] Failed to delete connection:', err);
      addLog({
        action: 'Failed to delete connection',
        category: 'admin:connections:error',
        payload: { error: String(err) },
        type: 'error'
      });
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const conn = connections.find(c => c.id === id);
      const newState = !conn?.enabled;
      await toggleConnection(id);
      addLog({
        action: `${conn?.name}: ${newState ? 'enabled' : 'disabled'}`,
        category: 'admin:connections:toggle',
        api: 'api/v1/admin/connections/toggle',
        payload: { connectionId: id, enabled: newState, name: conn?.name },
        type: 'info'
      });
    } catch (err) {
      console.error('[ConnectionsTab] Failed to toggle connection:', err);
      addLog({
        action: 'Failed to toggle connection',
        category: 'admin:connections:error',
        payload: { error: String(err) },
        type: 'error'
      });
    }
  };

  return (
    <>
      <ConnectionEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        connection={selectedConnection}
        onSave={handleSave}
        onDelete={selectedConnection ? handleDelete : undefined}
        onAddModelsToList={(models) => {
          addModelsFromConnection(models);
          addLog({
            action: `Added ${models.length} models to Models list`,
            category: 'admin:models:bulk-add',
            payload: { models: models.map(m => m.id) },
            type: 'success'
          });
        }}
      />
      <div className="space-y-4">
        {/* OpenAI-Compatible Connections */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">OpenAI-Compatible Connections</h3>
            <Button
              size="sm"
              variant="outline"
              onClick={handleAdd}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Connection
            </Button>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Connect to any OpenAI-compatible API: LM Studio, Ollama, OpenRouter, LiteLLM, OpenAI, Anthropic (via proxy), and more.
          </p>
          <div className="space-y-2">
            {connections.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p className="text-sm">No connections configured.</p>
                <p className="text-xs mt-1">Click "Add Connection" to get started.</p>
              </div>
            ) : (
              connections.map((connection) => (
                <div
                  key={connection.id}
                  className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{connection.name}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500">
                        {connection.provider || 'Custom'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      {connection.url || 'No URL configured'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <Switch
                      checked={connection.isActive ?? connection.enabled}
                      onCheckedChange={() => handleToggle(connection.id)}
                      className="data-[state=checked]:bg-purple-600"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => handleEdit(connection)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}

interface ModelsTabProps {
  enabledModels?: Record<string, boolean>;
  onToggleModel?: (modelId: string) => void;
}

function ModelsTab({ enabledModels, onToggleModel }: ModelsTabProps) {
  const { addLog } = useDebug();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<any>(null);
  const { models, toggleModel, createModel, updateModel, deleteModel: deleteModelApi } = useAdmin();

  const handleEdit = (model: any) => {
    setSelectedModel(model);
    setEditDialogOpen(true);
    addLog({
      action: `Editing model: ${model.name}`,
      category: 'admin:models:edit',
      payload: { modelId: model.id, name: model.name },
      type: 'info'
    });
  };

  const handleAdd = () => {
    setSelectedModel(null);
    setEditDialogOpen(true);
    addLog({
      action: 'Adding new model',
      category: 'admin:models:add',
      type: 'info'
    });
  };

  const handleSave = async (model: any) => {
    try {
      if (selectedModel) {
        await updateModel(model.id, model);
        addLog({
          action: `Model updated: ${model.name}`,
          category: 'admin:models:update',
          api: 'api/v1/admin/models',
          payload: model,
          type: 'success'
        });
      } else {
        await createModel(model);
        addLog({
          action: `Model created: ${model.name}`,
          category: 'admin:models:create',
          api: 'api/v1/admin/models',
          payload: model,
          type: 'success'
        });
      }
      setEditDialogOpen(false);
    } catch (err) {
      console.error('[ModelsTab] Failed to save model:', err);
      addLog({
        action: `Failed to save model: ${model.name}`,
        category: 'admin:models:error',
        payload: { error: String(err) },
        type: 'error'
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const model = models.find(m => m.id === id);
      await deleteModelApi(id);
      addLog({
        action: `Model deleted: ${model?.name || id}`,
        category: 'admin:models:delete',
        api: 'api/v1/admin/models',
        payload: { modelId: id },
        type: 'warning'
      });
      setEditDialogOpen(false);
    } catch (err) {
      console.error('[ModelsTab] Failed to delete model:', err);
      addLog({
        action: 'Failed to delete model',
        category: 'admin:models:error',
        payload: { error: String(err) },
        type: 'error'
      });
    }
  };

  const handleToggleModel = async (id: string) => {
    const model = models.find(m => m.id === id);
    const newState = !model?.isActive;
    try {
      await toggleModel(id);
      addLog({
        action: `${model?.name}: ${newState ? 'enabled' : 'disabled'}`,
        category: 'admin:models:toggle',
        api: 'api/v1/admin/models/toggle',
        payload: { modelId: id, enabled: newState, name: model?.name },
        type: 'info'
      });
    } catch (err) {
      console.error('[ModelsTab] Failed to toggle model:', err);
      addLog({
        action: 'Failed to toggle model',
        category: 'admin:models:error',
        payload: { error: String(err) },
        type: 'error'
      });
    }
  };

  return (
    <>
      <ModelEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        model={selectedModel}
        onSave={handleSave}
        onDelete={selectedModel ? handleDelete : undefined}
      />
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">AI Models Configuration</h3>
            <Button onClick={handleAdd} size="sm" className="cursor-pointer">
              <Plus className="h-4 w-4 mr-1" />
              Add Model
            </Button>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Enable or disable models to show/hide them in the main dropdown
          </p>
          <div className="space-y-2">
            {models.map((model) => (
              <div
                key={model.id}
                className="p-3 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Sparkles className={`h-4 w-4 ${model.color || 'text-purple-500'}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">{model.name}</h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400">via {model.provider}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {model.contextWindow?.toLocaleString()} tokens | {model.capabilities?.join(', ') || 'General purpose'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 cursor-pointer"
                      onClick={() => handleEdit(model)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Switch
                      checked={model.isActive}
                      onCheckedChange={() => handleToggleModel(model.id)}
                      className="data-[state=checked]:bg-purple-600"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function PluginsTab() {
  const { addLog } = useDebug();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPlugin, setSelectedPlugin] = useState<any>(null);
  const [plugins, setPlugins] = useState([
    {
      id: "web-search",
      name: "Web Search",
      icon: Search,
      description: "Search the web for real-time information",
      enabled: false,
      parameters: [
        { name: "api_key", type: "string", value: "", required: true },
        { name: "max_results", type: "number", value: "10", required: false },
      ]
    },
    {
      id: "code-interpreter",
      name: "Code Interpreter",
      icon: Code,
      description: "Execute Python code and analyze data",
      enabled: true,
      parameters: [
        { name: "timeout", type: "number", value: "30", required: false },
      ]
    },
    {
      id: "file-management",
      name: "Supreme File Management",
      icon: Wrench,
      description: "Advanced file operations and management",
      enabled: false,
      parameters: []
    },
    {
      id: "weather-forecast",
      name: "Weather Forecast",
      icon: CloudSun,
      description: "Get weather forecasts and conditions",
      enabled: false,
      parameters: [
        { name: "api_key", type: "string", value: "", required: true },
        { name: "units", type: "string", value: "metric", required: false },
      ]
    },
    {
      id: "echo-mcp",
      name: "EchoMCP",
      icon: Wrench,
      description: "Model Context Protocol integration",
      enabled: true,
      parameters: []
    },
  ]);

  const handleEdit = (plugin: any) => {
    setSelectedPlugin(plugin);
    setEditDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedPlugin(null);
    setEditDialogOpen(true);
  };

  const handleSave = (plugin: any) => {
    if (selectedPlugin) {
      setPlugins(plugins.map((p) => (p.id === plugin.id ? { ...plugin, icon: p.icon } : p)));
      addLog({
        action: `Plugin updated: ${plugin.name}`,
        category: `plugin:${plugin.id}:update`,
        api: 'api/v1/admin/plugins',
        payload: plugin,
        type: 'success'
      });
    } else {
      setPlugins([...plugins, { ...plugin, icon: Wrench }]);
      addLog({
        action: `Plugin created: ${plugin.name}`,
        category: `plugin:${plugin.id}:create`,
        api: 'api/v1/admin/plugins',
        payload: plugin,
        type: 'success'
      });
    }
  };

  const handleDelete = (id: string) => {
    const plugin = plugins.find(p => p.id === id);
    setPlugins(plugins.filter((p) => p.id !== id));
    addLog({
      action: `Plugin deleted: ${plugin?.name}`,
      category: `plugin:${id}:delete`,
      api: 'api/v1/admin/plugins',
      payload: { pluginId: id },
      type: 'warning'
    });
  };

  const togglePlugin = (id: string) => {
    const plugin = plugins.find(p => p.id === id);
    const newEnabled = !plugin?.enabled;
    setPlugins(plugins.map((p) => (p.id === id ? { ...p, enabled: newEnabled } : p)));
    addLog({
      action: `${plugin?.name}: ${newEnabled ? 'enabled' : 'disabled'}`,
      category: `plugin:${id}:toggle`,
      api: 'api/v1/admin/plugins',
      payload: {
        pluginId: id,
        enabled: newEnabled,
        parameters: plugin?.parameters
      },
      type: 'info'
    });
  };

  return (
    <>
      <PluginEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        plugin={selectedPlugin}
        onSave={handleSave}
        onDelete={selectedPlugin ? handleDelete : undefined}
      />
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Available Plugins</h3>
            <Button onClick={handleAdd} size="sm" className="cursor-pointer">
              <Plus className="h-4 w-4 mr-1" />
              Add Plugin
            </Button>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Manage available tools and plugins for the AI assistant
          </p>
          <div className="space-y-3">
            {plugins.map((plugin) => {
              const Icon = plugin.icon;
              return (
                <div key={plugin.id} className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <Icon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      <div className="flex-1">
                        <h4 className="font-medium">{plugin.name}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{plugin.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 cursor-pointer"
                        onClick={() => handleEdit(plugin)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Switch
                        checked={plugin.enabled}
                        onCheckedChange={() => togglePlugin(plugin.id)}
                        className="data-[state=checked]:bg-purple-600"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

function AgentsTab() {
  const { addLog } = useDebug();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentPreset | null>(null);
  const [editMode, setEditMode] = useState<'create' | 'edit'>('create');
  const {
    presets,
    createPreset,
    updatePreset,
    deletePreset,
    togglePreset,
    duplicatePreset,
    exportPresets,
    importPresets,
  } = useAgents();

  const handleEdit = (agent: AgentPreset) => {
    setSelectedAgent(agent);
    setEditMode('edit');
    setEditDialogOpen(true);
    addLog({
      action: `Editing agent: ${agent.name}`,
      category: 'admin:agents:edit',
      payload: { agentId: agent.id, name: agent.name },
      type: 'info'
    });
  };

  const handleAdd = () => {
    setSelectedAgent(null);
    setEditMode('create');
    setEditDialogOpen(true);
    addLog({
      action: 'Adding new agent',
      category: 'admin:agents:add',
      type: 'info'
    });
  };

  const handleSave = (agentData: Omit<AgentPreset, 'id' | 'createdAt' | 'updatedAt' | 'isBuiltIn'>) => {
    if (selectedAgent) {
      updatePreset(selectedAgent.id, agentData);
      addLog({
        action: `Agent updated: ${agentData.name}`,
        category: 'admin:agents:update',
        payload: agentData,
        type: 'success'
      });
    } else {
      createPreset(agentData);
      addLog({
        action: `Agent created: ${agentData.name}`,
        category: 'admin:agents:create',
        payload: agentData,
        type: 'success'
      });
    }
    setEditDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    const agent = presets.find(a => a.id === id);
    deletePreset(id);
    addLog({
      action: `Agent deleted: ${agent?.name || id}`,
      category: 'admin:agents:delete',
      payload: { agentId: id },
      type: 'warning'
    });
  };

  const handleDuplicate = (id: string) => {
    const agent = presets.find(a => a.id === id);
    const newAgent = duplicatePreset(id);
    if (newAgent) {
      addLog({
        action: `Agent duplicated: ${agent?.name} → ${newAgent.name}`,
        category: 'admin:agents:duplicate',
        payload: { originalId: id, newId: newAgent.id },
        type: 'info'
      });
    }
  };

  const handleToggle = (id: string) => {
    const agent = presets.find(a => a.id === id);
    togglePreset(id);
    addLog({
      action: `Agent ${agent?.isEnabled ? 'disabled' : 'enabled'}: ${agent?.name}`,
      category: 'admin:agents:toggle',
      payload: { agentId: id, enabled: !agent?.isEnabled },
      type: 'info'
    });
  };

  const handleExport = () => {
    const data = exportPresets();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'aimate-agents.json';
    a.click();
    URL.revokeObjectURL(url);
    addLog({
      action: 'Agents exported',
      category: 'admin:agents:export',
      type: 'info'
    });
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const content = ev.target?.result as string;
          const count = importPresets(content);
          addLog({
            action: `Imported ${count} agents`,
            category: 'admin:agents:import',
            payload: { count },
            type: count > 0 ? 'success' : 'warning'
          });
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <>
      <AgentEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        agent={selectedAgent}
        onSave={handleSave}
        mode={editMode}
      />
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Agent Presets</h3>
            <div className="flex gap-2">
              <Button onClick={handleImport} variant="outline" size="sm" className="cursor-pointer">
                <Upload className="h-4 w-4 mr-1" />
                Import
              </Button>
              <Button onClick={handleExport} variant="outline" size="sm" className="cursor-pointer">
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              <Button onClick={handleAdd} size="sm" className="cursor-pointer">
                <Plus className="h-4 w-4 mr-1" />
                Create Agent
              </Button>
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Create AI personas with custom system prompts, tool access, and parameters.
          </p>

          <div className="space-y-2">
            {presets.length === 0 ? (
              <div className="p-8 border border-gray-200 dark:border-gray-800 rounded-lg text-center">
                <Bot className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No agent presets configured
                </p>
                <Button
                  onClick={handleAdd}
                  variant="outline"
                  size="sm"
                  className="mt-3 cursor-pointer"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Create Your First Agent
                </Button>
              </div>
            ) : (
              presets.map((agent) => (
                <div
                  key={agent.id}
                  className={`flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border ${
                    agent.isEnabled
                      ? 'border-gray-200 dark:border-gray-800'
                      : 'border-gray-200 dark:border-gray-800 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                      style={{
                        backgroundColor: (agent.color || '#8b5cf6') + '20',
                        borderColor: agent.color || '#8b5cf6',
                        borderWidth: 2
                      }}
                    >
                      {agent.icon || '🤖'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{agent.name}</h4>
                        {agent.isBuiltIn && (
                          <span className="text-xs px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded">
                            Built-in
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                        {agent.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 cursor-pointer"
                      onClick={() => handleDuplicate(agent.id)}
                      title="Duplicate"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 cursor-pointer"
                      onClick={() => handleEdit(agent)}
                      title="Edit"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    {!agent.isBuiltIn && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 cursor-pointer text-red-500 hover:text-red-600"
                        onClick={() => handleDelete(agent.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Switch
                      checked={agent.isEnabled}
                      onCheckedChange={() => handleToggle(agent.id)}
                      className="ml-2 data-[state=checked]:bg-purple-600"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <Separator />

        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
          <p className="text-sm text-purple-800 dark:text-purple-200">
            <strong>About Agents:</strong> Agent presets let you quickly switch between AI personas.
            Each agent can have its own system prompt, tool access, and response style.
            Agents can also access your knowledge base for domain-specific assistance.
          </p>
        </div>
      </div>
    </>
  );
}

function MCPTab() {
  const { addLog } = useDebug();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedConnector, setSelectedConnector] = useState<any>(null);
  const { mcpServers, toggleMcpServer, createMcpServer, updateMcpServer, deleteMcpServer } = useAdmin();

  const handleEdit = (connector: any) => {
    setSelectedConnector(connector);
    setEditDialogOpen(true);
    addLog({
      action: `Editing MCP connector: ${connector.name}`,
      category: 'admin:mcp:edit',
      payload: { connectorId: connector.id, name: connector.name },
      type: 'info'
    });
  };

  const handleAdd = () => {
    setSelectedConnector(null);
    setEditDialogOpen(true);
    addLog({
      action: 'Adding new MCP connector',
      category: 'admin:mcp:add',
      type: 'info'
    });
  };

  const handleSave = async (connector: any) => {
    try {
      if (selectedConnector) {
        await updateMcpServer(connector.id, connector);
        addLog({
          action: `MCP connector updated: ${connector.name}`,
          category: 'admin:mcp:update',
          api: 'api/v1/admin/mcp',
          payload: connector,
          type: 'success'
        });
      } else {
        await createMcpServer(connector);
        addLog({
          action: `MCP connector created: ${connector.name}`,
          category: 'admin:mcp:create',
          api: 'api/v1/admin/mcp',
          payload: connector,
          type: 'success'
        });
      }
      setEditDialogOpen(false);
    } catch (err) {
      console.error('[MCPTab] Failed to save MCP server:', err);
      addLog({
        action: `Failed to save MCP connector: ${connector.name}`,
        category: 'admin:mcp:error',
        payload: { error: String(err) },
        type: 'error'
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const server = mcpServers.find(s => s.id === id);
      await deleteMcpServer(id);
      addLog({
        action: `MCP connector deleted: ${server?.name || id}`,
        category: 'admin:mcp:delete',
        api: 'api/v1/admin/mcp',
        payload: { connectorId: id },
        type: 'warning'
      });
      setEditDialogOpen(false);
    } catch (err) {
      console.error('[MCPTab] Failed to delete MCP server:', err);
      addLog({
        action: 'Failed to delete MCP connector',
        category: 'admin:mcp:error',
        payload: { error: String(err) },
        type: 'error'
      });
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const server = mcpServers.find(s => s.id === id);
      const newState = !server?.enabled;
      await toggleMcpServer(id);
      addLog({
        action: `${server?.name}: ${newState ? 'enabled' : 'disabled'}`,
        category: 'admin:mcp:toggle',
        api: 'api/v1/admin/mcp/toggle',
        payload: { connectorId: id, enabled: newState, name: server?.name },
        type: 'info'
      });
    } catch (err) {
      console.error('[MCPTab] Failed to toggle MCP server:', err);
      addLog({
        action: 'Failed to toggle MCP connector',
        category: 'admin:mcp:error',
        payload: { error: String(err) },
        type: 'error'
      });
    }
  };

  return (
    <>
      <MCPEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        connector={selectedConnector}
        onSave={handleSave}
        onDelete={selectedConnector ? handleDelete : undefined}
      />
      <div className="space-y-6">
        {/* MCP Connectors Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Model Context Protocol</h3>
            <Button onClick={handleAdd} size="sm" className="cursor-pointer">
              <Plus className="h-4 w-4 mr-1" />
              Add Connector
            </Button>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Configure MCP servers and connectors for extended functionality
          </p>

          <div className="space-y-2">
            {mcpServers.length === 0 ? (
              <div className="p-8 border border-gray-200 dark:border-gray-800 rounded-lg text-center">
                <Database className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No MCP connectors configured
                </p>
                <Button
                  onClick={handleAdd}
                  variant="outline"
                  size="sm"
                  className="mt-3 cursor-pointer"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Your First Connector
                </Button>
              </div>
            ) : (
              mcpServers.map((server) => (
                <div
                  key={server.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-gray-200 dark:border-gray-800"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center gap-3 flex-1">
                      <Database className={`h-5 w-5 ${server.status === 'Connected' ? 'text-green-500' : server.status === 'Error' ? 'text-red-500' : 'text-gray-500'}`} />
                      <div>
                        <h4 className="font-medium">{server.name}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {server.description} • {server.tools.length} tools • {server.status}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={server.isActive}
                      onCheckedChange={() => handleToggle(server.id)}
                      className="data-[state=checked]:bg-purple-600"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 cursor-pointer"
                      onClick={() => handleEdit(server)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <Separator />

        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>About MCP:</strong> The Model Context Protocol allows AI models to interact with external tools and services.
            Configure connectors to extend your AI assistant's capabilities.
          </p>
        </div>
      </div>
    </>
  );
}

function DocumentsTab() {
  const { settings, updateDocuments } = useAdminSettings();
  const { addLog } = useDebug();
  const docs = settings.documents;

  // Get knowledge stats from AppData context (if available) - for display purposes
  const [docStats, setDocStats] = useState({ total: 0, embedded: 0, pending: 0 });

  const handleUpdate = (key: string, value: any) => {
    updateDocuments({ [key]: value });
    addLog({
      action: `Documents setting updated: ${key}`,
      category: 'admin:documents:update',
      type: 'info',
    });
  };

  return (
    <div className="space-y-6">
      {/* Knowledge Overview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold">Knowledge Base Overview</h3>
            <p className="text-xs text-muted-foreground">Manage documents and RAG settings</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              // Trigger opening Knowledge modal - this would need to be wired up through props
              addLog({
                action: 'Opening Knowledge modal from Documents tab',
                category: 'admin:documents:openKnowledge',
                type: 'info',
              });
              // For now show a toast - full integration would require lifting state
              toast.info("Open Knowledge from the main menu to manage documents");
            }}
          >
            <Database className="h-4 w-4 mr-2" />
            Manage Documents
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{docStats.total}</div>
              <div className="text-xs text-muted-foreground">Total Documents</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold text-green-600">{docStats.embedded}</div>
              <div className="text-xs text-muted-foreground">Embedded</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{docStats.pending}</div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* Content Extraction Engine */}
      <div>
        <h3 className="font-semibold mb-3">Content Extraction</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Content Extraction Engine</Label>
            <Select value={docs.contentExtractionEngine} onValueChange={(v) => handleUpdate('contentExtractionEngine', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Default">Default</SelectItem>
                <SelectItem value="Tika">Apache Tika</SelectItem>
                <SelectItem value="Custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>PDF Extract Images</Label>
              <p className="text-xs text-muted-foreground">Extract and embed images from PDF files</p>
            </div>
            <Switch
              checked={docs.pdfExtractImages}
              onCheckedChange={(v) => handleUpdate('pdfExtractImages', v)}
              className="data-[state=checked]:bg-purple-600"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Bypass Embedding</Label>
              <p className="text-xs text-muted-foreground">Store documents without generating embeddings</p>
            </div>
            <Switch
              checked={docs.bypassEmbedding}
              onCheckedChange={(v) => handleUpdate('bypassEmbedding', v)}
              className="data-[state=checked]:bg-purple-600"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Text Splitting */}
      <div>
        <h3 className="font-semibold mb-3">Text Splitting</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Text Splitter</Label>
            <Select value={docs.textSplitter} onValueChange={(v) => handleUpdate('textSplitter', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RecursiveCharacter">Recursive Character</SelectItem>
                <SelectItem value="Character">Character</SelectItem>
                <SelectItem value="Token">Token</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Chunk Size</Label>
              <Input value={docs.chunkSize} onChange={(e) => handleUpdate('chunkSize', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Chunk Overlap</Label>
              <Input value={docs.chunkOverlap} onChange={(e) => handleUpdate('chunkOverlap', e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Embedding Model */}
      <div>
        <h3 className="font-semibold mb-3">Embedding Model</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Embedding Model Engine</Label>
            <Select value={docs.embeddingModelEngine} onValueChange={(v) => handleUpdate('embeddingModelEngine', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Default">Default</SelectItem>
                <SelectItem value="OpenAI">OpenAI</SelectItem>
                <SelectItem value="HuggingFace">Hugging Face</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Embedding Model</Label>
            <div className="flex gap-2">
              <Input
                value={docs.embeddingModel}
                onChange={(e) => handleUpdate('embeddingModel', e.target.value)}
                className="flex-1"
              />
              <Button size="icon" variant="outline" className="cursor-pointer">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Query Settings */}
      <div>
        <h3 className="font-semibold mb-3">Query Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Full Context Mode</Label>
              <p className="text-xs text-muted-foreground">Include full document content instead of chunks</p>
            </div>
            <Switch
              checked={docs.fullContextMode}
              onCheckedChange={(v) => handleUpdate('fullContextMode', v)}
              className="data-[state=checked]:bg-purple-600"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Hybrid Search</Label>
              <p className="text-xs text-muted-foreground">Combine semantic and lexical search</p>
            </div>
            <Switch
              checked={docs.hybridSearch}
              onCheckedChange={(v) => handleUpdate('hybridSearch', v)}
              className="data-[state=checked]:bg-purple-600"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Reranking */}
      <div>
        <h3 className="font-semibold mb-3">Reranking</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Reranking Engine</Label>
            <Select value={docs.rerankingEngine} onValueChange={(v) => handleUpdate('rerankingEngine', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Default">Default</SelectItem>
                <SelectItem value="Cohere">Cohere</SelectItem>
                <SelectItem value="Custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Reranking Model</Label>
            <Input value={docs.rerankingModel} onChange={(e) => handleUpdate('rerankingModel', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Top K (Reranker)</Label>
              <Input value={docs.topKReranker} onChange={(e) => handleUpdate('topKReranker', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Relevance Threshold</Label>
              <Input value={docs.relevanceThreshold} onChange={(e) => handleUpdate('relevanceThreshold', e.target.value)} />
            </div>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            Note: If you set a minimum score, the search will only return documents with a score greater than or equal to the minimum score.
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>BM25 Weight</Label>
              <span className="text-sm">{docs.bm25Weight[0]}</span>
            </div>
            <div className="space-y-2">
              <Slider
                value={docs.bm25Weight}
                onValueChange={(v) => handleUpdate('bm25Weight', v)}
                min={0}
                max={1}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>semantic</span>
                <span className="font-medium">{docs.bm25Weight[0]}</span>
                <span>lexical</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>RAG Template</Label>
            <Textarea
              value={docs.ragTemplate}
              onChange={(e) => handleUpdate('ragTemplate', e.target.value)}
              className="min-h-[100px] font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Use {"{{CONTEXT}}"} for retrieved content and {"{{QUERY}}"} for user question
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function WebSearchTab() {
  const { addLog } = useDebug();
  const { settings, updateWebSearch } = useAdminSettings();
  const ws = settings.webSearch;

  const handleWebSearchToggle = (enabled: boolean) => {
    updateWebSearch({ webSearchEnabled: enabled });
    addLog({
      action: `Web search: ${enabled ? 'enabled' : 'disabled'}`,
      category: 'admin:websearch:toggle',
      api: 'api/v1/admin/settings/websearch',
      payload: { webSearchEnabled: enabled },
      type: 'info'
    });
  };

  const handleSearchEngineChange = (engine: string) => {
    updateWebSearch({ searchEngine: engine });
    addLog({
      action: `Search engine changed to: ${engine}`,
      category: 'admin:websearch:engine',
      api: 'api/v1/admin/settings/websearch',
      payload: { searchEngine: engine },
      type: 'info'
    });
  };

  return (
    <div className="space-y-6">
      {/* Enable Web Search */}
      <div className="flex items-center justify-between">
        <Label>Enable Web Search</Label>
        <Switch
          checked={ws.webSearchEnabled}
          onCheckedChange={handleWebSearchToggle}
          className="data-[state=checked]:bg-purple-600"
        />
      </div>

      <Separator />

      {/* Search Engine */}
      <div className="space-y-2">
        <Label>Search Engine</Label>
        <Select value={ws.searchEngine} onValueChange={handleSearchEngineChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="google">Google PSE</SelectItem>
            <SelectItem value="searxng">SearXNG</SelectItem>
            <SelectItem value="serpapi">SerpAPI</SelectItem>
            <SelectItem value="brave">Brave Search</SelectItem>
            <SelectItem value="serper">Serper</SelectItem>
            <SelectItem value="serply">Serply</SelectItem>
            <SelectItem value="duckduckgo">DuckDuckGo</SelectItem>
            <SelectItem value="tavity">Tavity</SelectItem>
            <SelectItem value="searchapi">SearchApi</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Query Suggestions */}
      <div className="flex items-center justify-between">
        <Label>Enable Query Suggestions</Label>
        <Switch
          checked={ws.enableQuerySuggestions}
          onCheckedChange={(v) => updateWebSearch({ enableQuerySuggestions: v })}
          className="data-[state=checked]:bg-purple-600"
        />
      </div>

      {/* Web Loader */}
      <div className="flex items-center justify-between">
        <Label>Enable Web Loader for All URLs</Label>
        <Switch
          checked={ws.enableWebLoader}
          onCheckedChange={(v) => updateWebSearch({ enableWebLoader: v })}
          className="data-[state=checked]:bg-purple-600"
        />
      </div>

      <Separator />

      {/* Result Count */}
      <div className="space-y-2">
        <Label>Result Count</Label>
        <Input
          type="number"
          value={ws.resultCount}
          onChange={(e) => updateWebSearch({ resultCount: e.target.value })}
          min="1"
          max="20"
        />
      </div>

      <Separator />

      {/* API Keys Section */}
      <div className="space-y-4">
        <h3 className="font-semibold">API Keys</h3>

        {ws.searchEngine === "searxng" && (
          <div className="space-y-2">
            <Label>SearXNG Instance URL</Label>
            <Input
              type="url"
              value={ws.searxngUrl}
              onChange={(e) => updateWebSearch({ searxngUrl: e.target.value })}
              placeholder="https://searxng.example.com"
            />
          </div>
        )}

        {ws.searchEngine === "serpapi" && (
          <div className="space-y-2">
            <Label>SerpAPI API Key</Label>
            <Input
              type="password"
              value={ws.serpApiKey}
              onChange={(e) => updateWebSearch({ serpApiKey: e.target.value })}
              placeholder="Enter your SerpAPI key"
            />
          </div>
        )}

        {ws.searchEngine === "google" && (
          <>
            <div className="space-y-2">
              <Label>Google Search API Key</Label>
              <Input
                type="password"
                value={ws.googleSearchApiKey}
                onChange={(e) => updateWebSearch({ googleSearchApiKey: e.target.value })}
                placeholder="Enter your Google API key"
              />
            </div>
            <div className="space-y-2">
              <Label>Google Search Engine ID</Label>
              <Input
                value={ws.googleSearchEngineId}
                onChange={(e) => updateWebSearch({ googleSearchEngineId: e.target.value })}
                placeholder="Enter your Search Engine ID"
              />
            </div>
          </>
        )}

        {ws.searchEngine === "brave" && (
          <div className="space-y-2">
            <Label>Brave Search API Key</Label>
            <Input
              type="password"
              value={ws.braveSearchApiKey}
              onChange={(e) => updateWebSearch({ braveSearchApiKey: e.target.value })}
              placeholder="Enter your Brave Search API key"
            />
          </div>
        )}

        {ws.searchEngine === "serper" && (
          <div className="space-y-2">
            <Label>Serper API Key</Label>
            <Input
              type="password"
              value={ws.serperApiKey}
              onChange={(e) => updateWebSearch({ serperApiKey: e.target.value })}
              placeholder="Enter your Serper API key"
            />
          </div>
        )}

        {ws.searchEngine === "serply" && (
          <div className="space-y-2">
            <Label>Serply API Key</Label>
            <Input
              type="password"
              value={ws.serplyApiKey}
              onChange={(e) => updateWebSearch({ serplyApiKey: e.target.value })}
              placeholder="Enter your Serply API key"
            />
          </div>
        )}

        {ws.searchEngine === "tavity" && (
          <div className="space-y-2">
            <Label>Tavity API Key</Label>
            <Input
              type="password"
              value={ws.tavityApiKey}
              onChange={(e) => updateWebSearch({ tavityApiKey: e.target.value })}
              placeholder="Enter your Tavity API key"
            />
          </div>
        )}

        {ws.searchEngine === "searchapi" && (
          <div className="space-y-2">
            <Label>SearchAPI API Key</Label>
            <Input
              type="password"
              value={ws.searchapiApiKey}
              onChange={(e) => updateWebSearch({ searchapiApiKey: e.target.value })}
              placeholder="Enter your SearchAPI key"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function CodeExecutionTab() {
  const { settings, updateCodeExecution } = useAdminSettings();

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold mb-3">Code Execution</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Enable Code Execution</Label>
            <Switch
              checked={settings.codeExecution.codeExecutionEnabled}
              onCheckedChange={(v) => updateCodeExecution({ codeExecutionEnabled: v })}
              className="data-[state=checked]:bg-purple-600"
            />
          </div>
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Warning: Enabling code execution can be dangerous. Only enable in secure environments.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AudioTab() {
  const { settings, updateAudio } = useAdminSettings();
  const audio = settings.audio;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold mb-3">Audio Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Enable Voice Input</Label>
            <Switch
              checked={audio.voiceInputEnabled}
              onCheckedChange={(v) => updateAudio({ voiceInputEnabled: v })}
              className="data-[state=checked]:bg-purple-600"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Enable Text-to-Speech</Label>
            <Switch
              checked={audio.textToSpeechEnabled}
              onCheckedChange={(v) => updateAudio({ textToSpeechEnabled: v })}
              className="data-[state=checked]:bg-purple-600"
            />
          </div>
          <div>
            <Label>Voice Model</Label>
            <Select value={audio.voiceModel} onValueChange={(v) => updateAudio({ voiceModel: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alloy">Alloy</SelectItem>
                <SelectItem value="echo">Echo</SelectItem>
                <SelectItem value="nova">Nova</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}

function ImagesTab() {
  const { settings, updateImages, updateImageProvider, updateImageProviders } = useAdminSettings();
  const { addLog } = useDebug();
  const images = settings.images;
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [showAddProvider, setShowAddProvider] = useState(false);

  const providerTypeLabels: Record<string, string> = {
    openai: 'OpenAI (DALL-E)',
    stability: 'Stability AI',
    comfyui: 'ComfyUI',
    automatic1111: 'Automatic1111',
    sora: 'OpenAI Sora',
    midjourney: 'Midjourney',
    replicate: 'Replicate',
    custom: 'Custom API',
  };

  const providerTypeDescriptions: Record<string, string> = {
    openai: 'Cloud-based image generation via OpenAI API',
    stability: 'High-quality image generation via Stability AI',
    comfyui: 'Local node-based image generation workflow',
    automatic1111: 'Local Stable Diffusion web UI',
    sora: 'Video generation via OpenAI Sora API',
    midjourney: 'AI art generation via Midjourney API',
    replicate: 'Run open-source models in the cloud',
    custom: 'Custom image generation API endpoint',
  };

  const handleToggleProvider = (providerId: string, enabled: boolean) => {
    updateImageProvider(providerId, { enabled });
    addLog({
      action: `Image provider ${enabled ? 'enabled' : 'disabled'}: ${providerId}`,
      category: 'admin:images:provider:toggle',
      type: 'info',
    });
  };

  const handleSetDefault = (providerId: string) => {
    const updatedProviders = images.providers.map(p => ({
      ...p,
      isDefault: p.id === providerId,
    }));
    updateImageProviders(updatedProviders);
    updateImages({ defaultProvider: providerId });
    addLog({
      action: `Default image provider set: ${providerId}`,
      category: 'admin:images:provider:default',
      type: 'info',
    });
  };

  const handleDeleteProvider = (providerId: string) => {
    const updatedProviders = images.providers.filter(p => p.id !== providerId);
    updateImageProviders(updatedProviders);
    addLog({
      action: `Image provider deleted: ${providerId}`,
      category: 'admin:images:provider:delete',
      type: 'warning',
    });
  };

  const handleAddProvider = (type: string) => {
    const newProvider = {
      id: `${type}-${Date.now()}`,
      name: `New ${providerTypeLabels[type]} Provider`,
      type: type as any,
      baseUrl: type === 'comfyui' ? 'http://localhost:8188' : type === 'automatic1111' ? 'http://localhost:7860' : '',
      enabled: false,
      isDefault: false,
      settings: {},
      allowUserKeys: type !== 'comfyui' && type !== 'automatic1111',
      requiresAuth: type !== 'comfyui' && type !== 'automatic1111',
    };
    updateImageProviders([...images.providers, newProvider]);
    setEditingProvider(newProvider.id);
    setShowAddProvider(false);
  };

  const handleUpdateProviderSettings = (providerId: string, key: string, value: any) => {
    const provider = images.providers.find(p => p.id === providerId);
    if (provider) {
      updateImageProvider(providerId, {
        settings: { ...provider.settings, [key]: value },
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Global Settings */}
      <div>
        <h3 className="font-semibold mb-3">Image Generation Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Image Generation</Label>
              <p className="text-xs text-muted-foreground">Allow AI to generate images in chat</p>
            </div>
            <Switch
              checked={images.imageGenerationEnabled}
              onCheckedChange={(v) => updateImages({ imageGenerationEnabled: v })}
              className="data-[state=checked]:bg-purple-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Default Provider</Label>
              <Select
                value={images.defaultProvider}
                onValueChange={(v) => {
                  updateImages({ defaultProvider: v });
                  handleSetDefault(v);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {images.providers.filter(p => p.enabled).map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Max Images Per Request</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={images.maxImagesPerRequest}
                onChange={(e) => updateImages({ maxImagesPerRequest: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Default Size</Label>
              <Select value={images.defaultSize} onValueChange={(v) => updateImages({ defaultSize: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="256x256">256x256</SelectItem>
                  <SelectItem value="512x512">512x512</SelectItem>
                  <SelectItem value="1024x1024">1024x1024</SelectItem>
                  <SelectItem value="1024x1792">1024x1792 (Portrait)</SelectItem>
                  <SelectItem value="1792x1024">1792x1024 (Landscape)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Default Quality</Label>
              <Select value={images.defaultQuality} onValueChange={(v) => updateImages({ defaultQuality: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="hd">HD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Image Providers */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold">Image Providers</h3>
            <p className="text-xs text-muted-foreground">Configure cloud and local image generation services</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Add Provider
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {Object.entries(providerTypeLabels).map(([type, label]) => (
                <DropdownMenuItem key={type} onClick={() => handleAddProvider(type)}>
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-3">
          {images.providers.map((provider) => (
            <Card key={provider.id} className={`${!provider.enabled ? 'opacity-60' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{provider.name}</span>
                      {provider.isDefault && (
                        <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded">
                          Default
                        </span>
                      )}
                      <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded">
                        {providerTypeLabels[provider.type]}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {provider.baseUrl || providerTypeDescriptions[provider.type]}
                    </p>
                    {provider.allowUserKeys && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        BYOK enabled - users can add their own API keys
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={provider.enabled}
                      onCheckedChange={(v) => handleToggleProvider(provider.id, v)}
                      className="data-[state=checked]:bg-purple-600"
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingProvider(provider.id)}>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Configure
                        </DropdownMenuItem>
                        {!provider.isDefault && provider.enabled && (
                          <DropdownMenuItem onClick={() => handleSetDefault(provider.id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Set as Default
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleDeleteProvider(provider.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Expanded Config */}
                {editingProvider === provider.id && (
                  <div className="mt-4 pt-4 border-t space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Provider Name</Label>
                        <Input
                          value={provider.name}
                          onChange={(e) => updateImageProvider(provider.id, { name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Base URL</Label>
                        <Input
                          value={provider.baseUrl}
                          onChange={(e) => updateImageProvider(provider.id, { baseUrl: e.target.value })}
                          placeholder={provider.type === 'comfyui' ? 'http://localhost:8188' : 'https://api.example.com/v1'}
                        />
                      </div>
                    </div>

                    {provider.requiresAuth && (
                      <div className="space-y-2">
                        <Label>API Key</Label>
                        <Input
                          type="password"
                          value={provider.apiKey || ''}
                          onChange={(e) => updateImageProvider(provider.id, { apiKey: e.target.value })}
                          placeholder="sk-..."
                        />
                      </div>
                    )}

                    {/* Provider-specific settings */}
                    {(provider.type === 'openai' || provider.type === 'stability' || provider.type === 'replicate') && (
                      <div className="space-y-2">
                        <Label>Model</Label>
                        <Input
                          value={provider.settings.model || ''}
                          onChange={(e) => handleUpdateProviderSettings(provider.id, 'model', e.target.value)}
                          placeholder={provider.type === 'openai' ? 'dall-e-3' : 'stable-diffusion-xl-1024-v1-0'}
                        />
                      </div>
                    )}

                    {(provider.type === 'comfyui' || provider.type === 'automatic1111' || provider.type === 'stability') && (
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Steps</Label>
                          <Input
                            type="number"
                            min={1}
                            max={150}
                            value={provider.settings.steps || 20}
                            onChange={(e) => handleUpdateProviderSettings(provider.id, 'steps', parseInt(e.target.value))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>CFG Scale</Label>
                          <Input
                            type="number"
                            min={1}
                            max={30}
                            step={0.5}
                            value={provider.settings.cfgScale || 7}
                            onChange={(e) => handleUpdateProviderSettings(provider.id, 'cfgScale', parseFloat(e.target.value))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Sampler</Label>
                          <Select
                            value={provider.settings.sampler || 'euler'}
                            onValueChange={(v) => handleUpdateProviderSettings(provider.id, 'sampler', v)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="euler">Euler</SelectItem>
                              <SelectItem value="euler_ancestral">Euler Ancestral</SelectItem>
                              <SelectItem value="heun">Heun</SelectItem>
                              <SelectItem value="dpm_2">DPM2</SelectItem>
                              <SelectItem value="dpm_2_ancestral">DPM2 Ancestral</SelectItem>
                              <SelectItem value="lms">LMS</SelectItem>
                              <SelectItem value="ddim">DDIM</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {provider.type === 'comfyui' && (
                      <div className="space-y-2">
                        <Label>Workflow</Label>
                        <Input
                          value={provider.settings.workflow || ''}
                          onChange={(e) => handleUpdateProviderSettings(provider.id, 'workflow', e.target.value)}
                          placeholder="default or workflow name"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Default Negative Prompt</Label>
                      <Textarea
                        value={provider.settings.negativePrompt || ''}
                        onChange={(e) => handleUpdateProviderSettings(provider.id, 'negativePrompt', e.target.value)}
                        placeholder="blurry, low quality, distorted..."
                        className="min-h-[60px]"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Allow User API Keys (BYOK)</Label>
                        <p className="text-xs text-muted-foreground">Let users provide their own API keys</p>
                      </div>
                      <Switch
                        checked={provider.allowUserKeys}
                        onCheckedChange={(v) => updateImageProvider(provider.id, { allowUserKeys: v })}
                        className="data-[state=checked]:bg-purple-600"
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button size="sm" onClick={() => setEditingProvider(null)}>
                        Done
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function EvaluationTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-2">Model Evaluation & Leaderboard</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Track model performance through user feedback and arena comparisons.
          Rankings use Elo ratings from head-to-head comparisons.
        </p>
      </div>
      <ModelLeaderboard showExport={true} />
    </div>
  );
}

function CustomModelsTab() {
  const {
    customModels,
    enabledModels,
    isLoading,
    createModel,
    updateModel,
    deleteModel,
    cloneModel,
    toggleModel,
    exportModels,
    importModels,
  } = useCustomModels();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<typeof customModels[0] | null>(null);
  const fileInputRef = useState<HTMLInputElement | null>(null);

  const handleNewModel = () => {
    setSelectedModel(null);
    setEditDialogOpen(true);
  };

  const handleEditModel = (model: typeof customModels[0]) => {
    setSelectedModel(model);
    setEditDialogOpen(true);
  };

  const handleSaveModel = async (data: any) => {
    if (selectedModel) {
      await updateModel(selectedModel.id, data);
    } else {
      await createModel(data);
    }
  };

  const handleDeleteModel = async () => {
    if (selectedModel) {
      await deleteModel(selectedModel.id);
    }
  };

  const handleExport = async () => {
    try {
      const json = await exportModels();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'custom-models.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      await importModels(text);
    } catch (error) {
      console.error('Import failed:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Custom Models</h3>
          <p className="text-sm text-muted-foreground">
            Create wrapped models with custom system prompts, knowledge, and tools
          </p>
        </div>
        <div className="flex gap-2">
          <input
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
            id="import-models-input"
          />
          <Button variant="outline" size="sm" onClick={() => document.getElementById('import-models-input')?.click()}>
            <Upload className="h-4 w-4 mr-1" />
            Import
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button size="sm" onClick={handleNewModel}>
            <Plus className="h-4 w-4 mr-1" />
            New Model
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : customModels.length === 0 ? (
        <Card className="py-8">
          <CardContent className="text-center">
            <Boxes className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h4 className="font-medium mb-2">No Custom Models</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Create a custom model to wrap a base model with your own system prompt, knowledge, and tools.
            </p>
            <Button onClick={handleNewModel}>
              <Plus className="h-4 w-4 mr-1" />
              Create Your First Model
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {customModels.map((model) => (
            <Card key={model.id} className={`${!model.isEnabled ? 'opacity-60' : ''} ${model.isHidden ? 'border-dashed' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                    style={{ backgroundColor: (model.color || '#8b5cf6') + '20' }}
                  >
                    {model.avatar || '🤖'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium truncate">{model.name}</h4>
                      {model.isBuiltIn && (
                        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Built-in</span>
                      )}
                      {model.isHidden && (
                        <span className="text-xs text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded">Hidden</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{model.description}</p>
                    {model.tags && model.tags.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {model.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {model.promptSuggestions.length > 0 && (
                      <div className="mt-2">
                        <PromptSuggestionsCompact suggestions={model.promptSuggestions} maxVisible={2} />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={model.isEnabled}
                      onCheckedChange={() => toggleModel(model.id)}
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditModel(model)}>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => cloneModel(model.id)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Clone
                        </DropdownMenuItem>
                        {!model.isBuiltIn && (
                          <DropdownMenuItem
                            className="text-red-500"
                            onClick={() => deleteModel(model.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CustomModelEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        model={selectedModel}
        onSave={handleSaveModel}
        onDelete={selectedModel && !selectedModel.isBuiltIn ? handleDeleteModel : undefined}
      />
    </div>
  );
}
