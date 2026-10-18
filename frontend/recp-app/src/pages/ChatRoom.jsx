import React, { useEffect, useState, useContext, useRef } from 'react';
import { useParams } from 'react-router-dom';
import client, { API_URL } from '../api/client';
import { AuthContext } from '../context/AuthContext';
import { io } from 'socket.io-client';

const ChatRoom = () => {
  const { requestId } = useParams();
  const { user, token } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchChat = async () => {
      try {
        setLoading(true);
        const res = await client.get(`/api/chats/${requestId}/messages`);
        setMessages(res.data);
      } catch (err) {
        console.error('Failed to load chat messages', err);
      } finally {
        setLoading(false);
      }
    };

    fetchChat();
  }, [requestId]);

  // Socket.IO real-time updates
  const socketRef = useRef();
  useEffect(() => {
    socketRef.current = io(API_URL, { auth: { token } });
    socketRef.current.emit('join', requestId);
    socketRef.current.on('new_message', (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    });
    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave', requestId);
        socketRef.current.disconnect();
      }
    };
  }, [requestId, token]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const sendMessage = async () => {
    if (!user) {
      alert('Please log in to send messages.');
      return;
    }
    if (!text.trim() && !file) {
      return;
    }
    setSending(true);

    try {
      const body = new FormData();
      if (text.trim()) body.append('text', text.trim());
      if (file) body.append('attachment', file);
      const res = await client.post(`/api/chats/${requestId}/messages`, body);
      setText('');
      setFile(null);
      if (res.data) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === res.data._id)) return prev;
          return [...prev, res.data];
        });
      }
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setSending(false);
    }
  };

  if (!user) {
    return <h2 style={{ textAlign: 'center', marginTop: '80px' }}>Please log in to access chat.</h2>;
  }

  if (loading) {
    return <h2 style={{ textAlign: 'center', marginTop: '80px' }}>Loading chat...</h2>;
  }

  return (
    <div style={{ padding: '40px 20px', maxWidth: '900px', margin: '0 auto' }}>
      <h1>Chat Room</h1>
      <div style={{ border: '1px solid var(--border)', background: 'var(--surface)', borderRadius: '14px', padding: '20px', minHeight: '300px' }}>
        {messages.length === 0 ? (
          <p>No messages yet.</p>
        ) : (
          messages.map((message) => {
            const sender = message.senderId?._id || message.senderId;
            const currentUserId = user.id || user._id;
            const isOwn = sender?.toString() === currentUserId?.toString();
            return (
            <div key={message._id} style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start' }}>
                <div style={{ maxWidth: '70%', background: isOwn ? 'var(--primary)' : 'var(--surface-2)', color: isOwn ? 'var(--white)' : 'var(--text)', padding: '12px 16px', borderRadius: '14px' }}>
                  {message.text && <p style={{ margin: 0 }}>{message.text}</p>}
                  {message.attachmentUrl && (
                    (message.attachmentUrl.startsWith('http') || message.attachmentUrl.startsWith('data:')) ? (
                      message.attachmentType?.startsWith('image/') ? (
                        <img src={message.attachmentUrl} alt="attachment" style={{ width: '100%', marginTop: '10px', borderRadius: '12px' }} />
                      ) : (
                        <video controls src={message.attachmentUrl} style={{ width: '100%', marginTop: '10px', borderRadius: '12px' }} />
                      )
                    ) : (
                      message.attachmentType?.startsWith('image/') ? (
                        <img src={`${API_URL}${message.attachmentUrl}`} alt="attachment" style={{ width: '100%', marginTop: '10px', borderRadius: '12px' }} />
                      ) : (
                        <video controls src={`${API_URL}${message.attachmentUrl}`} style={{ width: '100%', marginTop: '10px', borderRadius: '12px' }} />
                      )
                    )
                  )}
                  <small style={{ display: 'block', marginTop: '8px', color: isOwn ? 'var(--white)' : 'var(--text-muted)', opacity: 0.8 }}>{new Date(message.createdAt).toLocaleString()}</small>
                </div>
              </div>
            </div>
          );
        })
        )}
      </div>

      <div style={{ marginTop: '24px', display: 'grid', gap: '16px' }}>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} placeholder="Write your message..." />
        <input type="file" onChange={handleFileChange} accept="image/*,video/*" />
        <button onClick={sendMessage} disabled={sending}>{sending ? 'Sending...' : 'Send Message'}</button>
      </div>
    </div>
  );
};

export default ChatRoom;
