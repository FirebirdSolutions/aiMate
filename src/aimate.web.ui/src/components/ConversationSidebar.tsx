import { useState, useMemo, useCallback, useEffect } from "react";
import { Button } from "./ui/button";
import { VirtualizedList, SimpleVirtualList } from "./ui/virtualized-list";
import { MessageSquare, Plus, Trash2, X, Search, FolderKanban, Sparkles, Settings, Archive, ShieldCheck, LogOut, ChevronUp, Info, ChevronDown, ChevronRight, Brain, MoreVertical, Share, Download, Edit, Pin, FolderInput, Check, Loader2, Folder, FolderOpen, FolderPlus, FileText } from "lucide-react";
import { useDebug } from "./DebugContext";
import { ErrorBoundary, ModalErrorFallback } from "./ErrorBoundary";
import { ConversationListSkeleton } from "./LoadingSkeletons";
import { SettingsModal } from "./SettingsModal";
import { AdminModal } from "./AdminModal";
import { AboutModal } from "./AboutModal";
import { ProjectModal, Project } from "./ProjectModal";
import { SearchModal } from "./SearchModal";
import { KnowledgeModal } from "./KnowledgeModal";
import { ShareModal } from "./ShareModal";
import { ArchivedModal } from "./ArchivedModal";
import { Input } from "./ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { useProjects } from "../hooks/useProjects";
import { Badge } from "./ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { toast } from "sonner";
import { exportToPdf, exportToJson, exportToMarkdown } from "../utils/exportPdf";

export interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
}

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation?: (id: string, newTitle: string) => void;
  onCloneConversation?: (id: string) => void;
  onExportConversation?: (id: string, format: 'pdf' | 'json' | 'md') => void;
  onClose?: () => void;
  enabledModels?: Record<string, boolean>;
  onToggleModel?: (modelId: string) => void;
  hasMore?: boolean;
  onLoadMore?: () => void;
  loading?: boolean;
  // Project view mode
  activeProjectId?: string | null;
  onSetActiveProject?: (projectId: string | null) => void;
}

export function ConversationSidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
  onCloneConversation,
  onExportConversation,
  onClose,
  enabledModels,
  onToggleModel,
  hasMore = false,
  onLoadMore,
  loading = false,
  activeProjectId = null,
  onSetActiveProject,
}: ConversationSidebarProps) {
  const { showcaseMode } = useDebug();

  // Use the useProjects hook for real project data
  const projectsHook = useProjects();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [knowledgeOpen, setKnowledgeOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareConversationId, setShareConversationId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | undefined>();
  const [projectModalMode, setProjectModalMode] = useState<"create" | "view">("create");
  const [projectsExpanded, setProjectsExpanded] = useState(false);
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [pinnedConversations, setPinnedConversations] = useState<string[]>([]);
  const [archivedConversationsLocal, setArchivedConversationsLocal] = useState<string[]>([]);

  // Folder state management
  interface ChatFolder {
    id: string;
    name: string;
    color?: string;
    conversationIds: string[];
  }

  const [folders, setFolders] = useState<ChatFolder[]>(() => {
    const saved = localStorage.getItem('aimate-chat-folders');
    return saved ? JSON.parse(saved) : [];
  });
  const [foldersExpanded, setFoldersExpanded] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState("");

  // Persist folders to localStorage
  useEffect(() => {
    localStorage.setItem('aimate-chat-folders', JSON.stringify(folders));
  }, [folders]);

  const createFolder = () => {
    if (!newFolderName.trim()) return;
    const newFolder: ChatFolder = {
      id: `folder-${Date.now()}`,
      name: newFolderName.trim(),
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
      conversationIds: [],
    };
    setFolders(prev => [...prev, newFolder]);
    setNewFolderName("");
    setCreatingFolder(false);
    toast.success(`Folder "${newFolder.name}" created`);
  };

  const deleteFolder = (folderId: string) => {
    setFolders(prev => prev.filter(f => f.id !== folderId));
    toast.success("Folder deleted");
  };

  const renameFolder = (folderId: string, newName: string) => {
    if (!newName.trim()) return;
    setFolders(prev => prev.map(f =>
      f.id === folderId ? { ...f, name: newName.trim() } : f
    ));
    setEditingFolderId(null);
    toast.success("Folder renamed");
  };

  const moveToFolder = (conversationId: string, folderId: string | null) => {
    setFolders(prev => prev.map(f => ({
      ...f,
      conversationIds: folderId === f.id
        ? [...new Set([...f.conversationIds, conversationId])]
        : f.conversationIds.filter(id => id !== conversationId)
    })));
    const folderName = folderId ? folders.find(f => f.id === folderId)?.name : 'root';
    toast.success(`Moved to ${folderName}`);
  };

  const toggleFolderExpanded = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  const getConversationFolder = (conversationId: string): string | null => {
    for (const folder of folders) {
      if (folder.conversationIds.includes(conversationId)) {
        return folder.id;
      }
    }
    return null;
  };

  // Map ProjectDto to simplified Project interface for the modal
  const projects: Project[] = useMemo(() =>
    projectsHook.projects.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description || '',
      createdAt: new Date(p.createdAt),
      // Extended properties for richer display
      icon: p.icon,
      color: p.color,
      status: p.status,
      priority: p.priority,
      progressPercent: p.progressPercent,
    })),
    [projectsHook.projects]
  );

  // Get active project data for project view mode
  const activeProject = useMemo(() =>
    activeProjectId ? projectsHook.projects.find(p => p.id === activeProjectId) : null,
    [activeProjectId, projectsHook.projects]
  );

  // Filter conversations when in project view
  const filteredConversations = useMemo(() => {
    if (!activeProjectId || !activeProject) return conversations;
    const projectConvIds = new Set(activeProject.conversationIds || []);
    return conversations.filter(c => projectConvIds.has(c.id));
  }, [conversations, activeProjectId, activeProject]);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  // Truncate text based on max character limit
  const truncateText = (text: string, maxLength: number = 28) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const handleNewProject = () => {
    setProjectModalMode("create");
    setSelectedProject(undefined);
    setProjectModalOpen(true);
  };

  const handleCreateProject = async (newProject: Project) => {
    try {
      // Create project using the hook
      const created = await projectsHook.createProject({
        key: newProject.name.substring(0, 8).toUpperCase().replace(/\s/g, ''),
        name: newProject.name,
        description: newProject.description,
        owner: 'User',
        ownerEmail: 'user@aimate.nz',
        status: 'Planning',
        priority: 'Medium',
        tags: [],
        teamMembers: [],
      });

      // Close the create modal and open the view modal
      setProjectModalOpen(false);
      setTimeout(() => {
        setSelectedProject({
          id: created.id,
          name: created.name,
          description: created.description || '',
          createdAt: new Date(created.createdAt),
          icon: created.icon,
          color: created.color,
          status: created.status,
          priority: created.priority,
          progressPercent: created.progressPercent,
        });
        setProjectModalMode("view");
        setProjectModalOpen(true);
      }, 100);
    } catch (err) {
      console.error('Failed to create project:', err);
      toast.error('Failed to create project');
    }
  };

  const handleViewProject = (project: Project) => {
    setProjectModalMode("view");
    setSelectedProject(project);
    setProjectModalOpen(true);
  };

  const handleExport = (conversationId: string, format: 'pdf' | 'json' | 'md') => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (onExportConversation) {
      onExportConversation(conversationId, format);
    } else {
      toast.info(`Exporting "${conversation?.title}" as ${format.toUpperCase()}...`);
    }
  };

  const handlePin = (conversationId: string) => {
    setPinnedConversations(prev => {
      if (prev.includes(conversationId)) {
        toast.success("Conversation unpinned");
        return prev.filter(id => id !== conversationId);
      } else {
        toast.success("Conversation pinned");
        return [...prev, conversationId];
      }
    });
  };

  const handleClone = (conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId);
    onCloneConversation?.(conversationId);
    toast.success(`Cloned "${conversation?.title}"`);
  };

  const handleMoveToProject = (conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId);
    toast.info(`Move "${conversation?.title}" to project...`);
  };

  const handleArchive = (conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId);
    setArchivedConversationsLocal(prev => [...prev, conversationId]);
    toast.success(`"${conversation?.title}" archived`);
  };

  const renderConversationItem = (conversation: Conversation) => (
    <div
      key={conversation.id}
      className={`group relative rounded-lg transition-colors ${activeConversationId === conversation.id
          ? "bg-gray-100 dark:bg-gray-800"
          : "hover:bg-gray-50 dark:hover:bg-gray-900"
        }`}
    >
      {renamingId === conversation.id ? (
        <div className="p-3 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 shrink-0 text-gray-500" />
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            className="h-8 text-sm"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onRenameConversation?.(conversation.id, renameValue);
                setRenamingId(null);
              } else if (e.key === "Escape") {
                setRenamingId(null);
              }
            }}
          />
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0"
            onClick={() => {
              onRenameConversation?.(conversation.id, renameValue);
              setRenamingId(null);
            }}
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0"
            onClick={() => setRenamingId(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <>
          <button
            onClick={() => onSelectConversation(conversation.id)}
            className="w-full text-left p-3 pr-10"
          >
            <div className="flex items-start gap-2">
              <MessageSquare className="h-4 w-4 mt-1 shrink-0 text-gray-500" />
              <div className="flex-1 min-w-0">
                <div className="text-sm whitespace-nowrap overflow-hidden">
                  {truncateText(conversation.title, 28)}
                </div>
              </div>
            </div>
          </button>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              side="right"
              align="start"
              className="w-48 p-1"
              onInteractOutside={(e) => showcaseMode && e.preventDefault()}
            >
              <div className="space-y-1">
                <button
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                  onClick={() => {
                    setShareConversationId(conversation.id);
                    setShareModalOpen(true);
                  }}
                >
                  <Share className="h-4 w-4" />
                  <span>Share</span>
                </button>
                {/* Export options */}
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left cursor-pointer"
                    >
                      <Download className="h-4 w-4" />
                      <span>Export</span>
                      <ChevronRight className="h-4 w-4 ml-auto text-gray-400" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    side="right"
                    align="start"
                    className="w-44 p-1 bg-gray-900 dark:bg-gray-900 text-white border-gray-700"
                    onInteractOutside={(e) => showcaseMode && e.preventDefault()}
                  >
                    <div className="space-y-1">
                      <button
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-gray-800 transition-colors text-left cursor-pointer"
                        onClick={() => handleExport(conversation.id, 'pdf')}
                      >
                        <FileText className="h-4 w-4 text-red-400" />
                        <span>PDF Document</span>
                      </button>
                      <button
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-gray-800 transition-colors text-left cursor-pointer"
                        onClick={() => handleExport(conversation.id, 'md')}
                      >
                        <FileText className="h-4 w-4 text-blue-400" />
                        <span>Markdown</span>
                      </button>
                      <button
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-gray-800 transition-colors text-left cursor-pointer"
                        onClick={() => handleExport(conversation.id, 'json')}
                      >
                        <FileText className="h-4 w-4 text-yellow-400" />
                        <span>JSON</span>
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>
                <button
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                  onClick={() => {
                    setRenameValue(conversation.title);
                    setRenamingId(conversation.id);
                  }}
                >
                  <Edit className="h-4 w-4" />
                  <span>Rename</span>
                </button>
                <button
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                  onClick={() => handlePin(conversation.id)}
                >
                  <Pin className="h-4 w-4" />
                  <span>{pinnedConversations.includes(conversation.id) ? 'Unpin' : 'Pin'}</span>
                </button>
                {/* Move to Folder */}
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left cursor-pointer"
                    >
                      <Folder className="h-4 w-4" />
                      <span>Move to Folder</span>
                      <ChevronRight className="h-4 w-4 ml-auto text-gray-400" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    side="right"
                    align="start"
                    className="w-56 p-0 bg-gray-900 dark:bg-gray-900 text-white border-gray-700"
                    onInteractOutside={(e) => showcaseMode && e.preventDefault()}
                  >
                    <div className="px-4 py-2.5 border-b border-gray-800">
                      <div className="text-xs text-gray-400">Folders</div>
                    </div>
                    <div className="p-2 space-y-1">
                      {getConversationFolder(conversation.id) && (
                        <button
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-gray-800 transition-colors text-left cursor-pointer text-yellow-400"
                          onClick={() => moveToFolder(conversation.id, null)}
                        >
                          <X className="h-4 w-4" />
                          <span>Remove from folder</span>
                        </button>
                      )}
                      {folders.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-400">No folders yet</div>
                      ) : (
                        folders.map(folder => (
                          <button
                            key={folder.id}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-gray-800 transition-colors text-left cursor-pointer ${getConversationFolder(conversation.id) === folder.id ? 'bg-gray-800' : ''}`}
                            onClick={() => moveToFolder(conversation.id, folder.id)}
                          >
                            <Folder className="h-4 w-4" style={{ color: folder.color }} />
                            <span>{folder.name}</span>
                            {getConversationFolder(conversation.id) === folder.id && (
                              <Check className="h-3 w-3 ml-auto text-green-400" />
                            )}
                          </button>
                        ))
                      )}
                      <div className="border-t border-gray-700 pt-1 mt-1">
                        <button
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-gray-800 transition-colors text-left cursor-pointer text-blue-400"
                          onClick={() => {
                            setFoldersExpanded(true);
                            setCreatingFolder(true);
                          }}
                        >
                          <FolderPlus className="h-4 w-4" />
                          <span>New folder</span>
                        </button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                {/* Move to Project */}
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left cursor-pointer"
                    >
                      <FolderInput className="h-4 w-4" />
                      <span>Move to Project</span>
                      <ChevronRight className="h-4 w-4 ml-auto text-gray-400" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    side="right"
                    align="start"
                    className="w-64 p-0 bg-gray-900 dark:bg-gray-900 text-white border-gray-700"
                    onInteractOutside={(e) => showcaseMode && e.preventDefault()}
                  >
                    <div className="px-4 py-2.5 border-b border-gray-800">
                      <div className="text-xs text-gray-400">Projects</div>
                    </div>
                    <div className="p-2">
                      {projects.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-400">No projects available</div>
                      ) : (
                        <SimpleVirtualList
                          items={projectsHook.projects}
                          estimatedItemHeight={40}
                          maxHeight={320}
                          getItemKey={(project) => project.id}
                          renderItem={(project) => {
                            const isInProject = project.conversationIds?.includes(conversation.id);
                            return (
                              <button
                                className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-gray-800 transition-colors text-left cursor-pointer ${isInProject ? 'bg-gray-800' : ''}`}
                                onClick={async () => {
                                  try {
                                    if (isInProject) {
                                      await projectsHook.removeConversation(project.id, conversation.id);
                                      toast.success(`Removed from "${project.name}"`);
                                    } else {
                                      await projectsHook.addConversation(project.id, conversation.id);
                                      toast.success(`Added to "${project.name}"`);
                                    }
                                  } catch (err) {
                                    toast.error('Failed to update project');
                                  }
                                }}
                              >
                                <FolderKanban className="h-4 w-4" style={{ color: project.color }} />
                                <span className="flex-1 truncate">{project.name}</span>
                                {isInProject && (
                                  <Check className="h-3 w-3 text-green-400" />
                                )}
                              </button>
                            );
                          }}
                        />
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
                <button
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                  onClick={() => handleArchive(conversation.id)}
                >
                  <Archive className="h-4 w-4" />
                  <span>Archive</span>
                </button>
                <button
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left text-red-600 dark:text-red-400"
                  onClick={() => setDeleteConfirmId(conversation.id)}
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </>
      )}
    </div>
  );

  // Get all conversation IDs that are in folders
  const conversationsInFolders = useMemo(() => {
    const inFolders = new Set<string>();
    folders.forEach(f => f.conversationIds.forEach(id => inFolders.add(id)));
    return inFolders;
  }, [folders]);

  const pinnedList = filteredConversations.filter(c => pinnedConversations.includes(c.id));
  const recentList = filteredConversations.filter(c =>
    !pinnedConversations.includes(c.id) &&
    !conversationsInFolders.has(c.id) &&
    !archivedConversationsLocal.includes(c.id)
  );

  // Combined list for virtualization with section headers
  type ListItem =
    | { type: 'section'; title: string; id: string }
    | { type: 'folder'; data: { id: string; name: string; color?: string; count: number; expanded: boolean } }
    | { type: 'conversation'; data: Conversation; inFolder?: boolean };

  const virtualizedItems = useMemo<ListItem[]>(() => {
    const items: ListItem[] = [];

    // Pinned section
    if (pinnedList.length > 0) {
      items.push({ type: 'section', title: 'Pinned', id: 'section-pinned' });
      pinnedList.forEach(c => items.push({ type: 'conversation', data: c }));
    }

    // Folders section - only show if we have folders (and not in project view)
    if (folders.length > 0 && !activeProjectId) {
      folders.forEach(folder => {
        const folderConversations = filteredConversations.filter(c =>
          folder.conversationIds.includes(c.id) && !archivedConversationsLocal.includes(c.id)
        );
        const isExpanded = expandedFolders.has(folder.id);

        items.push({
          type: 'folder',
          data: {
            id: folder.id,
            name: folder.name,
            color: folder.color,
            count: folderConversations.length,
            expanded: isExpanded
          }
        });

        if (isExpanded) {
          folderConversations.forEach(c => items.push({ type: 'conversation', data: c, inFolder: true }));
        }
      });
    }

    // Recent section (unfiled conversations)
    if (recentList.length > 0) {
      if (pinnedList.length > 0 || folders.length > 0) {
        items.push({ type: 'section', title: 'Recent', id: 'section-recent' });
      }
      recentList.forEach(c => items.push({ type: 'conversation', data: c }));
    }

    return items;
  }, [pinnedList, recentList, folders, expandedFolders, conversations, archivedConversationsLocal]);

  const getItemKey = useCallback((item: ListItem) => {
    if (item.type === 'section') return item.id;
    if (item.type === 'folder') return item.data.id;
    return item.data.id;
  }, []);

  const renderFolderItem = useCallback((folderData: { id: string; name: string; color?: string; count: number; expanded: boolean }) => {
    const isEditing = editingFolderId === folderData.id;

    return (
      <div className="group relative rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
        {isEditing ? (
          <div className="p-2 flex items-center gap-2">
            <Folder className="h-4 w-4 shrink-0" style={{ color: folderData.color }} />
            <Input
              value={editingFolderName}
              onChange={(e) => setEditingFolderName(e.target.value)}
              className="h-7 text-sm flex-1"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") renameFolder(folderData.id, editingFolderName);
                else if (e.key === "Escape") setEditingFolderId(null);
              }}
            />
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 shrink-0"
              onClick={() => renameFolder(folderData.id, editingFolderName)}
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 shrink-0"
              onClick={() => setEditingFolderId(null)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <>
            <button
              onClick={() => toggleFolderExpanded(folderData.id)}
              className="w-full text-left p-2 pr-10 flex items-center gap-2"
            >
              {folderData.expanded ? (
                <FolderOpen className="h-4 w-4 shrink-0" style={{ color: folderData.color }} />
              ) : (
                <Folder className="h-4 w-4 shrink-0" style={{ color: folderData.color }} />
              )}
              <span className="text-sm flex-1 truncate">{truncateText(folderData.name, 20)}</span>
              <span className="text-xs text-gray-400">{folderData.count}</span>
              {folderData.expanded ? (
                <ChevronDown className="h-3 w-3 text-gray-400" />
              ) : (
                <ChevronRight className="h-3 w-3 text-gray-400" />
              )}
            </button>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                side="right"
                align="start"
                className="w-36 p-1"
                onInteractOutside={(e) => showcaseMode && e.preventDefault()}
              >
                <div className="space-y-1">
                  <button
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                    onClick={() => {
                      setEditingFolderName(folderData.name);
                      setEditingFolderId(folderData.id);
                    }}
                  >
                    <Edit className="h-3 w-3" />
                    <span>Rename</span>
                  </button>
                  <button
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left text-red-600 dark:text-red-400"
                    onClick={() => deleteFolder(folderData.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Delete</span>
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </>
        )}
      </div>
    );
  }, [editingFolderId, editingFolderName, showcaseMode, truncateText]);

  const renderVirtualItem = useCallback((item: ListItem) => {
    if (item.type === 'section') {
      return (
        <div className="px-2 py-1">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            {item.title}
          </h2>
        </div>
      );
    }
    if (item.type === 'folder') {
      return renderFolderItem(item.data);
    }
    // Add indent for conversations inside folders
    const conversationEl = renderConversationItem(item.data);
    if (item.inFolder) {
      return <div className="pl-4">{conversationEl}</div>;
    }
    return conversationEl;
  }, [renderConversationItem, renderFolderItem, activeConversationId, renamingId, renameValue, pinnedConversations, showcaseMode]);

  return (
    <>
      <ErrorBoundary context="settings-modal" fallback={<ModalErrorFallback onClose={() => setSettingsOpen(false)} />}>
        <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      </ErrorBoundary>
      <ErrorBoundary context="admin-modal" fallback={<ModalErrorFallback onClose={() => setAdminOpen(false)} />}>
        <AdminModal
          open={adminOpen}
          onOpenChange={setAdminOpen}
          enabledModels={enabledModels}
          onToggleModel={onToggleModel}
        />
      </ErrorBoundary>
      <ErrorBoundary context="about-modal" fallback={<ModalErrorFallback onClose={() => setAboutOpen(false)} />}>
        <AboutModal open={aboutOpen} onOpenChange={setAboutOpen} />
      </ErrorBoundary>
      <ErrorBoundary context="search-modal" fallback={<ModalErrorFallback onClose={() => setSearchOpen(false)} />}>
        <SearchModal
          open={searchOpen}
          onOpenChange={setSearchOpen}
          onSelectConversation={onSelectConversation}
        />
      </ErrorBoundary>
      <ErrorBoundary context="knowledge-modal" fallback={<ModalErrorFallback onClose={() => setKnowledgeOpen(false)} />}>
        <KnowledgeModal open={knowledgeOpen} onOpenChange={setKnowledgeOpen} />
      </ErrorBoundary>
      <ErrorBoundary context="project-modal" fallback={<ModalErrorFallback onClose={() => setProjectModalOpen(false)} />}>
        <ProjectModal
          open={projectModalOpen}
          onOpenChange={setProjectModalOpen}
          project={selectedProject}
          mode={projectModalMode}
          onCreateProject={handleCreateProject}
        />
      </ErrorBoundary>

      <div className="flex flex-col h-full bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800">
        {/* Logo and Close Button */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-500" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              aimate
            </span>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Project View Banner */}
        {activeProject && (
          <div className="flex-shrink-0 px-3 py-2 bg-purple-50 dark:bg-purple-950/30 border-b border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center text-sm shrink-0"
                  style={{ backgroundColor: (activeProject.color || '#8b5cf6') + '20' }}
                >
                  {activeProject.icon || '📁'}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-purple-700 dark:text-purple-300 truncate">
                    {activeProject.name}
                  </div>
                  <div className="text-xs text-purple-500 dark:text-purple-400">
                    {filteredConversations.length} chat{filteredConversations.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSetActiveProject?.(null)}
                className="text-purple-600 hover:text-purple-700 dark:text-purple-400 h-7 px-2 shrink-0"
              >
                <X className="h-3 w-3 mr-1" />
                Exit
              </Button>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-shrink-0 p-3 space-y-1 border-b border-gray-200 dark:border-gray-800">
          <Button
            onClick={onNewConversation}
            variant="ghost"
            className="w-full justify-start gap-3"
          >
            <MessageSquare className="h-4 w-4" />
            {activeProject ? `New chat in project` : 'Start a new chat'}
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-4 w-4" />
            Search
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3"
            onClick={() => setKnowledgeOpen(true)}
          >
            <Brain className="h-4 w-4" />
            Knowledge
          </Button>
          {/* Folders collapsible - hidden in project mode */}
          {!activeProjectId && (
          <Collapsible open={foldersExpanded} onOpenChange={setFoldersExpanded}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3"
              >
                <Folder className="h-4 w-4" />
                Folders
                <span className="text-xs text-gray-400 ml-1">({folders.length})</span>
                {foldersExpanded ? (
                  <ChevronDown className="h-4 w-4 ml-auto" />
                ) : (
                  <ChevronRight className="h-4 w-4 ml-auto" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 mt-1">
              {creatingFolder ? (
                <div className="flex items-center gap-2 pl-10 pr-2">
                  <Input
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Folder name"
                    className="h-7 text-sm flex-1"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") createFolder();
                      else if (e.key === "Escape") {
                        setCreatingFolder(false);
                        setNewFolderName("");
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 shrink-0"
                    onClick={createFolder}
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 shrink-0"
                    onClick={() => {
                      setCreatingFolder(false);
                      setNewFolderName("");
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-3 pl-10 text-sm"
                  onClick={() => setCreatingFolder(true)}
                >
                  <FolderPlus className="h-3 w-3" />
                  New Folder
                </Button>
              )}
              {folders.length === 0 ? (
                <div className="text-xs text-gray-500 dark:text-gray-400 pl-10 py-2">
                  No folders yet
                </div>
              ) : (
                folders.map((folder) => (
                  <div key={folder.id} className="relative group">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start gap-2 pl-10 text-sm pr-8 overflow-hidden"
                      onClick={() => toggleFolderExpanded(folder.id)}
                    >
                      {expandedFolders.has(folder.id) ? (
                        <FolderOpen className="h-3 w-3 shrink-0" style={{ color: folder.color }} />
                      ) : (
                        <Folder className="h-3 w-3 shrink-0" style={{ color: folder.color }} />
                      )}
                      <span className="truncate flex-1">{truncateText(folder.name, 16)}</span>
                      <span className="text-[10px] text-gray-400 shrink-0">{folder.conversationIds.length}</span>
                    </Button>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        side="right"
                        align="start"
                        className="w-36 p-1"
                        onInteractOutside={(e) => showcaseMode && e.preventDefault()}
                      >
                        <div className="space-y-1">
                          <button
                            className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                            onClick={() => {
                              setEditingFolderName(folder.name);
                              setEditingFolderId(folder.id);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                            <span>Rename</span>
                          </button>
                          <button
                            className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left text-red-600 dark:text-red-400"
                            onClick={() => deleteFolder(folder.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                ))
              )}
            </CollapsibleContent>
          </Collapsible>
          )}
          {/* Projects collapsible - hidden in project mode */}
          {!activeProjectId && (
          <Collapsible open={projectsExpanded} onOpenChange={setProjectsExpanded}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3"
              >
                <FolderKanban className="h-4 w-4" />
                Projects
                {projectsExpanded ? (
                  <ChevronDown className="h-4 w-4 ml-auto" />
                ) : (
                  <ChevronRight className="h-4 w-4 ml-auto" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 mt-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-3 pl-10 text-sm"
                onClick={handleNewProject}
              >
                <Plus className="h-3 w-3" />
                New Project
              </Button>
              {projectsHook.loading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              ) : projects.length === 0 ? (
                <div className="text-xs text-gray-500 dark:text-gray-400 pl-10 py-2">
                  No projects yet
                </div>
              ) : (
                projects.map((project) => (
                  <div key={project.id} className="relative group">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`w-full justify-start gap-2 pl-10 text-sm pr-8 overflow-hidden ${activeProjectId === project.id ? 'bg-purple-100 dark:bg-purple-950/50' : ''}`}
                      onClick={() => {
                        // Enter project view mode
                        if (onSetActiveProject) {
                          onSetActiveProject(project.id);
                        }
                      }}
                    >
                      {project.icon ? (
                        <span className="text-sm shrink-0">{project.icon}</span>
                      ) : (
                        <FolderKanban
                          className="h-3 w-3 shrink-0"
                          style={{ color: project.color || undefined }}
                        />
                      )}
                      <span className="truncate flex-1">{truncateText(project.name, 18)}</span>
                      {project.status === 'In Progress' && project.progressPercent !== undefined && (
                        <span className="text-[10px] text-gray-400 shrink-0">{project.progressPercent}%</span>
                      )}
                    </Button>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        side="right"
                        align="start"
                        className="w-40 p-1"
                        onInteractOutside={(e) => showcaseMode && e.preventDefault()}
                      >
                        <div className="space-y-1">
                          <button
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                            onClick={() => handleViewProject(project)}
                          >
                            <Edit className="h-4 w-4" />
                            <span>Edit</span>
                          </button>
                          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left">
                            <Archive className="h-4 w-4" />
                            <span>Archive</span>
                          </button>
                          <button
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left text-red-600 dark:text-red-400"
                            onClick={() => {
                              projectsHook.deleteProject(project.id);
                              toast.success('Project deleted');
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                ))
              )}
            </CollapsibleContent>
          </Collapsible>
          )}
        </nav>

        {/* Conversations Section with Virtualized List */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {loading && conversations.length === 0 ? (
            <div className="p-2">
              <ConversationListSkeleton count={5} />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 px-4 text-sm text-gray-500 dark:text-gray-400">
              No conversations yet. Start a new chat!
            </div>
          ) : (
            <VirtualizedList
              items={virtualizedItems}
              estimatedItemHeight={52}
              height="100%"
              renderItem={renderVirtualItem}
              getItemKey={getItemKey}
              className="flex-1"
              innerClassName="p-2 custom-scrollbar"
              overscan={5}
              onEndReached={hasMore ? onLoadMore : undefined}
              endReachedThreshold={3}
              isLoading={loading}
            />
          )}
        </div>

        {/* User Footer */}
        <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-800 p-3">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-auto py-2 px-3"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=user" />
                  <AvatarFallback className="bg-purple-500 text-white">JD</AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left overflow-hidden">
                  <div className="text-sm font-medium truncate">John Doe</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    john.doe@example.com
                  </div>
                </div>
                <ChevronUp className="h-4 w-4 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              align="start"
              className="w-56"
              sideOffset={8}
              onInteractOutside={(e) => showcaseMode && e.preventDefault()}
            >
              <DropdownMenuItem
                className="gap-2 cursor-pointer"
                onClick={() => setSettingsOpen(true)}
              >
                <Settings className="h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 cursor-pointer"
                onClick={() => setArchivedOpen(true)}
              >
                <Archive className="h-4 w-4" />
                Archived
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 cursor-pointer"
                onClick={() => setAdminOpen(true)}
              >
                <ShieldCheck className="h-4 w-4" />
                Admin Panel
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 cursor-pointer"
                onClick={() => setAboutOpen(true)}
              >
                <Info className="h-4 w-4" />
                About
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 cursor-pointer text-red-600 dark:text-red-400">
                <LogOut className="h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Share Modal */}
        <ErrorBoundary context="share-modal" fallback={<ModalErrorFallback onClose={() => setShareModalOpen(false)} />}>
          <ShareModal
            open={shareModalOpen}
            onOpenChange={setShareModalOpen}
            conversationTitle={conversations.find(c => c.id === shareConversationId)?.title}
          />
        </ErrorBoundary>

        {/* Archived Modal */}
        <ErrorBoundary context="archived-modal" fallback={<ModalErrorFallback onClose={() => setArchivedOpen(false)} />}>
          <ArchivedModal
            open={archivedOpen}
            onOpenChange={setArchivedOpen}
          />
        </ErrorBoundary>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteConfirmId !== null} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this conversation.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteConfirmId(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (deleteConfirmId) {
                    onDeleteConversation(deleteConfirmId);
                    setDeleteConfirmId(null);
                  }
                }}
                className="bg-red-500 hover:bg-red-600"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}