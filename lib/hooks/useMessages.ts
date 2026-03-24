"use client";

import { useState, useEffect, useCallback } from 'react';
import { insforge } from '@/lib/insforge';
import { useAuth } from '@/lib/auth/AuthContext';
import { 
  getMessages, 
  sendMessage as sendMsgApi, 
  markAsRead as markReadApi, 
  type Message 
} from '@/lib/api/messages';

export function useMessages(receiverId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!user || !receiverId) {
      setMessages([]);
      return;
    }

    setLoading(true);
    try {
      const data = await getMessages(user.id, receiverId);
      setMessages(data);
      // Auto mark as read
      await markReadApi(user.id, receiverId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, receiverId]);

  useEffect(() => {
    if (!user || !receiverId) return;

    fetchMessages();

    const handleNewMessage = (payload: any) => {
      const newMsg = payload as Message;
      // Only add if it belongs to this conversation
      if (
        (newMsg.sender_id === receiverId && newMsg.receiver_id === user.id) ||
        (newMsg.sender_id === user.id && newMsg.receiver_id === receiverId)
      ) {
        setMessages(prev => {
          if (prev.find(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        
        if (newMsg.receiver_id === user.id) {
          markReadApi(user.id, receiverId).catch(console.error);
        }
      }
    };

    const setupRealtime = async () => {
      try {
        await insforge.realtime.connect();
        await insforge.realtime.subscribe('messages:' + user.id);
        insforge.realtime.on('INSERT_messages', handleNewMessage);
      } catch (err) {
        console.error('Realtime setup error:', err);
      }
    };

    setupRealtime();

    return () => {
        insforge.realtime.off('INSERT_messages', handleNewMessage);
        insforge.realtime.unsubscribe('messages:' + user.id);
    };
  }, [user, receiverId, fetchMessages]);

  const sendMessage = async (content: string, jobId?: string) => {
    if (!user || !receiverId) return;

    try {
      const newMsg = await sendMsgApi(user.id, receiverId, content, jobId);
      setMessages(prev => {
        if (prev.find(m => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
      return newMsg;
    } catch (err: any) {
      console.error('Send error:', err);
      throw err;
    }
  };

  return {
    messages,
    loading,
    error,
    sendMessage,
    markAsRead: () => user && receiverId && markReadApi(user.id, receiverId),
    refresh: fetchMessages
  };
}
