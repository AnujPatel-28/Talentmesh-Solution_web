"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import styles from './messages.module.css';
import { useAuth } from '@/lib/auth/AuthContext';
import { useMessages } from '@/lib/hooks/useMessages';
import { getConversations, type Conversation } from '@/lib/api/messages';
import { formatDistanceToNow } from 'date-fns';

export default function MessagesPage() {
    const { user } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConvoId, setSelectedConvoId] = useState<string | null>(null);
    const [loadingConvos, setLoadingConvos] = useState(true);
    const [messageText, setMessageText] = useState('');
    const [isSending, setIsSending] = useState(false);

    const { messages, loading: loadingMessages, sendMessage } = useMessages(selectedConvoId);
    const scrollRef = useRef<HTMLDivElement>(null);

    const loadConversations = async () => {
        if (!user) return;
        try {
            const data = await getConversations(user.id);
            setConversations(data);
        } catch (err) {
            console.error('Error loading conversations:', err);
        } finally {
            setLoadingConvos(false);
        }
    };

    useEffect(() => {
        if (user) {
            loadConversations();
        }
    }, [user]);

    // Auto scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!messageText.trim() || isSending || !selectedConvoId) return;

        setIsSending(true);
        try {
            await sendMessage(messageText);
            setMessageText('');
            // Refresh conversation list to show new last message
            loadConversations();
        } catch (err) {
            console.error('Failed to send message:', err);
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const selectedConvo = useMemo(() =>
        conversations.find(c => c.partner_id === selectedConvoId),
        [conversations, selectedConvoId]);

    if (!user) return <div className={styles.emptyState}>Please log in to view messages.</div>;

    return (
        <div className={styles.container}>
            {/* Sidebar */}
            <div className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <h2>Messages</h2>
                </div>
                <div className={styles.convoList}>
                    {loadingConvos ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading...</div>
                    ) : conversations.length === 0 ? (
                        <div className={styles.emptyState}>
                            <p>No conversations yet.</p>
                        </div>
                    ) : (
                        conversations.map(convo => (
                            <div
                                key={convo.partner_id}
                                className={`${styles.convoItem} ${selectedConvoId === convo.partner_id ? styles.convoItemActive : ''}`}
                                onClick={() => setSelectedConvoId(convo.partner_id)}
                            >
                                <div className={styles.avatar}>
                                    {convo.partner_avatar ? (
                                        <img src={convo.partner_avatar} alt={convo.partner_name} />
                                    ) : (
                                        convo.partner_name[0].toUpperCase()
                                    )}
                                </div>
                                <div className={styles.convoInfo}>
                                    <div className={styles.convoTop}>
                                        <span className={styles.convoName}>{convo.partner_name}</span>
                                        <span className={styles.convoTime}>
                                            {formatDistanceToNow(new Date(convo.last_message_time), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span className={styles.convoPreview}>{convo.last_message}</span>
                                        {convo.unread_count > 0 && (
                                            <span className={styles.unreadBadge}>{convo.unread_count}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className={styles.chatArea}>
                {selectedConvoId ? (
                    <>
                        <div className={styles.chatHeader}>
                            <div className={styles.avatar}>
                                {selectedConvo?.partner_avatar ? (
                                    <img src={selectedConvo.partner_avatar} alt={selectedConvo.partner_name} />
                                ) : (
                                    selectedConvo?.partner_name?.[0]?.toUpperCase() || '?'
                                )}
                            </div>
                            <span className={styles.chatPartnerName}>{selectedConvo?.partner_name}</span>
                        </div>

                        <div className={styles.messagesList} ref={scrollRef}>
                            {loadingMessages ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Loading messages...</div>
                            ) : messages.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <p>Start a conversation with {selectedConvo?.partner_name}</p>
                                </div>
                            ) : (
                                messages.map(msg => {
                                    const isOwn = msg.sender_id === user.id;
                                    return (
                                        <div key={msg.id} className={`${styles.messageRow} ${isOwn ? styles.messageRowOwn : ''}`}>
                                            <div className={`${styles.bubble} ${isOwn ? styles.bubbleOwn : styles.bubbleTheirs}`}>
                                                {msg.content}
                                                <span className={`${styles.messageTime} ${isOwn ? styles.messageTimeOwn : ''}`}>
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <div className={styles.inputArea}>
                            <form onSubmit={handleSend} className={styles.inputWrapper}>
                                <textarea
                                    className={styles.textarea}
                                    placeholder="Type a message..."
                                    value={messageText}
                                    onChange={(e) => setMessageText(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    rows={1}
                                    disabled={isSending}
                                />
                                <button type="submit" className={styles.sendBtn} disabled={!messageText.trim() || isSending}>
                                    {isSending ? '...' : (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                                    )}
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>💬</div>
                        <h3>Your Messages</h3>
                        <p>Select a conversation to start chatting.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
