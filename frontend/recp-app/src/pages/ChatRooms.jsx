import React, { useEffect, useState, useContext } from 'react';
import client from '../api/client';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ChatRooms = () => {
  const { user } = useContext(AuthContext);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRooms = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await client.get('/api/chats/rooms');
        setRooms(res.data);
      } catch (err) {
        console.error('Failed to load chat rooms', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, [user]);

  if (!user) return <h2 style={{ textAlign: 'center', marginTop: '80px' }}>Please log in to view chat rooms.</h2>;
  if (loading) return <h2 style={{ textAlign: 'center', marginTop: '80px' }}>Loading chat rooms...</h2>;

  return (
    <div style={{ padding: '40px 20px', maxWidth: '900px', margin: '0 auto' }}>
      <h1>Your Chats</h1>
      {rooms.length === 0 ? (
        <p>No active chats yet. Accept chat requests to start chatting.</p>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {rooms.map(r => (
            <Link key={r.chatRequestId} to={`/chat/${r.chatRequestId}`} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '10px', border: '1px solid var(--border)', background: 'var(--surface)', borderRadius: '10px', textDecoration: 'none', color: 'inherit' }}>
              <img src={r.otherUser?.avatar || '/placeholder.svg'} alt={r.otherUser?.name || 'User'} style={{ width: '64px', height: '64px', borderRadius: '12px' }} />
              <div>
                <h3 style={{ margin: 0 }}>{r.otherUser?.name || 'Unknown'}</h3>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatRooms;
