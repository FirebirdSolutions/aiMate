/**
 * Agent Edit Dialog
 *
 * Dialog for creating/editing agent presets with system prompt,
 * tool selection, and parameter configuration.
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Bot, Palette, Wrench, Sparkles, Save, X } from 'lucide-react';
import { AgentPreset } from '../hooks/useAgents';
import { useTools } from '../hooks/useTools';
import { toast } from 'sonner';

interface AgentEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent?: AgentPreset | null;
  onSave: (agent: Omit<AgentPreset, 'id' | 'createdAt' | 'updatedAt' | 'isBuiltIn'>) => void;
  mode: 'create' | 'edit';
}

const AGENT_ICONS = ['🤖', '🔍', '📚', '📊', '✍️', '💡', '🎯', '🧪', '🛠️', '🎨', '📝', '🔬', '💻', '🌐', '🔒'];
const AGENT_COLORS = [
  '#8b5cf6', '#ef4444', '#3b82f6', '#10b981', '#f59e0b',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
];

export function AgentEditDialog({
  open,
  onOpenChange,
  agent,
  onSave,
  mode,
}: AgentEditDialogProps) {
  const { tools } = useTools();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🤖');
  const [color, setColor] = useState('#8b5cf6');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [enabledToolIds, setEnabledToolIds] = useState<string[]>([]);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [autoApproveTools, setAutoApproveTools] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  // Reset form when dialog opens/agent changes
  useEffect(() => {
    if (open && agent) {
      setName(agent.name);
      setDescription(agent.description);
      setIcon(agent.icon || '🤖');
      setColor(agent.color || '#8b5cf6');
      setSystemPrompt(agent.systemPrompt);
      setEnabledToolIds(agent.enabledToolIds);
      setTemperature(agent.temperature ?? 0.7);
      setMaxTokens(agent.maxTokens ?? 2048);
      setAutoApproveTools(agent.autoApproveTools);
    } else if (open && mode === 'create') {
      // Reset to defaults for new agent
      setName('');
      setDescription('');
      setIcon('🤖');
      setColor('#8b5cf6');
      setSystemPrompt('');
      setEnabledToolIds([]);
      setTemperature(0.7);
      setMaxTokens(2048);
      setAutoApproveTools(false);
    }
    setActiveTab('general');
  }, [open, agent, mode]);

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Agent name is required');
      return;
    }

    onSave({
      name: name.trim(),
      description: description.trim(),
      icon,
      color,
      systemPrompt: systemPrompt.trim(),
      enabledToolIds,
      knowledgeIds: [], // Future: knowledge selection
      temperature,
      maxTokens,
      autoApproveTools,
      isEnabled: true,
    });
    onOpenChange(false);
  };

  const toggleTool = (toolId: string) => {
    setEnabledToolIds(prev =>
      prev.includes(toolId)
        ? prev.filter(id => id !== toolId)
        : [...prev, toolId]
    );
  };

  const selectAllTools = () => {
    setEnabledToolIds(tools.map(t => t.name));
  };

  const clearAllTools = () => {
    setEnabledToolIds([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{icon}</span>
            {mode === 'create' ? 'Create Agent' : 'Edit Agent'}
          </DialogTitle>
          <DialogDescription>
            Configure an AI agent with custom instructions and tool access.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general" className="gap-2">
              <Bot className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="tools" className="gap-2">
              <Wrench className="h-4 w-4" />
              Tools
            </TabsTrigger>
            <TabsTrigger value="params" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Parameters
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            <TabsContent value="general" className="space-y-4 pr-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Agent"
                  disabled={agent?.isBuiltIn}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does this agent do?"
                  disabled={agent?.isBuiltIn}
                />
              </div>

              {/* Icon & Color */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Icon</Label>
                  <div className="flex flex-wrap gap-2 p-2 border rounded-lg">
                    {AGENT_ICONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setIcon(emoji)}
                        className={`p-2 rounded-md text-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                          icon === emoji ? 'bg-gray-200 dark:bg-gray-700 ring-2 ring-purple-500' : ''
                        }`}
                        disabled={agent?.isBuiltIn}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Color
                  </Label>
                  <div className="flex flex-wrap gap-2 p-2 border rounded-lg">
                    {AGENT_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${
                          color === c ? 'ring-2 ring-offset-2 ring-purple-500' : ''
                        }`}
                        style={{ backgroundColor: c }}
                        disabled={agent?.isBuiltIn}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* System Prompt */}
              <div className="space-y-2">
                <Label htmlFor="systemPrompt">System Prompt</Label>
                <Textarea
                  id="systemPrompt"
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="You are a helpful AI assistant..."
                  rows={8}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500">
                  Instructions that define the agent's personality and behavior.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="tools" className="space-y-4 pr-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium">Available Tools</h3>
                  <p className="text-xs text-gray-500">
                    Select which MCP tools this agent can use. Empty = all tools.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAllTools}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearAllTools}>
                    Clear
                  </Button>
                </div>
              </div>

              {tools.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Wrench className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No MCP tools available.</p>
                  <p className="text-xs">Enable MCP servers in Admin Panel.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tools.map((tool) => (
                    <div
                      key={tool.name}
                      className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900"
                    >
                      <Checkbox
                        id={`tool-${tool.name}`}
                        checked={enabledToolIds.includes(tool.name)}
                        onCheckedChange={() => toggleTool(tool.name)}
                      />
                      <div className="flex-1">
                        <label
                          htmlFor={`tool-${tool.name}`}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {tool.name}
                        </label>
                        {tool.description && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {tool.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Auto-approve tools */}
              <div className="flex items-center justify-between p-3 border rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                <div>
                  <Label htmlFor="autoApprove" className="font-medium">
                    Auto-approve tool calls
                  </Label>
                  <p className="text-xs text-gray-500">
                    Skip confirmation dialogs for tool execution.
                  </p>
                </div>
                <Switch
                  id="autoApprove"
                  checked={autoApproveTools}
                  onCheckedChange={setAutoApproveTools}
                />
              </div>
            </TabsContent>

            <TabsContent value="params" className="space-y-6 pr-4">
              {/* Temperature */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Temperature</Label>
                  <Badge variant="outline">{temperature.toFixed(1)}</Badge>
                </div>
                <Slider
                  value={[temperature]}
                  onValueChange={([v]) => setTemperature(v)}
                  min={0}
                  max={1}
                  step={0.1}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Precise (0.0)</span>
                  <span>Balanced (0.5)</span>
                  <span>Creative (1.0)</span>
                </div>
              </div>

              {/* Max Tokens */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Max Response Length</Label>
                  <Badge variant="outline">{maxTokens} tokens</Badge>
                </div>
                <Slider
                  value={[maxTokens]}
                  onValueChange={([v]) => setMaxTokens(v)}
                  min={256}
                  max={8192}
                  step={256}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Concise (256)</span>
                  <span>Balanced (2048)</span>
                  <span>Detailed (8192)</span>
                </div>
              </div>

              {/* Preview */}
              <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-900">
                <h4 className="text-sm font-medium mb-2">Agent Preview</h4>
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: color + '20', borderColor: color, borderWidth: 2 }}
                  >
                    {icon}
                  </div>
                  <div>
                    <p className="font-medium">{name || 'Unnamed Agent'}</p>
                    <p className="text-sm text-gray-500">{description || 'No description'}</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            <Save className="h-4 w-4 mr-2" />
            {mode === 'create' ? 'Create Agent' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
