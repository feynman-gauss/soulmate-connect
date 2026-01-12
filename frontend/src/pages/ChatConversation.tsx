import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { mockProfiles } from '@/data/mockProfiles';
import { ArrowLeft, Phone, Video, MoreVertical, Send, Image, Smile, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { api, createChatWebSocket } from '@/services/api';
import { useEffect, useRef } from 'react';

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

    // 3. Setup WebSocket
    let ws: WebSocket;
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
    } catch (e) {
      console.error('WS Connection failed', e);
    }

    return () => {
      if (ws) ws.close();
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
          src={matchProfile?.photos?.[0] || 'https://via.placeholder.com/150'}
          alt={matchProfile?.name || 'User'}
          className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/30"
        />
        <div className="flex-1">
          <h2 className="font-semibold text-foreground">{matchProfile?.name || 'Loading...'}</h2>
          <p className="text-xs text-green-500">Online</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="rounded-full">
            <Phone className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Video className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full">
            <MoreVertical className="w-5 h-5" />
          </Button>
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
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="glass-card border-t border-white/10 p-4 relative z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-full flex-shrink-0">
            <Image className="w-5 h-5" />
          </Button>
          <div className="flex-1 relative">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="pr-12 glass-card border-white/10 rounded-full h-12"
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full"
            >
              <Smile className="w-5 h-5" />
            </Button>
          </div>
          <Button
            variant="gradient"
            size="icon"
            className="rounded-full flex-shrink-0"
            onClick={handleSend}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
