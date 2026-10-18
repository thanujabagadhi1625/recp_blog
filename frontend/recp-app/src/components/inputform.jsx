import React, { useState, useContext } from "react";
import client from "../api/client";
import { AuthContext } from "../context/AuthContext";
import { FaEye, FaEyeSlash } from 'react-icons/fa';

function Inputform({ setIsOpen }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const endpoint = isSignup ? "signup" : "login";
      const payload = isSignup ? { name, email, password } : { email, password };
      
      const res = await client.post(`/api/users/${endpoint}`, payload);

      login(res.data.token, res.data.user);
      setIsOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      {isSignup && (
        <div className="form-control">
          <label>Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
      )}

      <div className="form-control">
        <label>Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="form-control" style={{ position: 'relative' }}>
        <label>Password</label>
        <input
          type={showPassword ? 'text' : 'password'}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ paddingRight: '40px' }}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? "Hide password" : "Show password"}
          style={{ position: 'absolute', right: '10px', top: '34px', cursor: 'pointer', background: 'none', border: 'none', color: 'inherit', display: 'flex', alignItems: 'center', padding: '4px' }}
        >
          {showPassword ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>

      <button type="submit">{isSignup ? "Sign Up" : "Login"}</button>

      {error && <p className="error" style={{color: 'red', textAlign: 'center'}}>{error}</p>}

      <p onClick={() => setIsSignup(!isSignup)} style={{cursor: 'pointer', textAlign: 'center', marginTop: '10px', color: '#007bff'}}>
        {isSignup ? "Already have an account? Login" : "Create New Account"}
      </p>
    </form>
  );
}

export default Inputform;