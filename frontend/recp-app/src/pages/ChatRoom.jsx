import React, { useEffect, useState, useContext, useRef } from 'react';
import { useParams } from 'react-router-dom';
import client, { API_URL } from '../api/client';
import { AuthContext } from '../context/AuthContext';
import { io } from 'socket.io-client';
import { FaPaperclip, FaTimes, FaPaperPlane } from 'react-icons/fa';

const ChatRoom = () => {
  const { requestId } = useParams();
  const { user, token } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const socketRef = useRef();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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

  // Auto-scroll when messages change or loading completes
  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Socket.IO real-time updates
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

  const handleTextChange = (e) => {
    setText(e.target.value);
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      const maxHeight = 110; // ~4 lines
      el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
      el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const sendMessage = async () => {
    if (!user) {
      alert('Please log in to send messages.');
      return;
    }
    if (!text.trim() && !file) {
      return;
    }
    if (sending) return;
    setSending(true);

    try {
      const body = new FormData();
      if (text.trim()) body.append('text', text.trim());
      if (file) body.append('attachment', file);
      const res = await client.post(`/api/chats/${requestId}/messages`, body);
      setText('');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
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
    return <h2 style={{ textAlign: 'center', marginTop: '80px', color: 'var(--text)' }}>Please log in to access chat.</h2>;
  }

  if (loading) {
    return <h2 style={{ textAlign: 'center', marginTop: '80px', color: 'var(--text)' }}>Loading chat...</h2>;
  }

  return (
    <div className="chat-page-container">
      <h1 className="chat-room-title">Chat Room</h1>
      <div className="chat-messages-container">
        {messages.length === 0 ? (
          <p className="no-messages-hint">No messages yet. Say hello!</p>
        ) : (
          messages.map((message) => {
            const sender = message.senderId?._id || message.senderId;
            const currentUserId = user.id || user._id;
            const isOwn = sender?.toString() === currentUserId?.toString();
            return (
              <div
                key={message._id}
                className={`chat-message-row ${isOwn ? 'sent' : 'received'}`}
              >
                <div className={`chat-bubble ${isOwn ? 'bubble-sent' : 'bubble-received'}`}>
                  {message.text && <p className="bubble-text">{message.text}</p>}
                  {message.attachmentUrl && (
                    (message.attachmentUrl.startsWith('http') || message.attachmentUrl.startsWith('data:')) ? (
                      message.attachmentType?.startsWith('image/') ? (
                        <img src={message.attachmentUrl} alt="attachment" className="bubble-attachment-media" />
                      ) : (
                        <video controls src={message.attachmentUrl} className="bubble-attachment-media" />
                      )
                    ) : (
                      message.attachmentType?.startsWith('image/') ? (
                        <img src={`${API_URL}${message.attachmentUrl}`} alt="attachment" className="bubble-attachment-media" />
                      ) : (
                        <video controls src={`${API_URL}${message.attachmentUrl}`} className="bubble-attachment-media" />
                      )
                    )
                  )}
                  <small className="bubble-timestamp">
                    {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </small>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {file && (
        <div className="chat-file-preview-pill">
          <span>📎 {file.name}</span>
          <button type="button" onClick={removeFile} aria-label="Remove attachment" className="chat-remove-file-btn">
            <FaTimes />
          </button>
        </div>
      )}

      <div className="chat-composer-wrapper">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*,video/*"
          style={{ display: 'none' }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="chat-attach-btn"
          aria-label="Attach photo or video"
          title="Attach photo or video"
        >
          <FaPaperclip />
        </button>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Type a message (Enter to send, Shift+Enter for new line)..."
          className="chat-composer-textarea"
        />

        <button
          type="button"
          onClick={sendMessage}
          disabled={sending || (!text.trim() && !file)}
          className="chat-send-btn"
          aria-label="Send message"
        >
          {sending ? '...' : <FaPaperPlane />}
        </button>
      </div>
    </div>
  );
};

export default ChatRoom;
