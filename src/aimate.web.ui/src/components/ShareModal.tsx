import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Link, Mail, Twitter, Linkedin, MessageCircle, Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationTitle?: string;
  conversationSummary?: string;
}

interface ShareOption {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  hoverColor: string;
  action: () => void;
}

export function ShareModal({ open, onOpenChange, conversationTitle, conversationSummary }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const url = typeof window !== 'undefined' ? window.location.href : '';
  const title = conversationTitle || 'Check out this AI conversation';
  const text = conversationSummary || `I had an interesting conversation with aiMate: "${title}"`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Check out this conversation: ${title}`);
    const body = encodeURIComponent(`${text}\n\nView it here: ${url}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    toast.success("Opening email client...");
  };

  const handleTwitterShare = () => {
    const tweetText = encodeURIComponent(`${text.slice(0, 200)}${text.length > 200 ? '...' : ''}`);
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}&url=${encodeURIComponent(url)}`, '_blank', 'width=550,height=420');
    toast.success("Opening Twitter/X...");
  };

  const handleLinkedInShare = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank', 'width=550,height=420');
    toast.success("Opening LinkedIn...");
  };

  const handleWhatsAppShare = () => {
    const message = encodeURIComponent(`${text}\n\n${url}`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
    toast.success("Opening WhatsApp...");
  };

  const shareOptions: ShareOption[] = [
    {
      id: 'copy',
      label: copied ? 'Copied!' : 'Copy Link',
      icon: copied ? Check : Copy,
      color: 'bg-gray-500',
      hoverColor: 'hover:bg-gray-600',
      action: handleCopyLink,
    },
    {
      id: 'email',
      label: 'Email',
      icon: Mail,
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      action: handleEmailShare,
    },
    {
      id: 'twitter',
      label: 'Twitter/X',
      icon: Twitter,
      color: 'bg-black dark:bg-white dark:text-black',
      hoverColor: 'hover:bg-gray-800 dark:hover:bg-gray-200',
      action: handleTwitterShare,
    },
    {
      id: 'linkedin',
      label: 'LinkedIn',
      icon: Linkedin,
      color: 'bg-[#0077B5]',
      hoverColor: 'hover:bg-[#006399]',
      action: handleLinkedInShare,
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-[#25D366]',
      hoverColor: 'hover:bg-[#1fb855]',
      action: handleWhatsAppShare,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share Conversation</DialogTitle>
          <DialogDescription>
            {conversationTitle ? `Share "${conversationTitle}"` : "Share this conversation with others"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-5 gap-3 py-4">
          {shareOptions.map((option) => (
            <button
              key={option.id}
              onClick={option.action}
              className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
              aria-label={option.label}
            >
              <div className={`${option.color} ${option.hoverColor} p-3 rounded-full transition-colors`}>
                <option.icon className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs font-medium text-center">{option.label}</span>
            </button>
          ))}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm text-gray-600 dark:text-gray-400 truncate">
              {url}
            </div>
            <button
              onClick={handleCopyLink}
              className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              aria-label="Copy link"
            >
              {copied ? <Check className="h-4 w-4" /> : <Link className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
