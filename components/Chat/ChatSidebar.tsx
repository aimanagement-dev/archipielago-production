'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { MessageCircle, X, Send, Paperclip } from 'lucide-react';
import { ChatService } from '@/lib/services/chat.service';
import type { ChatRoom, Message } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ChatSidebar() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat rooms
  useEffect(() => {
    if (isOpen && session?.user?.email) {
      loadRooms();
    }
  }, [isOpen, session]);

  // Load messages when room is selected
  useEffect(() => {
    if (selectedRoom) {
      loadMessages(selectedRoom.id);
      subscribeToMessages(selectedRoom.id);
    }
  }, [selectedRoom]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadRooms = async () => {
    try {
      const response = await fetch('/api/chat/rooms');
      const data = await response.json();
      setRooms(data.rooms || []);

      // Auto-select first room
      if (data.rooms && data.rooms.length > 0 && !selectedRoom) {
        setSelectedRoom(data.rooms[0]);
      }
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
  };

  const loadMessages = async (roomId: string) => {
    try {
      const response = await fetch(`/api/chat/messages?chatRoomId=${roomId}`);
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const subscribeToMessages = (roomId: string) => {
    const channel = ChatService.subscribeToMessages(roomId, (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
    });

    return () => {
      channel.unsubscribe();
    };
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom || !session?.user) return;

    setLoading(true);
    try {
      await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatRoomId: selectedRoom.id,
          content: newMessage.trim(),
        }),
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!session?.user) return null;

  return (
    <>
      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all z-50"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat Sidebar */}
      {isOpen && (
        <div className="fixed right-0 top-0 h-full w-96 bg-white/10 backdrop-blur-xl border-l border-white/20 shadow-2xl flex flex-col z-50">
          {/* Header */}
          <div className="p-4 border-b border-white/20 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Chat</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/60 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Room Tabs */}
          <div className="flex overflow-x-auto border-b border-white/20 bg-white/5">
            {rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => setSelectedRoom(room)}
                className={`px-4 py-2 text-sm whitespace-nowrap transition-colors ${
                  selectedRoom?.id === room.id
                    ? 'bg-white/10 text-white border-b-2 border-blue-500'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {room.name}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message) => {
              const isOwnMessage = message.sender_email === session.user?.email;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      isOwnMessage
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/10 text-white'
                    }`}
                  >
                    {!isOwnMessage && (
                      <div className="text-xs font-semibold mb-1 opacity-70">
                        {message.sender_name}
                      </div>
                    )}
                    <div className="text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </div>
                    <div className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-100' : 'text-white/50'}`}>
                      {formatDistanceToNow(new Date(message.created_at), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-white/20 bg-white/5">
            <div className="flex items-end gap-2">
              <div className="flex-1 bg-white/10 rounded-lg border border-white/20 focus-within:border-blue-500 transition-colors">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Escribe un mensaje..."
                  className="w-full bg-transparent text-white placeholder-white/40 p-3 resize-none outline-none"
                  rows={2}
                  disabled={loading}
                />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || loading}
                className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-lg transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
