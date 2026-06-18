import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const ChatRequests = () => {
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const fetchRequests = async () => {
      try {
        setLoading(true);
        const res = await axios.get('http://localhost:4444/api/chats/requests');
        setRequests(res.data);
      } catch (err) {
        console.error('Failed to load chat requests', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, [user]);

  if (!user) {
    return <h2 style={{ textAlign: 'center', marginTop: '80px' }}>Please log in to view chat requests.</h2>;
  }

  return (
    <div style={{ padding: '40px 20px', maxWidth: '900px', margin: '0 auto' }}>
      <h1>Chat Requests</h1>
      {loading ? (
        <p>Loading requests...</p>
      ) : requests.length === 0 ? (
        <p>No chat requests at the moment.</p>
      ) : (
        requests.map((request) => (
          <div key={request._id} style={{ border: '1px solid #ddd', borderRadius: '14px', padding: '18px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <img src={request.senderId?.avatar || 'https://via.placeholder.com/80'} alt={request.senderId?.name} style={{ width: '80px', borderRadius: '12px' }} />
              <div>
                <h3>{request.senderId?.name}</h3>
                <p>{request.senderId?.bio || 'No bio available'}</p>
                <p><strong>Favorite cuisines:</strong> {request.senderId?.favoriteCuisines?.join(', ')}</p>
                <p><strong>Hobbies:</strong> {request.senderId?.hobbies?.join(', ')}</p>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                <button
                  onClick={async () => {
                    try {
                      await axios.post(`http://localhost:4444/api/chats/request/${request._id}/respond`, { action: 'accepted' });
                      window.location.href = `/chat/${request._id}`;
                    } catch (err) {
                      console.error('Failed to accept', err);
                      alert(err.response?.data?.message || 'Failed to accept');
                    }
                  }}
                  style={{ padding: '10px 14px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '8px' }}
                >Accept</button>
                <button
                  onClick={async () => {
                    try {
                      await axios.post(`http://localhost:4444/api/chats/request/${request._id}/respond`, { action: 'declined' });
                      setRequests((prev) => prev.filter(r => r._id !== request._id));
                    } catch (err) {
                      console.error('Failed to decline', err);
                      alert(err.response?.data?.message || 'Failed to decline');
                    }
                  }}
                  style={{ padding: '10px 14px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '8px' }}
                >Decline</button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ChatRequests;
