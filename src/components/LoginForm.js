import React, { useState } from 'react';
import { findPid, register } from '../api';

const LoginForm = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (name && address) {
      try {
        const pid = await findPid(name, address);
        if (pid) {
          onLogin(name, pid);
        } else {
          const newPid = await register(name, address);
          onLogin(name, newPid);
        }
      } catch (error) {
        alert(`Error during login: ${error.message}`);
      }
    } else {
      alert("Please enter both name and address");
    }
  };

  return (
    <form id="login-form" className="login-form" onSubmit={handleSubmit}>
      <h2>Login</h2>
      <input
        type="text"
        placeholder="Enter your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Enter your address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        required
      />
      <button type="submit">Login</button>
      <button type="button" onClick={() => onLogin('wallet')}>Connect Wallet</button>
    </form>
  );
};

export default LoginForm;
