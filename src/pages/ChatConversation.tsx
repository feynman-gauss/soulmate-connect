import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { mockProfiles } from '@/data/mockProfiles';
import { ArrowLeft, Phone, Video, MoreVertical, Send, Image, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  senderId: string;
  timestamp: string;
}

const mockMessages: Message[] = [
  { id: '1', content: 'Hey! Nice to match with you 😊', senderId: 'them', timestamp: '10:30 AM' },
  { id: '2', content: 'Hi! Thanks, I loved your profile!', senderId: 'me', timestamp: '10:31 AM' },
  { id: '3', content: 'That\'s so sweet! What do you do for work?', senderId: 'them', timestamp: '10:32 AM' },
  { id: '4', content: 'I\'m a software engineer. How about you?', senderId: 'me', timestamp: '10:33 AM' },
  { id: '5', content: 'I work in marketing! Love the creative side of things', senderId: 'them', timestamp: '10:35 AM' },
];

export default function ChatConversation() {
  const { id } = useParams();
  const profile = mockProfiles.find(p => p.id === id) || mockProfiles[0];
  const [messages, setMessages] = useState(mockMessages);
  const [newMessage, setNewMessage] = useState('');

  const handleSend = () => {
    if (!newMessage.trim()) return;
    
    setMessages([
      ...messages,
      {
        id: Date.now().toString(),
        content: newMessage,
        senderId: 'me',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setNewMessage('');
  };

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
          src={profile.photos[0]}
          alt={profile.name}
          className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/30"
        />
        <div className="flex-1">
          <h2 className="font-semibold text-foreground">{profile.name}</h2>
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative z-10">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex",
              msg.senderId === 'me' ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[75%] rounded-2xl px-4 py-3",
                msg.senderId === 'me'
                  ? "bg-gradient-primary text-white rounded-br-sm"
                  : "glass-card rounded-bl-sm"
              )}
            >
              <p className="text-sm">{msg.content}</p>
              <p className={cn(
                "text-[10px] mt-1",
                msg.senderId === 'me' ? "text-white/70" : "text-muted-foreground"
              )}>
                {msg.timestamp}
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
