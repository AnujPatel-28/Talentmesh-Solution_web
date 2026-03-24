import { insforge } from '@/lib/insforge';

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  job_id: string | null;
  created_at: string;
}

export interface Conversation {
  partner_id: string;
  partner_name: string;
  partner_avatar: string | null;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  last_message_sender_id: string;
}

export const getConversations = async (userId: string): Promise<Conversation[]> => {
  // We'll fetch the latest messages and manually group them for simplicity and performance on typical data sizes
  const { data, error } = await insforge.database
    .from('messages')
    .select(`
      *,
      sender:sender_id(id, name, avatar_url),
      receiver:receiver_id(id, name, avatar_url)
    `)
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  const conversationMap = new Map<string, Conversation>();

  data.forEach((msg: any) => {
    const partner = msg.sender_id === userId ? msg.receiver : msg.sender;
    if (!partner) return;

    if (!conversationMap.has(partner.id)) {
      conversationMap.set(partner.id, {
        partner_id: partner.id,
        partner_name: partner.name || 'Unknown',
        partner_avatar: partner.avatar_url || null,
        last_message: msg.content,
        last_message_time: msg.created_at,
        unread_count: 0,
        last_message_sender_id: msg.sender_id
      });
    }

    if (!msg.is_read && msg.receiver_id === userId) {
      const convo = conversationMap.get(partner.id)!;
      convo.unread_count++;
    }
  });

  return Array.from(conversationMap.values());
};

export const getMessages = async (currentUserId: string, otherUserId: string): Promise<Message[]> => {
  const { data, error } = await insforge.database
    .from('messages')
    .select('*')
    .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const sendMessage = async (senderId: string, receiverId: string, content: string, jobId?: string) => {
  const { data, error } = await insforge.database
    .from('messages')
    .insert({
      sender_id: senderId,
      receiver_id: receiverId,
      content,
      job_id: jobId || null,
      is_read: false
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const markAsRead = async (receiverId: string, senderId: string) => {
  const { error } = await insforge.database
    .from('messages')
    .update({ is_read: true })
    .eq('receiver_id', receiverId)
    .eq('sender_id', senderId)
    .eq('is_read', false);

  if (error) throw error;
};

export const getUnreadCount = async (userId: string): Promise<number> => {
  const { count, error } = await insforge.database
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('receiver_id', userId)
    .eq('is_read', false);

  if (error) return 0;
  return count || 0;
};
