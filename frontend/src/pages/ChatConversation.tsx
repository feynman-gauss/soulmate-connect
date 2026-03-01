import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Phone, Video, MoreVertical, Send, Image, Smile, Loader2 } from 'lucide-react';
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
  senderId: string;
  timestamp: string;
}

export default function ChatConversation() {
  const { id } = useParams(); // id is the matchId
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [matchProfile, setMatchProfile] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

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

        // 2. Fetch initial messages
        const msgs = await api.chat.getMessages(id!);
        // Backend returns [Newest, ..., Oldest] if we don't reverse in backend.
        // Wait, backend api code says: .sort("created_at", -1) -> Newest first.
        // THEN messages.reverse() -> Oldest first.
        // So the API returns [Oldest, ..., Newest].
        // So we SHOULD NOT reverse it here if we want [Oldest, ..., Newest]
        setMessages(msgs);

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
              created_at: new Date().toISOString()
            };
            setMessages(prev => [...prev, incomingMsg]);
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      // In a real app, we'd upload the file and get a URL
      // For now, we'll simulate it using the profile photo upload service if it returns a URL
      // Or just toast for now if chat specifically needs a different endpoint
      const result = await api.profiles.uploadPhoto(file);
      if (result.photo_url) {
        await api.chat.sendMessage(id!, result.photo_url, 'image');
        toast.success('Image sent!');
      } else {
        toast.error('Failed to upload image');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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
          <p className="text-xs text-green-500">Online</p>
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
              <p className="text-sm">{msg.content}</p>
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

      {/* Input */}
      <div className="glass-card border-t border-white/10 p-4 relative z-10">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleImageUpload}
        />
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full flex-shrink-0"
            onClick={() => fileInputRef.current?.click()}
          >
            <Image className="w-5 h-5" />
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
