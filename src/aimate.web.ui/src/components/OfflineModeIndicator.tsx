/**
 * Offline Mode Indicator
 * 
 * Shows when the app is running in offline/demo mode
 */

import { WifiOff, Info } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { AppConfig } from "../utils/config";

export function OfflineModeIndicator() {
  if (!AppConfig.isOfflineMode()) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
        >
          <WifiOff className="w-4 h-4" />
          <span className="text-xs font-medium hidden sm:inline">Offline Mode</span>
          <Badge variant="outline" className="border-amber-600 dark:border-amber-400 text-amber-600 dark:text-amber-400">
            Demo
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
              <Info className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 space-y-1">
              <h4 className="font-medium text-sm">Offline Demo Mode</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                You're viewing aiMate.nz with mock data. No real API calls are being made.
              </p>
            </div>
          </div>

          <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
            <p className="font-medium text-gray-900 dark:text-gray-100">What's working:</p>
            <ul className="space-y-1 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-green-500 dark:text-green-400 mt-0.5">✓</span>
                <span>Full UI with mock conversations</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 dark:text-green-400 mt-0.5">✓</span>
                <span>Simulated streaming responses</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 dark:text-green-400 mt-0.5">✓</span>
                <span>Multiple workspaces & models</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 dark:text-green-400 mt-0.5">✓</span>
                <span>All admin controls functional</span>
              </li>
            </ul>
          </div>

          <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <span className="font-medium text-gray-900 dark:text-gray-100">To connect to a real backend:</span> Configure <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">VITE_API_BASE_URL</code> in your environment
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
