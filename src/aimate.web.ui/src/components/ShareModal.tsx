import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Link } from "lucide-react";
import { toast } from "sonner";

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationTitle?: string;
}

export function ShareModal({ open, onOpenChange, conversationTitle }: ShareModalProps) {
  const handleShare = () => {
    // Copy link to clipboard
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share Conversation</DialogTitle>
          <DialogDescription>
            {conversationTitle ? `Share "${conversationTitle}"` : "Share this conversation"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center py-4">
          <button
            onClick={handleShare}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors group"
          >
            <div className="bg-gray-500 hover:bg-gray-600 p-3 rounded-full transition-colors">
              <Link className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-medium">Copy Link</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
