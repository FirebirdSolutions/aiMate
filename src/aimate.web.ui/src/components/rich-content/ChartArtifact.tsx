/**
 * Chart Artifact Component
 *
 * Renders interactive data visualizations using Recharts.
 * Supports bar, line, pie, and area charts.
 */

import { useState, useMemo } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Download,
  Brain,
  BarChart3,
  LineChart,
  PieChart as PieChartIcon,
  AreaChart as AreaChartIcon,
  Maximize2,
  Minimize2,
  Table2,
} from "lucide-react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  LineChart as RechartsLine,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { ChartArtifactData, ArtifactProps } from "./types";

// Default color palette
const DEFAULT_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
];

// Chart type icons
const CHART_ICONS = {
  bar: BarChart3,
  line: LineChart,
  pie: PieChartIcon,
  area: AreaChartIcon,
};

export function ChartArtifact({
  data,
  onSaveToKnowledge,
  collapsed: initialCollapsed = true,
}: ArtifactProps<ChartArtifactData>) {
  const [isExpanded, setIsExpanded] = useState(!initialCollapsed);
  const [copied, setCopied] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showData, setShowData] = useState(false);

  const colors = data.colors || DEFAULT_COLORS;
  const ChartIcon = CHART_ICONS[data.chartType] || BarChart3;

  // Get Y keys as array
  const yKeys = useMemo(() => {
    if (Array.isArray(data.yKey)) return data.yKey;
    return [data.yKey];
  }, [data.yKey]);

  // Export as CSV
  const handleDownload = () => {
    const headers = [data.xKey, ...yKeys].join(',');
    const rows = data.data.map(item =>
      [item[data.xKey], ...yKeys.map(k => item[k])].join(',')
    ).join('\n');
    const csv = `${headers}\n${rows}`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.title || 'chart'}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Downloaded CSV");
  };

  // Copy data as JSON
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data.data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Copied data to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleSaveToKnowledge = () => {
    onSaveToKnowledge?.(data);
    toast.success("Saved to Knowledge");
  };

  // Render the appropriate chart type
  const renderChart = () => {
    const commonProps = {
      data: data.data,
      margin: { top: 10, right: 30, left: 0, bottom: 0 },
    };

    switch (data.chartType) {
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data.data}
              dataKey={yKeys[0]}
              nameKey={data.xKey}
              cx="50%"
              cy="50%"
              outerRadius={fullscreen ? 150 : 100}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {data.data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
              }}
            />
            <Legend />
          </PieChart>
        );

      case 'line':
        return (
          <RechartsLine {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey={data.xKey}
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
            />
            <YAxis
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
              }}
            />
            <Legend />
            {yKeys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={{ fill: colors[index % colors.length] }}
                activeDot={{ r: 6 }}
              />
            ))}
          </RechartsLine>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey={data.xKey}
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
            />
            <YAxis
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
              }}
            />
            <Legend />
            {yKeys.map((key, index) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index % colors.length]}
                fill={colors[index % colors.length]}
                fillOpacity={0.3}
              />
            ))}
          </AreaChart>
        );

      case 'bar':
      default:
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey={data.xKey}
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
            />
            <YAxis
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
              }}
            />
            <Legend />
            {yKeys.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                fill={colors[index % colors.length]}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        );
    }
  };

  return (
    <div className={`rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 my-2 overflow-hidden ${fullscreen ? 'fixed inset-4 z-50 bg-white dark:bg-gray-900 flex flex-col' : 'max-w-2xl'}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <ChartIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <span className="text-sm font-medium">
            {data.title || 'Chart'}
          </span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">
            {data.chartType}
          </Badge>
          <span className="text-xs text-gray-400">
            {data.data.length} items
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 w-7 p-0 ${showData ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
            onClick={() => setShowData(!showData)}
            title={showData ? "Show chart" : "Show data"}
          >
            <Table2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={handleCopy}
            title="Copy data"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={handleDownload}
            title="Download CSV"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
          {onSaveToKnowledge && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={handleSaveToKnowledge}
              title="Save to Knowledge"
            >
              <Brain className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setFullscreen(!fullscreen)}
            title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {fullscreen ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className={`bg-gray-950 ${fullscreen ? 'flex-1' : ''}`}>
          {showData ? (
            // Data table view
            <div className={`overflow-auto ${fullscreen ? 'h-full' : 'max-h-[400px]'}`}>
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-800">
                    <th className="px-3 py-2 text-left font-medium text-gray-400 border-r border-gray-700">
                      {data.xKey}
                    </th>
                    {yKeys.map((key, idx) => (
                      <th
                        key={key}
                        className="px-3 py-2 text-left font-medium border-r border-gray-700 last:border-r-0"
                        style={{ color: colors[idx % colors.length] }}
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((row, rowIdx) => (
                    <tr
                      key={rowIdx}
                      className="border-t border-gray-800 hover:bg-gray-900"
                    >
                      <td className="px-3 py-1.5 text-gray-300 border-r border-gray-800">
                        {row[data.xKey]}
                      </td>
                      {yKeys.map((key) => (
                        <td
                          key={key}
                          className="px-3 py-1.5 text-gray-300 border-r border-gray-800 last:border-r-0"
                        >
                          {row[key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            // Chart view
            <div className={`p-4 ${fullscreen ? 'h-full' : 'h-[300px]'}`}>
              <ResponsiveContainer width="100%" height="100%">
                {renderChart()}
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ChartArtifact;
