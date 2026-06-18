import React, { useEffect, useState, useContext, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { io } from 'socket.io-client';

const ChatRoom = () => {
  const { requestId } = useParams();
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [chatRequest, setChatRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchChat = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`http://localhost:4444/api/chats/${requestId}/messages`);
        setMessages(res.data);
        setChatRequest(res.data.length ? res.data[0] : null);
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
    socketRef.current = io('http://localhost:4444');
    socketRef.current.emit('join', requestId);
    socketRef.current.on('new_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave', requestId);
        socketRef.current.disconnect();
      }
    };
  }, [requestId]);

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
      await axios.post(`http://localhost:4444/api/chats/${requestId}/messages`, body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setText('');
      setFile(null);
      const res = await axios.get(`http://localhost:4444/api/chats/${requestId}/messages`);
      setMessages(res.data);
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setSending(false);
    }
  };

  const respondToRequest = async (action) => {
    try {
      await axios.post(`http://localhost:4444/api/chats/request/${requestId}/respond`, { action });
      alert(`Chat request ${action}`);
    } catch (err) {
      console.error('Failed to respond to request', err);
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
      <div style={{ border: '1px solid #ddd', borderRadius: '14px', padding: '20px', minHeight: '300px' }}>
        {messages.length === 0 ? (
          <p>No messages yet.</p>
        ) : (
          messages.map((message) => (
            <div key={message._id} style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: message.senderId === user.id ? 'flex-end' : 'flex-start' }}>
                <div style={{ maxWidth: '70%', background: message.senderId === user.id ? '#d2f8d2' : '#f4f4f4', padding: '12px 16px', borderRadius: '14px' }}>
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
                        <img src={`http://localhost:4444${message.attachmentUrl}`} alt="attachment" style={{ width: '100%', marginTop: '10px', borderRadius: '12px' }} />
                      ) : (
                        <video controls src={`http://localhost:4444${message.attachmentUrl}`} style={{ width: '100%', marginTop: '10px', borderRadius: '12px' }} />
                      )
                    )
                  )}
                  <small style={{ display: 'block', marginTop: '8px', color: '#555' }}>{new Date(message.createdAt).toLocaleString()}</small>
                </div>
              </div>
            </div>
          ))
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
