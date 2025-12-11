import { supabase } from '../supabase';
import type { ChatRoom, Message } from '../types';

export class ChatService {
  // Fetch all active chat rooms
  static async getChatRooms(): Promise<ChatRoom[]> {
    const { data, error } = await supabase
      .from('chat_rooms')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data as ChatRoom[]) || [];
  }

  // Create a new chat room
  static async createChatRoom(
    name: string,
    type: 'team' | 'project' | 'area',
    createdBy: string,
    description?: string,
    area?: string
  ): Promise<ChatRoom> {
    const { data, error } = await supabase
      .from('chat_rooms')
      .insert({
        name,
        type,
        created_by: createdBy,
        description,
        area,
      })
      .select()
      .single();

    if (error) throw error;
    return data as ChatRoom;
  }

  // Fetch messages for a specific room
  static async getMessages(chatRoomId: string, limit = 50): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_room_id', chatRoomId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return ((data as Message[]) || []).reverse(); // Reverse to show oldest first
  }

  // Send a new message
  static async sendMessage(
    chatRoomId: string,
    senderEmail: string,
    senderName: string,
    content: string,
    mentions?: string[],
    attachments?: any[]
  ): Promise<Message> {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        chat_room_id: chatRoomId,
        sender_email: senderEmail,
        sender_name: senderName,
        content,
        mentions,
        attachments: attachments || [],
      })
      .select()
      .single();

    if (error) throw error;
    return data as Message;
  }

  // Edit a message
  static async editMessage(messageId: string, newContent: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .update({
        content: newContent,
        is_edited: true,
      })
      .eq('id', messageId);

    if (error) throw error;
  }

  // Delete a message (soft delete)
  static async deleteMessage(messageId: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .update({
        deleted_at: new Date().toISOString(),
      })
      .eq('id', messageId);

    if (error) throw error;
  }

  // Subscribe to new messages in a room
  static subscribeToMessages(
    chatRoomId: string,
    onNewMessage: (message: Message) => void
  ) {
    return supabase
      .channel(`messages:${chatRoomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_room_id=eq.${chatRoomId}`,
        },
        (payload) => {
          onNewMessage(payload.new as Message);
        }
      )
      .subscribe();
  }

  // Subscribe to message updates (edits, deletes)
  static subscribeToMessageUpdates(
    chatRoomId: string,
    onUpdate: (message: Message) => void
  ) {
    return supabase
      .channel(`messages-updates:${chatRoomId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `chat_room_id=eq.${chatRoomId}`,
        },
        (payload) => {
          onUpdate(payload.new as Message);
        }
      )
      .subscribe();
  }
}
