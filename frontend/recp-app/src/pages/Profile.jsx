import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const Profile = () => {
  const { user, login } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ avatar: '', bio: '', favoriteCuisines: '', hobbies: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await axios.get('http://localhost:4444/api/users/me');
        setProfile(res.data);
        setForm({
          avatar: res.data.avatar || '',
          bio: res.data.bio || '',
          favoriteCuisines: (res.data.favoriteCuisines || []).join(', '),
          hobbies: (res.data.hobbies || []).join(', '),
        });
      } catch (err) {
        console.error('Failed to load profile', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage('');

    try {
      const payload = {
        avatar: form.avatar,
        bio: form.bio,
        favoriteCuisines: form.favoriteCuisines,
        hobbies: form.hobbies,
      };
      const res = await axios.put('http://localhost:4444/api/users/me', payload);
      setProfile(res.data);
      login(localStorage.getItem('token'), res.data);
      setMessage('Profile updated successfully!');
    } catch (err) {
      console.error('Failed to update profile', err);
      setMessage(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return <h2 style={{ textAlign: 'center', marginTop: '80px' }}>Please log in to view your profile.</h2>;
  }

  if (loading) {
    return <h2 style={{ textAlign: 'center', marginTop: '80px' }}>Loading profile...</h2>;
  }

  return (
    <div className="profile-page" style={{ padding: '40px 20px', maxWidth: '900px', margin: '0 auto' }}>
      <h1>My Profile</h1>
      <div className="profile-card" style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <img src={profile?.avatar || 'https://via.placeholder.com/200'} alt="Avatar" style={{ width: '200px', borderRadius: '18px' }} />
        </div>
        <div style={{ flex: 2 }}>
          <h2>{profile?.name}</h2>
          <p><strong>Email:</strong> {profile?.email}</p>
          <p><strong>Bio:</strong> {profile?.bio || 'No bio yet.'}</p>
          <p><strong>Favorite cuisines:</strong> {profile?.favoriteCuisines?.join(', ') || 'Not set'}</p>
          <p><strong>Hobbies:</strong> {profile?.hobbies?.join(', ') || 'Not set'}</p>
          <p><strong>Favorite recipes:</strong> {profile?.favorites?.length || 0}</p>
        </div>
      </div>

      <section style={{ marginTop: '40px' }}>
        <h2>Edit Profile</h2>
        <form onSubmit={handleSave} style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label>Avatar URL</label>
            <input type="text" name="avatar" value={form.avatar} onChange={handleChange} placeholder="https://..." />
          </div>
          <div>
            <label>Bio</label>
            <textarea name="bio" value={form.bio} onChange={handleChange} rows={3} />
          </div>
          <div>
            <label>Favorite cuisines</label>
            <input type="text" name="favoriteCuisines" value={form.favoriteCuisines} onChange={handleChange} placeholder="Italian, Mexican, Indian" />
          </div>
          <div>
            <label>Hobbies</label>
            <input type="text" name="hobbies" value={form.hobbies} onChange={handleChange} placeholder="Cooking, Baking, Travel" />
          </div>
          <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</button>
        </form>
        {message && <p style={{ marginTop: '12px', color: 'green' }}>{message}</p>}
      </section>
    </div>
  );
};

export default Profile;
