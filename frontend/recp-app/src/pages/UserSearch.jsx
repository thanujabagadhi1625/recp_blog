import React, { useState, useContext } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const UserSearch = () => {
  const { token } = useContext(AuthContext);
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:4444/api/users/search?q=${encodeURIComponent(query)}`);
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to search users', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px 20px', maxWidth: '900px', margin: '0 auto' }}>
      <h1>Find Users</h1>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email"
          style={{ flex: 1 }}
        />
        <button onClick={handleSearch} disabled={loading}>{loading ? 'Searching...' : 'Search'}</button>
      </div>
      <div>
        {users.length === 0 ? (
          <p>No users found yet.</p>
        ) : (
          users.map((user) => (
            <div key={user._id} style={{ border: '1px solid #ddd', padding: '16px', borderRadius: '14px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <img src={user.avatar || 'https://via.placeholder.com/80'} alt={user.name} style={{ width: '80px', borderRadius: '12px' }} />
                <div>
                  <h3>{user.name}</h3>
                  <p>{user.bio}</p>
                  <p><strong>Favorite cuisines:</strong> {user.favoriteCuisines?.join(', ')}</p>
                  <p><strong>Hobbies:</strong> {user.hobbies?.join(', ')}</p>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                  <button
                    onClick={async () => {
                      try {
                        await axios.post(`http://localhost:4444/api/chats/request/${user._id}`, {}, { headers: { Authorization: token ? `Bearer ${token}` : undefined } });
                        alert('Chat request sent');
                      } catch (err) {
                        console.error('Failed to send chat request', err);
                        alert(err.response?.data?.message || 'Failed to send chat request');
                      }
                    }}
                    style={{ padding: '10px 14px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '8px' }}
                  >Send Chat Request</button>
                  <Link to={`/chat/requests`} style={{ color: '#667eea', alignSelf: 'center', textDecoration: 'none' }}>Requests</Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UserSearch;
