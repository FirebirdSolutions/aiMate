import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Search, MessageSquare, FileText, Clock, Tag } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { useConversations } from "../hooks/useConversations";
import { useKnowledge } from "../hooks/useKnowledge";

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectConversation?: (conversationId: string) => void;
}

type SearchResultType = 'conversation' | 'knowledge';

interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  tags?: string[];
  timestamp?: string;
}

export function SearchModal({ open, onOpenChange, onSelectConversation }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    includeChats: true,
    includeKnowledge: true,
  });
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const { conversations, searchConversations } = useConversations();
  const { documents, searchDocuments } = useKnowledge();

  const toggleFilter = (key: keyof typeof filters) => {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Perform search when query or filters change
  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.trim().length < 2) {
        setResults([]);
        return;
      }

      setSearching(true);
      const searchResults: SearchResult[] = [];

      try {
        // Search conversations
        if (filters.includeChats) {
          const convResults = await searchConversations(searchQuery);
          convResults.forEach(conv => {
            searchResults.push({
              id: conv.id,
              type: 'conversation',
              title: conv.title,
              subtitle: `${conv.messageCount || 0} messages`,
              tags: conv.tags,
              timestamp: conv.lastMessageAt,
            });
          });
        }

        // Search knowledge documents
        if (filters.includeKnowledge) {
          const docResults = await searchDocuments(searchQuery);
          docResults.forEach(doc => {
            searchResults.push({
              id: doc.id,
              type: 'knowledge',
              title: doc.title || doc.fileName,
              subtitle: doc.fileType,
              tags: doc.tags,
              timestamp: doc.updatedAt,
            });
          });
        }

        setResults(searchResults);
      } catch (err) {
        console.error('[SearchModal] Search failed:', err);
        setResults([]);
      } finally {
        setSearching(false);
      }
    };

    const debounceTimer = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, filters, searchConversations, searchDocuments]);

  // Reset search when modal closes
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setResults([]);
    }
  }, [open]);

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'conversation' && onSelectConversation) {
      onSelectConversation(result.id);
      onOpenChange(false);
    }
    // Knowledge items could open knowledge modal in future
  };

  const groupedResults = useMemo(() => {
    const convs = results.filter(r => r.type === 'conversation');
    const docs = results.filter(r => r.type === 'knowledge');
    return { conversations: convs, knowledge: docs };
  }, [results]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] h-[90vh] p-0 gap-0 flex flex-col overflow-auto">
        <DialogHeader className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search
          </DialogTitle>
          <DialogDescription className="sr-only">
            Search across chats and knowledge base
          </DialogDescription>
        </DialogHeader>

        {/* Search Input */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search conversations and knowledge..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>
        </div>

        {/* Filter Toggles */}
        <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-800">
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Switch
                id="include-chats"
                checked={filters.includeChats}
                onCheckedChange={() => toggleFilter("includeChats")}
                className="data-[state=checked]:bg-purple-600"
              />
              <Label htmlFor="include-chats" className="text-sm cursor-pointer">Chats</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="include-knowledge"
                checked={filters.includeKnowledge}
                onCheckedChange={() => toggleFilter("includeKnowledge")}
                className="data-[state=checked]:bg-purple-600"
              />
              <Label htmlFor="include-knowledge" className="text-sm cursor-pointer">Knowledge</Label>
            </div>
          </div>
        </div>

        {/* Search Results */}
        <ScrollArea className="flex-1">
          <div className="px-6 py-4">
            {searchQuery.trim().length < 2 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Type at least 2 characters to search
              </div>
            ) : searching ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Searching...
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No results found for "{searchQuery}"
              </div>
            ) : (
              <div className="space-y-6">
                {/* Conversations */}
                {groupedResults.conversations.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                      Conversations ({groupedResults.conversations.length})
                    </h3>
                    <div className="space-y-1">
                      {groupedResults.conversations.map((result) => (
                        <button
                          key={result.id}
                          onClick={() => handleResultClick(result)}
                          className="w-full text-left p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <MessageSquare className="h-4 w-4 mt-1 text-gray-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">
                                {result.title}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                                <span>{result.subtitle}</span>
                                {result.timestamp && (
                                  <>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {formatTimestamp(result.timestamp)}
                                    </span>
                                  </>
                                )}
                              </div>
                              {result.tags && result.tags.length > 0 && (
                                <div className="flex items-center gap-1 mt-2">
                                  <Tag className="h-3 w-3 text-gray-400" />
                                  <div className="flex gap-1 flex-wrap">
                                    {result.tags.slice(0, 3).map((tag) => (
                                      <span
                                        key={tag}
                                        className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Knowledge */}
                {groupedResults.knowledge.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                      Knowledge ({groupedResults.knowledge.length})
                    </h3>
                    <div className="space-y-1">
                      {groupedResults.knowledge.map((result) => (
                        <button
                          key={result.id}
                          onClick={() => handleResultClick(result)}
                          className="w-full text-left p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <FileText className="h-4 w-4 mt-1 text-gray-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">
                                {result.title}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                                <span className="uppercase">{result.subtitle}</span>
                                {result.timestamp && (
                                  <>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {formatTimestamp(result.timestamp)}
                                    </span>
                                  </>
                                )}
                              </div>
                              {result.tags && result.tags.length > 0 && (
                                <div className="flex items-center gap-1 mt-2">
                                  <Tag className="h-3 w-3 text-gray-400" />
                                  <div className="flex gap-1 flex-wrap">
                                    {result.tags.slice(0, 3).map((tag) => (
                                      <span
                                        key={tag}
                                        className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
