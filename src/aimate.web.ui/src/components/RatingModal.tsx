import { useState, useEffect, useMemo } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { ThumbsUp, ThumbsDown, Tag, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { BaseDialog } from "./BaseDialog";
import { useEvaluation } from "../hooks/useEvaluation";
import { EvaluationTagCategory } from "../api/types";
import { Badge } from "./ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./ui/tabs";

interface RatingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "up" | "down";
  // Context for the evaluation
  messageId?: string;
  modelId?: string;
  conversationId?: string;
  prompt?: string;       // The user's prompt (for snapshot)
  response?: string;     // The model's response (for snapshot)
  onSubmitted?: () => void;
}

// Group tags by category for easier navigation
const TAG_CATEGORIES: { key: EvaluationTagCategory; label: string; icon: string }[] = [
  { key: 'tool_use', label: 'Tool Use', icon: '' },
  { key: 'general_chat', label: 'General', icon: '' },
  { key: 'safety', label: 'Safety', icon: '' },
  { key: 'instruction_following', label: 'Instructions', icon: '' },
  { key: 'code_quality', label: 'Code', icon: '' },
  { key: 'helpfulness', label: 'Helpfulness', icon: '' },
  { key: 'creativity', label: 'Creativity', icon: '' },
  { key: 'accuracy', label: 'Accuracy', icon: '' },
  { key: 'custom', label: 'Custom', icon: '' },
];

export function RatingModal({
  open,
  onOpenChange,
  type,
  messageId,
  modelId,
  conversationId,
  prompt,
  response,
  onSubmitted,
}: RatingModalProps) {
  const { tags, submitEvaluation, createTag } = useEvaluation();

  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");
  const [customTopicTags, setCustomTopicTags] = useState<string[]>([]);
  const [newTopicTag, setNewTopicTag] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeCategory, setActiveCategory] = useState<EvaluationTagCategory>('general_chat');

  // Set default rating based on thumbs up/down
  useEffect(() => {
    if (open) {
      setSelectedRating(type === "up" ? 8 : 3);
    }
  }, [open, type]);

  // Group tags by category
  const tagsByCategory = useMemo(() => {
    const grouped: Record<string, typeof tags> = {};
    tags.forEach(tag => {
      if (!grouped[tag.category]) {
        grouped[tag.category] = [];
      }
      grouped[tag.category].push(tag);
    });
    return grouped;
  }, [tags]);

  // Filter tags by sentiment based on type
  const filteredTags = useMemo(() => {
    const categoryTags = tagsByCategory[activeCategory] || [];
    // For thumbs up, show positive and neutral tags
    // For thumbs down, show negative and neutral tags
    if (type === 'up') {
      return categoryTags.filter(t => t.sentiment !== 'negative');
    }
    return categoryTags.filter(t => t.sentiment !== 'positive');
  }, [tagsByCategory, activeCategory, type]);

  const handleToggleTag = (tagKey: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagKey) ? prev.filter((t) => t !== tagKey) : [...prev, tagKey]
    );
  };

  const handleAddTopicTag = () => {
    const trimmed = newTopicTag.trim().toLowerCase();
    if (trimmed && !customTopicTags.includes(trimmed)) {
      setCustomTopicTags(prev => [...prev, trimmed]);
      setNewTopicTag("");
    }
  };

  const handleRemoveTopicTag = (tag: string) => {
    setCustomTopicTags(prev => prev.filter(t => t !== tag));
  };

  const handleSave = async () => {
    if (!messageId || !modelId) {
      // Legacy mode - just log
      console.log({
        type,
        rating: selectedRating,
        tags: selectedTags,
        feedback,
        topicTags: customTopicTags,
      });
      toast.success("Rating saved!");
      onOpenChange(false);
      resetState();
      return;
    }

    try {
      setIsSubmitting(true);

      await submitEvaluation({
        messageId,
        modelId,
        rating: selectedRating || (type === 'up' ? 8 : 3),
        tags: selectedTags,
        feedback: feedback || undefined,
        conversationId,
        prompt,
        response,
      });

      onSubmitted?.();
      onOpenChange(false);
      resetState();
    } catch (error) {
      console.error('Failed to save evaluation:', error);
      toast.error('Failed to save rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetState = () => {
    setSelectedRating(null);
    setSelectedTags([]);
    setFeedback("");
    setCustomTopicTags([]);
    setNewTopicTag("");
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      resetState();
    }
    onOpenChange(isOpen);
  };

  return (
    <BaseDialog
      open={open}
      onOpenChange={handleClose}
      title={type === "up" ? "Positive Feedback" : "Negative Feedback"}
      description="Help improve the AI by providing detailed feedback"
      size="lg"
      onSave={handleSave}
      showSave={true}
      showDelete={false}
      saveLabel={isSubmitting ? "Saving..." : "Submit Feedback"}
    >
      <div className="space-y-6">
        {/* Rating Scale */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            {type === 'up' ? (
              <ThumbsUp className="h-4 w-4 text-green-500" />
            ) : (
              <ThumbsDown className="h-4 w-4 text-red-500" />
            )}
            Rate this response (1-10)
          </h3>
          <div className="flex gap-2 flex-wrap">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <Button
                key={num}
                variant={selectedRating === num ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedRating(num)}
                className={
                  selectedRating === num
                    ? num >= 6
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                    : ""
                }
              >
                {num}
              </Button>
            ))}
          </div>
        </div>

        {/* Behavior Tags by Category */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Tag className="h-4 w-4" />
            What behaviors did you observe?
          </h3>

          <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as EvaluationTagCategory)}>
            <TabsList className="flex-wrap h-auto gap-1 mb-3">
              {TAG_CATEGORIES.filter(cat => tagsByCategory[cat.key]?.length > 0).map((cat) => (
                <TabsTrigger key={cat.key} value={cat.key} className="text-xs">
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {TAG_CATEGORIES.map((cat) => (
              <TabsContent key={cat.key} value={cat.key} className="mt-0">
                <div className="flex gap-2 flex-wrap">
                  {filteredTags.map((tag) => (
                    <Button
                      key={tag.key}
                      variant={selectedTags.includes(tag.key) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleToggleTag(tag.key)}
                      className={
                        selectedTags.includes(tag.key)
                          ? tag.sentiment === 'positive'
                            ? "bg-green-600 hover:bg-green-700"
                            : tag.sentiment === 'negative'
                              ? "bg-red-600 hover:bg-red-700"
                              : "bg-purple-500 hover:bg-purple-600"
                          : ""
                      }
                      title={tag.description}
                    >
                      {tag.label}
                    </Button>
                  ))}
                  {filteredTags.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No {type === 'up' ? 'positive' : 'negative'} tags in this category
                    </p>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>

          {/* Selected tags summary */}
          {selectedTags.length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs text-muted-foreground mb-2">Selected tags:</p>
              <div className="flex gap-1 flex-wrap">
                {selectedTags.map(tagKey => {
                  const tag = tags.find(t => t.key === tagKey);
                  return (
                    <Badge
                      key={tagKey}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => handleToggleTag(tagKey)}
                      style={{ backgroundColor: tag?.color + '20', borderColor: tag?.color }}
                    >
                      {tag?.label || tagKey}
                      <X className="h-3 w-3 ml-1" />
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Topic Tags for Re-ranking */}
        <div>
          <h3 className="font-semibold mb-3">Topic Tags (for re-ranking)</h3>
          <p className="text-xs text-muted-foreground mb-2">
            Add topic tags to enable topic-based model rankings
          </p>
          <div className="flex gap-2 mb-2">
            <Input
              placeholder="Add topic (e.g., coding, creative-writing)"
              value={newTopicTag}
              onChange={(e) => setNewTopicTag(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTopicTag()}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleAddTopicTag}
              disabled={!newTopicTag.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {customTopicTags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {customTopicTags.map(tag => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() => handleRemoveTopicTag(tag)}
                >
                  #{tag}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Feedback Text */}
        <div>
          <h3 className="font-semibold mb-3">Additional Comments</h3>
          <Textarea
            placeholder="Tell us more about your experience... What could be improved?"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="min-h-[100px]"
          />
        </div>

        {/* Info about snapshots */}
        {messageId && modelId && (
          <p className="text-xs text-muted-foreground border-t pt-3">
            This feedback will be saved for model improvement and leaderboard rankings.
            {prompt && response && " A snapshot will be captured for fine-tuning purposes."}
          </p>
        )}
      </div>
    </BaseDialog>
  );
}
