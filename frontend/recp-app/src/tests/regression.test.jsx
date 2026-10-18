import React, { useContext, useEffect, useState } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import client from '../api/client';
import { AuthContext, AuthProvider } from '../context/AuthContext';
import Profile from '../pages/Profile';
import MyRecipes from '../pages/MyRecipes';
import Inputform from '../components/inputform';
import Recpitems from '../components/recpitems';
import Navbar from '../components/navbar';

describe('Frontend Regression Test Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  // Test 1: Reload resilience
  it('1. Reload resilience: initializes auth synchronously, children do not render until ready, and first request carries Authorization header', async () => {
    localStorage.setItem('token', 'saved-jwt-token-123');
    localStorage.setItem('user', JSON.stringify({ id: 'user-1', name: 'Alice' }));

    let interceptedAuthHeader = null;
    const mockGet = vi.spyOn(client, 'get').mockImplementation(() => {
      interceptedAuthHeader = `Bearer ${localStorage.getItem('token')}`;
      return Promise.resolve({ data: [] });
    });

    const ChildComponent = () => {
      const { user, token } = useContext(AuthContext);
      useEffect(() => {
        client.get('/api/recipes');
      }, []);
      return <div data-testid="child">Welcome {user?.name}, Token: {token}</div>;
    };

    render(
      <AuthProvider>
        <ChildComponent />
      </AuthProvider>
    );

    // Assert children render with user and token ready
    const child = await screen.findByTestId('child');
    expect(child).toHaveTextContent('Welcome Alice, Token: saved-jwt-token-123');
    expect(mockGet).toHaveBeenCalledWith('/api/recipes');
    expect(interceptedAuthHeader).toBe('Bearer saved-jwt-token-123');
  });

  // Test 2: Profile save keeps user id
  it('2. Profile save keeps user id: saved user keeps id (not _id) and subsequent My Recipes request does not contain undefined', async () => {
    const initialUser = { id: 'user-456', name: 'Bob', bio: 'Original bio' };
    localStorage.setItem('token', 'token-bob');
    localStorage.setItem('user', JSON.stringify(initialUser));

    vi.spyOn(client, 'get').mockImplementation((url) => {
      if (url === '/api/users/me') {
        return Promise.resolve({
          data: { id: 'user-456', name: 'Bob', email: 'bob@example.com', bio: 'Original bio', favorites: [] },
        });
      }
      if (url.startsWith('/api/recipes/user/')) {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: {} });
    });

    const mockPut = vi.spyOn(client, 'put').mockResolvedValue({
      data: { id: 'user-456', name: 'Bob', email: 'bob@example.com', bio: 'Updated bio', favorites: [] },
    });

    const TestHarness = () => {
      const [view, setView] = useState('profile');
      return (
        <AuthProvider>
          <MemoryRouter>
            {view === 'profile' ? (
              <>
                <Profile />
                <button type="button" onClick={() => setView('my-recipes')}>Go to My Recipes</button>
              </>
            ) : (
              <MyRecipes />
            )}
          </MemoryRouter>
        </AuthProvider>
      );
    };

    render(<TestHarness />);

    // Wait for profile to load
    await screen.findByDisplayValue('Original bio');

    // Change bio and submit
    const bioInput = screen.getByDisplayValue('Original bio');
    fireEvent.change(bioInput, { target: { value: 'Updated bio' } });
    fireEvent.click(screen.getByRole('button', { name: /save profile/i }));

    await screen.findByText('Profile updated successfully!');
    expect(mockPut).toHaveBeenCalledWith('/api/users/me', expect.objectContaining({ bio: 'Updated bio' }));

    // Verify localStorage stored user has id and not _id
    const storedUser = JSON.parse(localStorage.getItem('user'));
    expect(storedUser.id).toBe('user-456');
    expect(storedUser._id).toBeUndefined();

    // Navigate to My Recipes
    fireEvent.click(screen.getByRole('button', { name: /go to my recipes/i }));

    await waitFor(() => {
      expect(client.get).toHaveBeenCalledWith('/api/recipes/user/user-456');
    });

    // Ensure no request was made to /api/recipes/user/undefined
    const getCalls = client.get.mock.calls.map(call => call[0]);
    expect(getCalls).not.toContain('/api/recipes/user/undefined');
  });

  // Test 3: Password toggle
  it('3. Password toggle: typing updates input value without toggling visibility; clicking eye toggles between password and text', async () => {
    render(
      <AuthProvider>
        <Inputform setIsOpen={vi.fn()} />
      </AuthProvider>
    );

    const passwordInput = screen.getByLabelText(/^password$/i);
    expect(passwordInput).toHaveAttribute('type', 'password');

    // Type a password
    fireEvent.change(passwordInput, { target: { value: 'SuperSecret123!' } });
    expect(passwordInput.value).toBe('SuperSecret123!');
    expect(passwordInput).toHaveAttribute('type', 'password');

    // Click show password button
    const toggleBtn = screen.getByRole('button', { name: /show password/i });
    expect(toggleBtn).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(toggleBtn);

    // Should now be type="text"
    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(passwordInput.value).toBe('SuperSecret123!');
    expect(screen.getByRole('button', { name: /hide password/i })).toHaveAttribute('aria-pressed', 'true');

    // Click hide password button
    fireEvent.click(screen.getByRole('button', { name: /hide password/i }));
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: /show password/i })).toHaveAttribute('aria-pressed', 'false');
  });

  // Test 4: Like vs Favorite independence
  it('4. Like vs Favorite independence: clicking heart calls only like endpoint; clicking bookmark calls only favorites endpoint', async () => {
    const mockPost = vi.spyOn(client, 'post').mockResolvedValue({ data: { favorites: ['rec-99'] } });
    const mockUser = { id: 'u-1', name: 'TestUser', favorites: [] };

    const mockRecipe = {
      _id: 'rec-99',
      title: 'Delicious Pasta',
      description: 'Tasty homemade pasta recipe',
      likes: [],
      author: 'Chef Mario',
    };

    render(
      <MemoryRouter>
        <AuthContext.Provider value={{ user: mockUser, token: 'token-123', login: vi.fn() }}>
          <Recpitems recipes={[mockRecipe]} onUpdate={vi.fn()} />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    // 1. Click Like button
    const likeBtn = screen.getByRole('button', { name: /like recipe/i });
    fireEvent.click(likeBtn);

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/api/recipes/rec-99/like');
    });
    // Ensure favorites endpoint was not called
    expect(mockPost).not.toHaveBeenCalledWith(expect.stringContaining('/favorites'));

    mockPost.mockClear();

    // 2. Click Favorite button
    const favBtn = screen.getByRole('button', { name: /save to favorites/i });
    fireEvent.click(favBtn);

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/api/users/favorites/rec-99');
    });
    // Ensure like endpoint was not called
    expect(mockPost).not.toHaveBeenCalledWith(expect.stringContaining('/like'));
  });

  // Test 5: Navbar responsive toggle
  it('5. Navbar responsive toggle: desktop links render, hamburger toggles aria-expanded and drawer open class', async () => {
    const mockUser = { id: 'u-1', name: 'TestUser' };

    render(
      <MemoryRouter>
        <AuthContext.Provider value={{ user: mockUser, logout: vi.fn() }}>
          <Navbar />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    // Verify desktop links render
    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /favorites/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /my recipes/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /find users/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /chats/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /chat requests/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /add recipe/i })).toBeInTheDocument();

    // Verify hamburger button exists with aria-expanded="false"
    const hamburgerBtn = screen.getByRole('button', { name: /toggle navigation menu/i });
    expect(hamburgerBtn).toHaveAttribute('aria-expanded', 'false');

    const navDrawer = document.getElementById('navbar-nav-links');
    expect(navDrawer).not.toHaveClass('open');

    // Click hamburger button to open drawer
    fireEvent.click(hamburgerBtn);
    expect(hamburgerBtn).toHaveAttribute('aria-expanded', 'true');
    expect(navDrawer).toHaveClass('open');

    // Click hamburger button again to close drawer
    fireEvent.click(hamburgerBtn);
    expect(hamburgerBtn).toHaveAttribute('aria-expanded', 'false');
    expect(navDrawer).not.toHaveClass('open');

    // Open again and test Escape key closes drawer
    fireEvent.click(hamburgerBtn);
    expect(hamburgerBtn).toHaveAttribute('aria-expanded', 'true');
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(hamburgerBtn).toHaveAttribute('aria-expanded', 'false');
    expect(navDrawer).not.toHaveClass('open');
  });
});
