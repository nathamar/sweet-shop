// App.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import './style.css'

const API_URL = 'http://localhost:5000/api';

const Login = ({ setToken, setRole }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await axios.post(`${API_URL}/auth/login`, { email, password });
    setToken(res.data.token);
    setRole(res.data.role);
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('role', res.data.role);
    navigate('/');
  };

  return (
    <div className="login-wrapper">
      <form className="login-card" onSubmit={handleLogin}>
        <h2>Sweet Shop 🍬</h2>
        <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
        <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
        <button>Login</button>
      </form>
    </div>
  );
};

const Dashboard = ({ token, role }) => {
  const [sweets, setSweets] = useState([]);
  const [search, setSearch] = useState('');
  const [newSweet, setNewSweet] = useState({ name: '', category: '', price: 0, quantity: 0 });

  useEffect(() => { fetchSweets(); }, [search]);

  const fetchSweets = async () => {
    const endpoint = search ? `/sweets/search?query=${search}` : '/sweets';
    const res = await axios.get(`${API_URL}${endpoint}`, { headers: { Authorization: `Bearer ${token}` } });
    setSweets(res.data);
  };

  const buySweet = async (id) => {
    await axios.post(`${API_URL}/sweets/${id}/purchase`, {}, { headers: { Authorization: `Bearer ${token}` } });
    fetchSweets();
  };

  const addSweet = async (e) => {
    e.preventDefault();
    await axios.post(`${API_URL}/sweets`, newSweet, { headers: { Authorization: `Bearer ${token}` } });
    setNewSweet({ name: '', category: '', price: 0, quantity: 0 });
    fetchSweets();
  };

  const deleteSweet = async (id) => {
    if (!confirm('Delete sweet?')) return;
    await axios.delete(`${API_URL}/sweets/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    fetchSweets();
  };

  return (
    <div className="dashboard">
      <header>
        <h1>🍭 Sweet Shop</h1>
        <button className="logout" onClick={() => { localStorage.clear(); location.reload(); }}>Logout</button>
      </header>

      <input className="search" placeholder="Search sweets" value={search} onChange={e => setSearch(e.target.value)} />

      {role === 'admin' && (
        <form className="admin-form" onSubmit={addSweet}>
          <input placeholder="Name" value={newSweet.name} onChange={e => setNewSweet({ ...newSweet, name: e.target.value })} />
          <input placeholder="Category" value={newSweet.category} onChange={e => setNewSweet({ ...newSweet, category: e.target.value })} />
          <input type="number" placeholder="Price" value={newSweet.price} onChange={e => setNewSweet({ ...newSweet, price: +e.target.value })} />
          <input type="number" placeholder="Qty" value={newSweet.quantity} onChange={e => setNewSweet({ ...newSweet, quantity: +e.target.value })} />
          <button>Add</button>
        </form>
      )}

      <div className="grid">
        {sweets.map(s => (
          <div key={s._id} className="card">
            <h3>{s.name}</h3>
            <p className="category">{s.category}</p>
            <div className="meta">
              <span>${s.price}</span>
              <span className={s.quantity ? 'in' : 'out'}>
                {s.quantity ? `${s.quantity} left` : 'Sold out'}
              </span>
            </div>
            <div className="actions">
              <button disabled={!s.quantity} onClick={() => buySweet(s._id)}>Buy</button>
              {role === 'admin' && <button className="delete" onClick={() => deleteSweet(s._id)}>🗑</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [role, setRole] = useState(localStorage.getItem('role'));

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login setToken={setToken} setRole={setRole} />} />
        <Route path="/" element={token ? <Dashboard token={token} role={role} /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  )
}