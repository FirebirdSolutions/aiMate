/**
 * ModelLeaderboard Component
 *
 * Displays model rankings with Elo ratings, win rates, and performance by topic
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./ui/tooltip";
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  Medal,
  Filter,
  Download,
  RefreshCw,
  Info,
  BarChart3,
} from "lucide-react";
import { useEvaluation } from "../hooks/useEvaluation";
import { LeaderboardEntryDto, EvaluationStatsByTopicDto } from "../api/types";

interface ModelLeaderboardProps {
  compact?: boolean;   // Compact view for sidebar
  showExport?: boolean;
  onModelSelect?: (modelId: string) => void;
}

export function ModelLeaderboard({
  compact = false,
  showExport = true,
  onModelSelect,
}: ModelLeaderboardProps) {
  const {
    leaderboard,
    topicStats,
    isLoading,
    loadLeaderboard,
    loadTopicStats,
    exportData,
  } = useEvaluation({ autoLoadLeaderboard: true });

  const [filterProvider, setFilterProvider] = useState<string>('all');
  const [filterTopic, setFilterTopic] = useState<string>('all');

  useEffect(() => {
    loadTopicStats();
  }, [loadTopicStats]);

  // Get unique providers
  const providers = [...new Set(leaderboard.map(e => e.provider))];

  // Filter leaderboard
  const filteredLeaderboard = leaderboard.filter(entry => {
    if (filterProvider !== 'all' && entry.provider !== filterProvider) return false;
    return true;
  });

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="text-muted-foreground font-mono">{rank}</span>;
  };

  const getTrendIcon = (direction: 'up' | 'down' | 'stable', delta: number) => {
    if (direction === 'up') {
      return (
        <span className="flex items-center text-green-500 text-xs">
          <TrendingUp className="h-3 w-3 mr-0.5" />
          +{delta}
        </span>
      );
    }
    if (direction === 'down') {
      return (
        <span className="flex items-center text-red-500 text-xs">
          <TrendingDown className="h-3 w-3 mr-0.5" />
          {delta}
        </span>
      );
    }
    return (
      <span className="flex items-center text-muted-foreground text-xs">
        <Minus className="h-3 w-3" />
      </span>
    );
  };

  const getProviderColor = (provider: string) => {
    const colors: Record<string, string> = {
      'OpenAI': 'bg-green-500',
      'Anthropic': 'bg-orange-500',
      'Google': 'bg-blue-500',
      'Meta': 'bg-purple-500',
    };
    return colors[provider] || 'bg-gray-500';
  };

  const handleExport = async () => {
    await exportData({
      format: 'json',
      includeNegative: true,
    });
  };

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Top Models
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {filteredLeaderboard.slice(0, 5).map((entry) => (
            <div
              key={entry.modelId}
              className="flex items-center justify-between p-2 rounded hover:bg-muted cursor-pointer"
              onClick={() => onModelSelect?.(entry.modelId)}
            >
              <div className="flex items-center gap-2">
                {getRankIcon(entry.rank)}
                <div>
                  <p className="text-sm font-medium">{entry.modelName}</p>
                  <p className="text-xs text-muted-foreground">{entry.provider}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono">{entry.eloRating}</p>
                {getTrendIcon(entry.trendDirection, entry.trendDelta)}
              </div>
            </div>
          ))}
          {filteredLeaderboard.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No rankings yet. Start evaluating models!
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <h2 className="text-lg font-semibold">Model Leaderboard</h2>
          <Badge variant="outline">{filteredLeaderboard.length} models</Badge>
        </div>

        <div className="flex items-center gap-2">
          <Select value={filterProvider} onValueChange={setFilterProvider}>
            <SelectTrigger className="w-[150px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Providers</SelectItem>
              {providers.map(p => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={() => loadLeaderboard()}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>

          {showExport && (
            <Button variant="outline" size="icon" onClick={handleExport}>
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Main leaderboard table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">Rank</TableHead>
              <TableHead>Model</TableHead>
              <TableHead className="text-right">Elo Rating</TableHead>
              <TableHead className="text-right">Win Rate</TableHead>
              <TableHead className="text-right">Avg Rating</TableHead>
              <TableHead className="text-right">Evaluations</TableHead>
              <TableHead className="w-[80px]">Trend</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeaderboard.map((entry) => (
              <TableRow
                key={entry.modelId}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onModelSelect?.(entry.modelId)}
              >
                <TableCell>
                  <div className="flex justify-center">
                    {getRankIcon(entry.rank)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getProviderColor(entry.provider)}`} />
                    <div>
                      <p className="font-medium">{entry.modelName}</p>
                      <p className="text-xs text-muted-foreground">{entry.provider}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-mono font-semibold">{entry.eloRating}</span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Progress value={entry.winRate * 100} className="w-16 h-2" />
                    <span className="text-sm">{Math.round(entry.winRate * 100)}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-mono">{entry.averageRating.toFixed(1)}</span>
                  <span className="text-muted-foreground">/10</span>
                </TableCell>
                <TableCell className="text-right">
                  {entry.totalEvaluations}
                </TableCell>
                <TableCell>
                  {getTrendIcon(entry.trendDirection, entry.trendDelta)}
                </TableCell>
              </TableRow>
            ))}
            {filteredLeaderboard.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No models match the current filters
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Performance by Topic */}
      {topicStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Performance by Topic
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topicStats.map((stat) => (
                <Card key={stat.topic} className="bg-muted/50">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="capitalize">
                        {stat.topic.replace('_', ' ')}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {stat.totalEvaluations} evals
                      </span>
                    </div>
                    <div className="space-y-1">
                      {stat.topModels.slice(0, 3).map((model, idx) => (
                        <div key={model.modelId} className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1">
                            {idx === 0 && <Trophy className="h-3 w-3 text-yellow-500" />}
                            {model.modelName}
                          </span>
                          <span className="font-mono">{model.averageRating.toFixed(1)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Strengths/Weaknesses breakdown for top model */}
      {filteredLeaderboard.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Info className="h-4 w-4" />
              Top Model Analysis: {filteredLeaderboard[0].modelName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-green-600 mb-2">Strengths</h4>
                <div className="space-y-2">
                  {Object.entries(filteredLeaderboard[0].strengthsByTag).map(([tag, score]) => (
                    <div key={tag} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{tag.replace('_', ' ')}</span>
                      <div className="flex items-center gap-2">
                        <Progress value={score * 10} className="w-20 h-2" />
                        <span className="text-sm font-mono w-8">{score.toFixed(1)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-red-600 mb-2">Areas for Improvement</h4>
                <div className="space-y-2">
                  {Object.entries(filteredLeaderboard[0].weaknessesByTag).map(([tag, score]) => (
                    <div key={tag} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{tag.replace('_', ' ')}</span>
                      <div className="flex items-center gap-2">
                        <Progress value={score * 10} className="w-20 h-2" />
                        <span className="text-sm font-mono w-8">{score.toFixed(1)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info */}
      <p className="text-xs text-muted-foreground text-center">
        Rankings are calculated using the Elo rating system. Models need at least 10 evaluations to appear on the leaderboard.
      </p>
    </div>
  );
}
