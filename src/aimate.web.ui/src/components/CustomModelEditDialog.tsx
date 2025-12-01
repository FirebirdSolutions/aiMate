/**
 * CustomModelEditDialog
 *
 * Full-featured model builder dialog for creating/editing custom model presets.
 * Allows configuration of system prompts, knowledge bindings, tools, capabilities, etc.
 */

import { useState, useEffect, useMemo } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Slider } from './ui/slider';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from './ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from './ui/tooltip';
import { BaseDialog } from './BaseDialog';
import {
  Bot,
  Sparkles,
  FileText,
  Wrench,
  Settings,
  Eye,
  Lightbulb,
  Plus,
  X,
  Info,
  Palette,
  HelpCircle,
  Search,
  Code,
  Image,
  MessageSquare,
  Globe,
  Upload,
  FileCode,
  Quote,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  CustomModelDto,
  CreateCustomModelDto,
  UpdateCustomModelDto,
  CustomModelCapabilities,
  InferenceParametersDto,
  PromptSuggestionDto,
} from '../api/types';
import { getVariableDocumentation, formatVariable, validateVariables } from '../utils/dynamicVariables';

// Emoji picker options for avatar
const AVATAR_EMOJIS = [
  '🤖', '🧠', '💡', '📚', '🔬', '✨', '🎨', '📊', '🔍', '💻',
  '🐍', '🦀', '☕', '🌐', '📝', '🎭', '🎯', '🚀', '🔮', '🌟',
];

// Color options
const COLOR_OPTIONS = [
  '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#ec4899', '#6366f1', '#14b8a6', '#84cc16', '#f97316',
];

interface CustomModelEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  model?: CustomModelDto | null;  // null = create new
  availableModels?: Array<{ id: string; name: string; provider: string }>;
  availableKnowledge?: Array<{ id: string; name: string; type: 'collection' | 'file' }>;
  availableTools?: Array<{ id: string; name: string; description: string }>;
  availableMcpServers?: Array<{ id: string; name: string }>;
  onSave: (data: CreateCustomModelDto | UpdateCustomModelDto) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export function CustomModelEditDialog({
  open,
  onOpenChange,
  model,
  availableModels = [],
  availableKnowledge = [],
  availableTools = [],
  availableMcpServers = [],
  onSave,
  onDelete,
}: CustomModelEditDialogProps) {
  const isEditing = !!model;

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [avatar, setAvatar] = useState('🤖');
  const [color, setColor] = useState('#8b5cf6');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [baseModelId, setBaseModelId] = useState('');
  const [baseModelProvider, setBaseModelProvider] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');

  // Bindings
  const [knowledgeIds, setKnowledgeIds] = useState<string[]>([]);
  const [toolIds, setToolIds] = useState<string[]>([]);
  const [mcpServerIds, setMcpServerIds] = useState<string[]>([]);

  // Capabilities
  const [capabilities, setCapabilities] = useState<CustomModelCapabilities>({
    vision: false,
    webSearch: false,
    fileUpload: true,
    codeInterpreter: false,
    imageGeneration: false,
    citations: true,
    statusUpdates: true,
  });

  // Parameters
  const [parameters, setParameters] = useState<InferenceParametersDto>({
    temperature: 0.7,
    topP: 0.9,
    maxTokens: 4096,
    stopSequences: [],
  });
  const [newStopSequence, setNewStopSequence] = useState('');

  // Prompt suggestions
  const [promptSuggestions, setPromptSuggestions] = useState<PromptSuggestionDto[]>([]);
  const [newSuggestion, setNewSuggestion] = useState('');

  // Defaults
  const [defaultWebSearch, setDefaultWebSearch] = useState(false);
  const [defaultKnowledge, setDefaultKnowledge] = useState(false);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  // Variable documentation
  const variableDocs = useMemo(() => getVariableDocumentation(), []);

  // Populate form when editing
  useEffect(() => {
    if (model) {
      setName(model.name);
      setDescription(model.description || '');
      setAvatar(model.avatar || '🤖');
      setColor(model.color || '#8b5cf6');
      setTags(model.tags || []);
      setBaseModelId(model.baseModelId);
      setBaseModelProvider(model.baseModelProvider);
      setSystemPrompt(model.systemPrompt);
      setKnowledgeIds([...model.knowledgeCollectionIds, ...model.knowledgeFileIds]);
      setToolIds(model.enabledToolIds);
      setMcpServerIds(model.enabledMcpServerIds);
      setCapabilities(model.capabilities);
      setParameters(model.parameters);
      setPromptSuggestions(model.promptSuggestions);
      setDefaultWebSearch(model.defaultWebSearchEnabled);
      setDefaultKnowledge(model.defaultKnowledgeEnabled);
    } else {
      // Reset to defaults for new model
      setName('');
      setDescription('');
      setAvatar('🤖');
      setColor('#8b5cf6');
      setTags([]);
      setBaseModelId(availableModels[0]?.id || '');
      setBaseModelProvider(availableModels[0]?.provider || '');
      setSystemPrompt('You are a helpful AI assistant for {{ USER_NAME }}.\n\nToday is {{ CURRENT_DATE }}.');
      setKnowledgeIds([]);
      setToolIds([]);
      setMcpServerIds([]);
      setCapabilities({
        vision: false,
        webSearch: false,
        fileUpload: true,
        codeInterpreter: false,
        imageGeneration: false,
        citations: true,
        statusUpdates: true,
      });
      setParameters({
        temperature: 0.7,
        topP: 0.9,
        maxTokens: 4096,
        stopSequences: [],
      });
      setPromptSuggestions([]);
      setDefaultWebSearch(false);
      setDefaultKnowledge(false);
    }
  }, [model, availableModels]);

  // Validate system prompt variables
  const promptValidation = useMemo(() => validateVariables(systemPrompt), [systemPrompt]);

  const handleAddTag = () => {
    const trimmed = newTag.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleAddStopSequence = () => {
    if (newStopSequence && !parameters.stopSequences?.includes(newStopSequence)) {
      setParameters({
        ...parameters,
        stopSequences: [...(parameters.stopSequences || []), newStopSequence],
      });
      setNewStopSequence('');
    }
  };

  const handleRemoveStopSequence = (seq: string) => {
    setParameters({
      ...parameters,
      stopSequences: parameters.stopSequences?.filter(s => s !== seq) || [],
    });
  };

  const handleAddSuggestion = () => {
    if (newSuggestion.trim()) {
      setPromptSuggestions([
        ...promptSuggestions,
        {
          id: `ps-${Date.now()}`,
          text: newSuggestion.trim(),
          icon: '💬',
        },
      ]);
      setNewSuggestion('');
    }
  };

  const handleRemoveSuggestion = (id: string) => {
    setPromptSuggestions(promptSuggestions.filter(s => s.id !== id));
  };

  const handleInsertVariable = (variableName: string) => {
    const variable = formatVariable(variableName);
    setSystemPrompt(prev => prev + variable);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Model name is required');
      return;
    }
    if (!baseModelId) {
      toast.error('Please select a base model');
      return;
    }

    try {
      setIsSaving(true);

      const data: CreateCustomModelDto = {
        name: name.trim(),
        description: description.trim() || undefined,
        avatar,
        color,
        tags,
        baseModelId,
        baseModelProvider,
        systemPrompt,
        knowledgeCollectionIds: knowledgeIds.filter(id =>
          availableKnowledge.find(k => k.id === id && k.type === 'collection')
        ),
        knowledgeFileIds: knowledgeIds.filter(id =>
          availableKnowledge.find(k => k.id === id && k.type === 'file')
        ),
        enabledToolIds: toolIds,
        enabledMcpServerIds: mcpServerIds,
        capabilities,
        parameters,
        promptSuggestions,
        defaultWebSearchEnabled: defaultWebSearch,
        defaultKnowledgeEnabled: defaultKnowledge,
      };

      await onSave(data);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save custom model:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (onDelete) {
      try {
        await onDelete();
        onOpenChange(false);
      } catch (error) {
        console.error('Failed to delete custom model:', error);
      }
    }
  };

  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Edit Custom Model' : 'Create Custom Model'}
      description="Configure a wrapped model with custom system prompt, knowledge, and tools"
      size="xl"
      onSave={handleSave}
      onDelete={isEditing && onDelete ? handleDelete : undefined}
      showSave={true}
      showDelete={isEditing && !model?.isBuiltIn}
      saveLabel={isSaving ? 'Saving...' : 'Save Model'}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="basic" className="text-xs">
            <Bot className="h-3 w-3 mr-1" />
            Basic
          </TabsTrigger>
          <TabsTrigger value="prompt" className="text-xs">
            <MessageSquare className="h-3 w-3 mr-1" />
            Prompt
          </TabsTrigger>
          <TabsTrigger value="bindings" className="text-xs">
            <FileText className="h-3 w-3 mr-1" />
            Bindings
          </TabsTrigger>
          <TabsTrigger value="capabilities" className="text-xs">
            <Wrench className="h-3 w-3 mr-1" />
            Capabilities
          </TabsTrigger>
          <TabsTrigger value="advanced" className="text-xs">
            <Settings className="h-3 w-3 mr-1" />
            Advanced
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="h-[500px] mt-4">
          {/* Basic Tab */}
          <TabsContent value="basic" className="space-y-4 p-1">
            {/* Avatar and Color */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <Label className="text-sm">Avatar</Label>
                <div className="flex flex-wrap gap-1 mt-2 max-w-[200px]">
                  {AVATAR_EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      className={`w-8 h-8 rounded text-lg hover:bg-muted ${avatar === emoji ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => setAvatar(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-shrink-0">
                <Label className="text-sm">Color</Label>
                <div className="flex flex-wrap gap-1 mt-2 max-w-[150px]">
                  {COLOR_OPTIONS.map(c => (
                    <button
                      key={c}
                      className={`w-6 h-6 rounded ${color === c ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setColor(c)}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Name and ID */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="model-name">Model Name *</Label>
                <Input
                  id="model-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Python Tutor"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="base-model">Base Model *</Label>
                <Select value={baseModelId} onValueChange={(v) => {
                  setBaseModelId(v);
                  const m = availableModels.find(m => m.id === v);
                  if (m) setBaseModelProvider(m.provider);
                }}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select base model" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels.map(m => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name} ({m.provider})
                      </SelectItem>
                    ))}
                    {availableModels.length === 0 && (
                      <SelectItem value="default">Default Model</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of what this model does"
                className="mt-1 min-h-[80px]"
              />
            </div>

            {/* Tags */}
            <div>
              <Label>Tags</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="Add tag..."
                  className="flex-1"
                />
                <Button variant="outline" size="icon" onClick={handleAddTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveTag(tag)}>
                      {tag}
                      <X className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* System Prompt Tab */}
          <TabsContent value="prompt" className="space-y-4 p-1">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>System Prompt</Label>
                <div className="flex items-center gap-2">
                  {!promptValidation.valid && (
                    <Badge variant="destructive" className="text-xs">
                      Unknown: {promptValidation.unknown.join(', ')}
                    </Badge>
                  )}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">Use dynamic variables like {'{{ CURRENT_DATE }}'} to make prompts context-aware.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <Textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="You are a helpful AI assistant..."
                className="min-h-[200px] font-mono text-sm"
              />
            </div>

            {/* Variable Quick Insert */}
            <div>
              <Label className="text-sm text-muted-foreground">Insert Variable</Label>
              <div className="flex flex-wrap gap-1 mt-2">
                {variableDocs.map(v => (
                  <Tooltip key={v.name}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => handleInsertVariable(v.name)}
                      >
                        {v.name}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{v.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">Example: {v.example}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>

            <Separator />

            {/* Prompt Suggestions */}
            <div>
              <Label>Prompt Suggestions (Starter Chips)</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Clickable prompts shown when starting a new chat with this model
              </p>
              <div className="flex gap-2">
                <Input
                  value={newSuggestion}
                  onChange={(e) => setNewSuggestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSuggestion())}
                  placeholder="e.g., Explain this code step-by-step"
                />
                <Button variant="outline" size="icon" onClick={handleAddSuggestion}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {promptSuggestions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {promptSuggestions.map(s => (
                    <Badge key={s.id} variant="secondary" className="cursor-pointer py-1 px-2" onClick={() => handleRemoveSuggestion(s.id)}>
                      {s.icon && <span className="mr-1">{s.icon}</span>}
                      {s.text}
                      <X className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Bindings Tab */}
          <TabsContent value="bindings" className="space-y-4 p-1">
            {/* Knowledge */}
            <div>
              <Label className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Knowledge (RAG)
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                Automatically enable RAG for these knowledge sources
              </p>
              {availableKnowledge.length > 0 ? (
                <div className="space-y-2">
                  {availableKnowledge.map(k => (
                    <div key={k.id} className="flex items-center gap-2">
                      <Switch
                        checked={knowledgeIds.includes(k.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setKnowledgeIds([...knowledgeIds, k.id]);
                          } else {
                            setKnowledgeIds(knowledgeIds.filter(id => id !== k.id));
                          }
                        }}
                      />
                      <span className="text-sm">{k.name}</span>
                      <Badge variant="outline" className="text-xs">{k.type}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No knowledge sources available</p>
              )}
            </div>

            <Separator />

            {/* Tools */}
            <div>
              <Label className="flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Tools
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                Always enable these tools for this model
              </p>
              {availableTools.length > 0 ? (
                <div className="space-y-2">
                  {availableTools.map(t => (
                    <div key={t.id} className="flex items-center gap-2">
                      <Switch
                        checked={toolIds.includes(t.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setToolIds([...toolIds, t.id]);
                          } else {
                            setToolIds(toolIds.filter(id => id !== t.id));
                          }
                        }}
                      />
                      <div>
                        <span className="text-sm">{t.name}</span>
                        <p className="text-xs text-muted-foreground">{t.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No tools available</p>
              )}
            </div>

            <Separator />

            {/* MCP Servers */}
            <div>
              <Label className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                MCP Servers
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                Always connect to these MCP servers
              </p>
              {availableMcpServers.length > 0 ? (
                <div className="space-y-2">
                  {availableMcpServers.map(s => (
                    <div key={s.id} className="flex items-center gap-2">
                      <Switch
                        checked={mcpServerIds.includes(s.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setMcpServerIds([...mcpServerIds, s.id]);
                          } else {
                            setMcpServerIds(mcpServerIds.filter(id => id !== s.id));
                          }
                        }}
                      />
                      <span className="text-sm">{s.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No MCP servers configured</p>
              )}
            </div>
          </TabsContent>

          {/* Capabilities Tab */}
          <TabsContent value="capabilities" className="space-y-4 p-1">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <Label>Vision</Label>
                </div>
                <Switch
                  checked={capabilities.vision}
                  onCheckedChange={(v) => setCapabilities({ ...capabilities, vision: v })}
                />
              </div>
              <p className="text-xs text-muted-foreground ml-6">Enable image analysis (requires vision-capable base model)</p>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  <Label>Web Search</Label>
                </div>
                <Switch
                  checked={capabilities.webSearch}
                  onCheckedChange={(v) => setCapabilities({ ...capabilities, webSearch: v })}
                />
              </div>
              <p className="text-xs text-muted-foreground ml-6">Access real-time information from the web</p>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  <Label>File Upload</Label>
                </div>
                <Switch
                  checked={capabilities.fileUpload}
                  onCheckedChange={(v) => setCapabilities({ ...capabilities, fileUpload: v })}
                />
              </div>
              <p className="text-xs text-muted-foreground ml-6">Allow users to upload files</p>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCode className="h-4 w-4" />
                  <Label>Code Interpreter</Label>
                </div>
                <Switch
                  checked={capabilities.codeInterpreter}
                  onCheckedChange={(v) => setCapabilities({ ...capabilities, codeInterpreter: v })}
                />
              </div>
              <p className="text-xs text-muted-foreground ml-6">Execute Python code in a sandbox</p>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  <Label>Image Generation</Label>
                </div>
                <Switch
                  checked={capabilities.imageGeneration}
                  onCheckedChange={(v) => setCapabilities({ ...capabilities, imageGeneration: v })}
                />
              </div>
              <p className="text-xs text-muted-foreground ml-6">Generate images with DALL-E or similar</p>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Quote className="h-4 w-4" />
                  <Label>Citations</Label>
                </div>
                <Switch
                  checked={capabilities.citations}
                  onCheckedChange={(v) => setCapabilities({ ...capabilities, citations: v })}
                />
              </div>
              <p className="text-xs text-muted-foreground ml-6">Show source citations for information</p>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4" />
                  <Label>Status Updates</Label>
                </div>
                <Switch
                  checked={capabilities.statusUpdates}
                  onCheckedChange={(v) => setCapabilities({ ...capabilities, statusUpdates: v })}
                />
              </div>
              <p className="text-xs text-muted-foreground ml-6">Show progress steps during generation</p>
            </div>

            <Separator />

            {/* Default Toggles */}
            <div>
              <Label className="text-sm font-medium">Default Features</Label>
              <p className="text-xs text-muted-foreground mb-3">
                Features enabled by default when starting a chat
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Web Search On</Label>
                  <Switch
                    checked={defaultWebSearch}
                    onCheckedChange={setDefaultWebSearch}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Knowledge (RAG) On</Label>
                  <Switch
                    checked={defaultKnowledge}
                    onCheckedChange={setDefaultKnowledge}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-4 p-1">
            {/* Temperature */}
            <div>
              <div className="flex items-center justify-between">
                <Label>Temperature</Label>
                <span className="text-sm text-muted-foreground">{parameters.temperature}</span>
              </div>
              <Slider
                value={[parameters.temperature || 0.7]}
                onValueChange={([v]) => setParameters({ ...parameters, temperature: v })}
                min={0}
                max={2}
                step={0.1}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Lower = more focused, higher = more creative
              </p>
            </div>

            {/* Top P */}
            <div>
              <div className="flex items-center justify-between">
                <Label>Top P (Nucleus Sampling)</Label>
                <span className="text-sm text-muted-foreground">{parameters.topP}</span>
              </div>
              <Slider
                value={[parameters.topP || 0.9]}
                onValueChange={([v]) => setParameters({ ...parameters, topP: v })}
                min={0}
                max={1}
                step={0.05}
                className="mt-2"
              />
            </div>

            {/* Max Tokens */}
            <div>
              <div className="flex items-center justify-between">
                <Label>Max Tokens</Label>
                <span className="text-sm text-muted-foreground">{parameters.maxTokens}</span>
              </div>
              <Slider
                value={[parameters.maxTokens || 4096]}
                onValueChange={([v]) => setParameters({ ...parameters, maxTokens: v })}
                min={256}
                max={32768}
                step={256}
                className="mt-2"
              />
            </div>

            <Separator />

            {/* Stop Sequences */}
            <div>
              <Label>Stop Sequences</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Force model to stop generating when it outputs these strings
              </p>
              <div className="flex gap-2">
                <Input
                  value={newStopSequence}
                  onChange={(e) => setNewStopSequence(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddStopSequence())}
                  placeholder="e.g., User:, <|end|>"
                />
                <Button variant="outline" size="icon" onClick={handleAddStopSequence}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {parameters.stopSequences && parameters.stopSequences.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {parameters.stopSequences.map((seq, i) => (
                    <Badge key={i} variant="outline" className="cursor-pointer font-mono" onClick={() => handleRemoveStopSequence(seq)}>
                      {seq}
                      <X className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </BaseDialog>
  );
}
