import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Phone, Video, MoreVertical, Send, Image, Smile, Loader2, Paperclip, FileText, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { api, createChatWebSocket } from '@/services/api';
import { useEffect, useRef } from 'react';
import { getProfilePhoto } from '@/utils/profileUtils';
import { formatMessageTime } from '@/utils/timeUtils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const COMMON_EMOJIS = ['😂', '❤️', '😍', '🤔', '🔥', '👍', '🙌', '✨', '😭', '😅', '😊', '🙏', '🎉', '💩', '💯'];

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  message_type?: string;
  file_url?: string;
  file_name?: string;
}

export default function ChatConversation() {
  const { id } = useParams(); // id is the matchId
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [matchProfile, setMatchProfile] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<{ file: File; previewUrl: string | null } | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const formatLastSeen = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffMin < 1) return 'Last seen just now';
    if (diffMin < 60) return `Last seen ${diffMin}m ago`;
    if (diffHr < 24) return `Last seen ${diffHr}h ago`;
    if (diffDay < 7) return `Last seen ${diffDay}d ago`;
    return `Last seen ${date.toLocaleDateString()}`;
  };
  useEffect(() => {
    // Get current user ID from local storage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUserId(user.id);
      } catch (e) {
        console.error('Error parsing user from localstorage', e);
      }
    }

    const loadData = async () => {
      try {
        setIsLoading(true);
        // 1. Fetch match details to get profile info
        const matchData = await api.matches.getMatch(id!);
        setMatchProfile(matchData.profile);

        // Set initial online status from match data
        setIsOnline(matchData.is_online || false);

        // Also fetch detailed status (includes last_seen)
        if (matchData.profile?.id) {
          try {
            const statusData = await api.chat.getUserStatus(matchData.profile.id);
            setIsOnline(statusData.is_online);
            setLastSeen(statusData.last_seen);
          } catch (e) {
            console.warn('Could not fetch user status:', e);
          }
        }
        // 2. Fetch initial messages
        const msgs = await api.chat.getMessages(id!);
        setMessages(msgs);

        // 3. Mark all messages in this conversation as read
        try {
          await api.chat.markAsRead(id!);
        } catch (e) {
          console.warn('Could not mark messages as read:', e);
        }

        // Correct order: Backend returns [Newest, ..., Oldest]
        // We want to display [Oldest, ..., Newest] at the bottom
        // So we reverse it.
      } catch (error) {
        console.error('Failed to load chat data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // 3. Setup WebSocket or Fallback Polling
    let ws: WebSocket | null = null;
    let fallbackInterval: NodeJS.Timeout | null = null;

    const startPolling = () => {
      console.log('Using HTTP polling for chat (WebSocket unavailable)');
      fallbackInterval = setInterval(async () => {
        try {
          const newMsgs = await api.chat.getMessages(id!);
          // Only update if we have new messages to avoid cursor jumps
          // Assuming backend returns latest messages
          setMessages(prev => {
            // Simple check: if lengths differ or last message ID differs
            if (newMsgs.length !== prev.length ||
              (newMsgs.length > 0 && prev.length > 0 && newMsgs[newMsgs.length - 1].id !== prev[prev.length - 1].id)) {
              return newMsgs;
            }
            return prev;
          });
        } catch (e) {
          console.error('Polling error:', e);
        }
      }, 3000); // Poll every 3 seconds
    };

    // Check if WS is explicitly disabled via env
    const useWs = import.meta.env.VITE_USE_WS !== 'false';

    if (useWs) {
      try {
        ws = createChatWebSocket((data) => {
          // Handle incoming WebSocket messages
          if (data.type === 'message.new' && data.match_id === id) {
            // Standardize format
            const incomingMsg = {
              id: Date.now().toString(), // or data.message.id if available
              content: data.message,
              sender_id: data.sender_id,
              created_at: new Date().toISOString(),
              message_type: data.message_type || 'text',
              file_url: data.file_url || null,
              file_name: data.file_name || null,
            };
            setMessages(prev => [...prev, incomingMsg]);
          }

          // Handle real-time online/offline status updates
          if (data.type === 'user.status' && matchProfile?.id && data.user_id === String(matchProfile.id)) {
            setIsOnline(data.is_online);
            if (!data.is_online && data.last_seen) {
              setLastSeen(data.last_seen);
            }
          }
        });

        // If WS closes cleanly or fails, fallback to polling
        ws.onclose = () => {
          console.log('WebSocket closed, falling back to polling');
          if (!fallbackInterval) startPolling();
        };

        ws.onerror = () => {
          console.error('WebSocket error, falling back to polling');
          if (!fallbackInterval) startPolling();
        }
      } catch (e) {
        console.error('WS Connection failed immediately', e);
        startPolling();
      }
    } else {
      startPolling();
    }

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) ws.close();
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, [id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    const content = newMessage;
    setNewMessage('');

    // Optimistic update
    const tempMsg = {
      id: Date.now().toString(),
      content,
      sender_id: currentUserId, // Use actual current user ID
      created_at: new Date().toISOString(),
      message_type: 'text',
      isOptimistic: true
    };

    setMessages(prev => [...prev, tempMsg]);

    try {
      await api.chat.sendMessage(id!, content);
      // Could replace optimistic message with real one here if needed
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove optimistic message on failure
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
    }
  };

  const handleUnmatch = async () => {
    if (!confirm('Are you sure you want to un-match with this person? This action cannot be undone.')) return;

    try {
      await api.matches.unmatch(id!);
      toast.success('Un-matched successfully');
      navigate('/chat');
    } catch (error: any) {
      toast.error(error.message || 'Failed to un-match');
    }
  };

  const addEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

    if (!allowedTypes.includes(file.type)) {
      alert('File type not supported. Allowed: Images (JPG, PNG, GIF, WebP), PDF, DOC, DOCX');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File too large. Maximum size is 10MB.');
      return;
    }

    // Create preview for images
    let previewUrl: string | null = null;
    if (file.type.startsWith('image/')) {
      previewUrl = URL.createObjectURL(file);
    }

    setUploadPreview({ file, previewUrl });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const cancelUpload = () => {
    if (uploadPreview?.previewUrl) {
      URL.revokeObjectURL(uploadPreview.previewUrl);
    }
    setUploadPreview(null);
  };

  const handleUploadFile = async () => {
    if (!uploadPreview) return;

    const file = uploadPreview.file;
    const isImage = file.type.startsWith('image/');

    setIsUploading(true);

    // Optimistic update
    const tempMsg: any = {
      id: 'uploading-' + Date.now().toString(),
      content: isImage ? '📷 Image' : `📎 ${file.name}`,
      sender_id: currentUserId,
      created_at: new Date().toISOString(),
      message_type: isImage ? 'image' : 'document',
      file_name: file.name,
      file_url: uploadPreview.previewUrl || undefined,
      isOptimistic: true,
      isUploading: true,
    };

    setMessages(prev => [...prev, tempMsg]);
    cancelUpload();

    try {
      const result = await api.chat.uploadFile(id!, file);
      // Replace optimistic message with real one
      setMessages(prev => prev.map(m =>
        m.id === tempMsg.id ? { ...result, isOptimistic: false, isUploading: false } : m
      ));
    } catch (error) {
      console.error('Failed to upload file:', error);
      // Remove optimistic message on failure
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
      alert('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return '📄';
    if (ext === 'doc' || ext === 'docx') return '📝';
    return '📎';
  };

  const handleDownloadFile = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderMessageContent = (msg: any) => {
    const isSender = msg.sender_id === currentUserId;

    // Image message
    if (msg.message_type === 'image' && msg.file_url) {
      return (
        <div className="space-y-1">
          {msg.isUploading && (
            <div className="flex items-center gap-2 mb-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span className="text-xs opacity-70">Uploading...</span>
            </div>
          )}
          <img
            src={msg.file_url}
            alt={msg.file_name || 'Image'}
            className="rounded-lg max-w-[240px] max-h-[300px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(msg.file_url, '_blank')}
          />
          {msg.file_name && (
            <p className="text-[10px] opacity-60">{msg.file_name}</p>
          )}
        </div>
      );
    }

    // Document message (PDF, DOC, DOCX)
    if (msg.message_type === 'document' && msg.file_url) {
      return (
        <div className="space-y-2">
          {msg.isUploading && (
            <div className="flex items-center gap-2 mb-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span className="text-xs opacity-70">Uploading...</span>
            </div>
          )}
          <div
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all hover:scale-[1.02]",
              isSender
                ? "bg-white/15 hover:bg-white/20"
                : "bg-white/5 hover:bg-white/10 border border-white/10"
            )}
            onClick={() => handleDownloadFile(msg.file_url, msg.file_name)}
          >
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0",
              isSender ? "bg-white/20" : "bg-primary/20"
            )}>
              {getFileIcon(msg.file_name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{msg.file_name || 'Document'}</p>
              <p className="text-[10px] opacity-60">
                {msg.file_name?.split('.').pop()?.toUpperCase()} Document
              </p>
            </div>
            <Download className={cn("w-4 h-4 flex-shrink-0", isSender ? "text-white/70" : "text-primary/70")} />
          </div>
        </div>
      );
    }

    // Default text message
    return <p className="text-sm">{msg.content}</p>;
  };

  if (!matchProfile && isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="glass-card border-b border-white/10 p-4 flex items-center gap-4 relative z-10">
        <Link to="/chat">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <img
          src={getProfilePhoto(matchProfile?.photos, matchProfile?.gender)}
          alt={matchProfile?.name || 'User'}
          className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/30"
        />
        <div className="flex-1">
          <h2 className="font-semibold text-foreground">{matchProfile?.name || 'Loading...'}</h2>
          {isOnline ? (
            <p className="text-xs text-green-500">Online</p>
          ) : lastSeen ? (
            <p className="text-xs text-muted-foreground">{formatLastSeen(lastSeen)}</p>
          ) : (
            <p className="text-xs text-muted-foreground">Offline</p>
          )}
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 glass-card border-white/10">
              <DropdownMenuItem onClick={handleUnmatch} className="text-destructive focus:text-destructive cursor-pointer">
                Un-match
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                Report User
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                Block User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative z-10" ref={scrollRef}>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex",
              msg.sender_id === currentUserId ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[75%] rounded-2xl px-4 py-3",
                msg.sender_id === currentUserId
                  ? "bg-gradient-primary text-white rounded-br-sm"
                  : "glass-card rounded-bl-sm"
              )}
            >
              {renderMessageContent(msg)}
              <p className={cn(
                "text-[10px] mt-1",
                msg.sender_id === currentUserId ? "text-white/70" : "text-muted-foreground"
              )}>
                {formatMessageTime(msg.created_at)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Preview */}
      {uploadPreview && (
        <div className="glass-card border-t border-white/10 px-4 pt-3 relative z-10">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
            {uploadPreview.previewUrl ? (
              <img
                src={uploadPreview.previewUrl}
                alt="Preview"
                className="w-16 h-16 rounded-lg object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-primary/20 flex items-center justify-center">
                <FileText className="w-8 h-8 text-primary" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{uploadPreview.file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(uploadPreview.file.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-destructive/20"
                onClick={cancelUpload}
              >
                <X className="w-4 h-4" />
              </Button>
              <Button
                variant="gradient"
                size="icon"
                className="rounded-full"
                onClick={handleUploadFile}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Input */}
      <div className="glass-card border-t border-white/10 p-4 relative z-10">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full flex-shrink-0"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            title="Attach file (Image, PDF, DOC)"
          >
            <Paperclip className="w-5 h-5" />
          </Button>
          <div className="flex-1 relative">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="pr-12 glass-card border-white/10 rounded-full h-12 text-sm sm:text-base"
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full"
                >
                  <Smile className="w-5 h-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent side="top" align="end" className="w-64 p-2 glass-card border-white/10">
                <div className="grid grid-cols-5 gap-1">
                  {COMMON_EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => addEmoji(emoji)}
                      className="text-2xl p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <Button
            variant="gradient"
            size="icon"
            className="rounded-full flex-shrink-0"
            onClick={handleSend}
            disabled={!newMessage.trim()}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
