/**
 * ArenaComparison Component
 *
 * Side-by-side comparison of two model responses for blind evaluation
 */

import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import {
  Trophy,
  ThumbsUp,
  ThumbsDown,
  Equal,
  Clock,
  Zap,
  Eye,
  EyeOff,
  Tag,
  Plus,
  X,
  Loader2,
  RotateCw,
} from "lucide-react";
import { toast } from "sonner";
import { ArenaMatchDto } from "../api/types";
import { useEvaluation } from "../hooks/useEvaluation";
import ReactMarkdown from "react-markdown";

interface ArenaComparisonProps {
  match: ArenaMatchDto;
  onVoteSubmitted?: () => void;
  onNewMatch?: () => void;
}

export function ArenaComparison({
  match,
  onVoteSubmitted,
  onNewMatch,
}: ArenaComparisonProps) {
  const { submitArenaVote, isLoading } = useEvaluation();

  const [revealed, setRevealed] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<'a' | 'b' | 'tie' | null>(null);
  const [topicTags, setTopicTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [feedback, setFeedback] = useState("");

  const hasVoted = match.winner !== null && match.winner !== undefined;

  const handleVote = async (winner: 'a' | 'b' | 'tie') => {
    if (hasVoted) return;

    setSelectedWinner(winner);

    try {
      await submitArenaVote(winner, topicTags, feedback || undefined);
      setRevealed(true);
      onVoteSubmitted?.();
    } catch (error) {
      setSelectedWinner(null);
      console.error('Vote failed:', error);
    }
  };

  const handleAddTag = () => {
    const trimmed = newTag.trim().toLowerCase();
    if (trimmed && !topicTags.includes(trimmed)) {
      setTopicTags(prev => [...prev, trimmed]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTopicTags(prev => prev.filter(t => t !== tag));
  };

  const renderResponse = (response: string, side: 'a' | 'b') => {
    const isWinner = match.winner === side;
    const isLoser = match.winner && match.winner !== 'tie' && match.winner !== side;

    return (
      <Card className={`flex-1 ${isWinner ? 'ring-2 ring-green-500' : ''} ${isLoser ? 'opacity-70' : ''}`}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              {revealed || hasVoted ? (
                <Badge variant="outline">
                  {side === 'a' ? match.modelA.name : match.modelB.name}
                </Badge>
              ) : (
                <Badge variant="secondary">Model {side.toUpperCase()}</Badge>
              )}
              {isWinner && <Trophy className="h-4 w-4 text-yellow-500" />}
            </span>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {side === 'a' ? match.modelA.responseTimeMs : match.modelB.responseTimeMs}ms
              </span>
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                {side === 'a' ? match.modelA.tokenCount : match.modelB.tokenCount} tokens
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm dark:prose-invert max-w-none max-h-[400px] overflow-y-auto">
            <ReactMarkdown>{response}</ReactMarkdown>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* Prompt */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Badge variant="outline">Prompt</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{match.prompt}</p>
        </CardContent>
      </Card>

      {/* Side-by-side responses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderResponse(match.modelA.response, 'a')}
        {renderResponse(match.modelB.response, 'b')}
      </div>

      {/* Voting section */}
      {!hasVoted && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Cast Your Vote</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRevealed(!revealed)}
                className="text-xs"
              >
                {revealed ? (
                  <>
                    <EyeOff className="h-3 w-3 mr-1" /> Hide Models
                  </>
                ) : (
                  <>
                    <Eye className="h-3 w-3 mr-1" /> Reveal Models
                  </>
                )}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Vote buttons */}
            <div className="flex gap-3 justify-center">
              <Button
                variant={selectedWinner === 'a' ? 'default' : 'outline'}
                onClick={() => handleVote('a')}
                disabled={isLoading}
                className={selectedWinner === 'a' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                <ThumbsUp className="h-4 w-4 mr-2" />
                Model A Wins
              </Button>
              <Button
                variant={selectedWinner === 'tie' ? 'default' : 'outline'}
                onClick={() => handleVote('tie')}
                disabled={isLoading}
                className={selectedWinner === 'tie' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
              >
                <Equal className="h-4 w-4 mr-2" />
                Tie
              </Button>
              <Button
                variant={selectedWinner === 'b' ? 'default' : 'outline'}
                onClick={() => handleVote('b')}
                disabled={isLoading}
                className={selectedWinner === 'b' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                <ThumbsUp className="h-4 w-4 mr-2" />
                Model B Wins
              </Button>
            </div>

            {/* Topic tags */}
            <div>
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Tag className="h-3 w-3" />
                Add topic tags for re-ranking (optional)
              </p>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="e.g., coding, creative-writing"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleAddTag}
                  disabled={!newTag.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {topicTags.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {topicTags.map(tag => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="cursor-pointer"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      #{tag}
                      <X className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Optional feedback */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">
                Additional feedback (optional)
              </p>
              <Textarea
                placeholder="Why did you choose this response?"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="min-h-[60px]"
              />
            </div>

            {isLoading && (
              <div className="flex justify-center">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results section */}
      {hasVoted && (
        <Card className="bg-muted/50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <span className="font-medium">
                  {match.winner === 'tie'
                    ? "It's a tie!"
                    : `Winner: ${match.winner === 'a' ? match.modelA.name : match.modelB.name}`}
                </span>
              </div>
              {onNewMatch && (
                <Button variant="outline" size="sm" onClick={onNewMatch}>
                  <RotateCw className="h-4 w-4 mr-2" />
                  New Match
                </Button>
              )}
            </div>
            {match.tags && match.tags.length > 0 && (
              <div className="mt-2 flex gap-1 flex-wrap">
                {match.tags.map(tag => (
                  <Badge key={tag} variant="secondary">#{tag}</Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Scoring info */}
      <p className="text-xs text-muted-foreground text-center">
        Votes contribute to the Elo leaderboard. For fair evaluation, try voting before revealing model names.
      </p>
    </div>
  );
}
