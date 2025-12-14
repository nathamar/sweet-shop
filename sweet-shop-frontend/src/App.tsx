import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';

// --- CONFIG ---
const API_URL = 'http://localhost:5000/api';

// --- TYPES ---
interface Sweet {
  _id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
}

// --- COMPONENTS ---

const Login = ({ setToken, setRole }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post(${API_URL}/auth/login, { email, password });
      setToken(res.data.token);
      setRole(res.data.role);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role);
      navigate('/');
    } catch (err) { alert('Login failed'); }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-pink-100">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded shadow-md">
        <h2 className="text-2xl mb-4 font-bold text-pink-600">Sweet Shop Login</h2>
        <input className="block w-full p-2 mb-2 border" placeholder="Email" onChange={e => setEmail(e.target.value)} />
        <input className="block w-full p-2 mb-4 border" type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
        <button className="w-full bg-pink-500 text-white p-2 rounded hover:bg-pink-600">Login</button>
      </form>
    </div>
  );
};

const Dashboard = ({ token, role }: any) => {
  const [sweets, setSweets] = useState<Sweet[]>([]);
  const [search, setSearch] = useState('');
  
  // Admin Form State
  const [newSweet, setNewSweet] = useState({ name: '', category: '', price: 0, quantity: 0 });

  useEffect(() => {
    fetchSweets();
  }, [search]);

  const fetchSweets = async () => {
    const endpoint = search ? /sweets/search?query=${search} : '/sweets';
    try {
      const res = await axios.get(${API_URL}${endpoint}, { headers: { Authorization: Bearer ${token} } });
      setSweets(res.data);
    } catch (err) { console.error(err); }
  };

  const buySweet = async (id: string) => {
    try {
      await axios.post(${API_URL}/sweets/${id}/purchase, {}, { headers: { Authorization: Bearer ${token} } });
      fetchSweets(); // Refresh list
      alert('Yum! Sweet purchased.');
    } catch (err) { alert('Error purchasing sweet'); }
  };

  const addSweet = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(${API_URL}/sweets, newSweet, { headers: { Authorization: Bearer ${token} } });
      fetchSweets();
      setNewSweet({ name: '', category: '', price: 0, quantity: 0 });
    } catch (err) { alert('Error adding sweet'); }
  };

  const deleteSweet = async (id: string) => {
    if(!confirm("Are you sure?")) return;
    try {
        await axios.delete(${API_URL}/sweets/${id}, { headers: { Authorization: Bearer ${token} } });
        fetchSweets();
    } catch (err) { alert('Error deleting'); }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-pink-600">🍬 The Sweet Shop</h1>
        <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="text-gray-500">Logout</button>
      </div>

      {/* Search Bar */}
      <input 
        className="w-full p-3 mb-8 border rounded shadow-sm" 
        placeholder="Search for chocolates, candies..." 
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Admin Panel */}
      {role === 'admin' && (
        <div className="bg-white p-4 rounded shadow mb-8 border-l-4 border-pink-500">
          <h3 className="font-bold mb-2">Admin: Add Inventory</h3>
          <form onSubmit={addSweet} className="flex gap-2">
            <input placeholder="Name" value={newSweet.name} onChange={e => setNewSweet({...newSweet, name: e.target.value})} className="border p-1" required />
            <input placeholder="Category" value={newSweet.category} onChange={e => setNewSweet({...newSweet, category: e.target.value})} className="border p-1" required />
            <input type="number" placeholder="Price" value={newSweet.price} onChange={e => setNewSweet({...newSweet, price: +e.target.value})} className="border p-1" required />
            <input type="number" placeholder="Qty" value={newSweet.quantity} onChange={e => setNewSweet({...newSweet, quantity: +e.target.value})} className="border p-1" required />
            <button className="bg-green-500 text-white px-4 rounded">Add</button>
          </form>
        </div>
      )}

      {/* Sweets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sweets.map(sweet => (
          <div key={sweet._id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <h2 className="text-xl font-bold">{sweet.name}</h2>
            <p className="text-gray-500 text-sm mb-2">{sweet.category}</p>
            <div className="flex justify-between items-center mt-4">
              <span className="text-lg font-semibold">${sweet.price}</span>
              <span className={text-sm ${sweet.quantity > 0 ? 'text-green-600' : 'text-red-600'}}>
                {sweet.quantity > 0 ? ${sweet.quantity} in stock : 'Sold Out'}
              </span>
            </div>
            <div className="mt-4 flex justify-between">
                <button 
                onClick={() => buySweet(sweet._id)} 
                disabled={sweet.quantity === 0}
                className={w-full py-2 rounded text-white ${sweet.quantity > 0 ? 'bg-pink-500 hover:bg-pink-600' : 'bg-gray-300 cursor-not-allowed'}}
                >
                {sweet.quantity > 0 ? 'Purchase' : 'Out of Stock'}
                </button>
                {role === 'admin' && <button onClick={() => deleteSweet(sweet._id)} className="ml-2 text-red-500">🗑</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- APP ENTRY ---
function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [role, setRole] = useState(localStorage.getItem('role'));

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login setToken={setToken} setRole={setRole} />} />
        <Route path="/" element={token ? <Dashboard token={token} role={role} /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
