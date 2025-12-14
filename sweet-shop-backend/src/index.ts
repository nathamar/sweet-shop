import express, { Request, Response, NextFunction } from 'express';
import mongoose, { Schema, Document } from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// --- DATABASE MODELS ---

// Sweet Model
interface ISweet extends Document {
  name: string;
  category: string;
  price: number;
  quantity: number;
}
const SweetSchema = new Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 0 },
});
const Sweet = mongoose.model<ISweet>('Sweet', SweetSchema);

// User Model
interface IUser extends Document {
  email: string;
  passwordHash: string;
  role: 'admin' | 'customer';
}
const UserSchema = new Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'customer'], default: 'customer' },
});
const User = mongoose.model<IUser>('User', UserSchema);

// --- MIDDLEWARE ---

// Authentication Middleware
const auth = (req: any, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).send('Access Denied');

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).send('Invalid Token');
  }
};

// Admin Check Middleware
const adminOnly = (req: any, res: Response, next: NextFunction) => {
  if (req.user.role !== 'admin') return res.status(403).send('Admin access required');
  next();
};

// --- ROUTES ---

// 1. Auth Routes
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const user = new User({ email, passwordHash, role });
    await user.save();
    res.status(201).send({ message: 'User registered' });
  } catch (err) {
    res.status(400).send(err);
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).send('Email not found');
  
  const validPass = await bcrypt.compare(password, user.passwordHash);
  if (!validPass) return res.status(400).send('Invalid password');

  const token = jwt.sign({ _id: user._id, role: user.role }, process.env.JWT_SECRET || 'secret');
  res.header('auth-token', token).send({ token, role: user.role });
});

// 2. Sweet Routes
app.get('/api/sweets', auth, async (req: Request, res: Response) => {
  const sweets = await Sweet.find();
  res.send(sweets);
});

app.get('/api/sweets/search', auth, async (req: Request, res: Response) => {
  const { query } = req.query; 
  // Cast query object to 'any' to bypass strict TS check on $or
  const searchCriteria: any = {
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { category: { $regex: query, $options: 'i' } }
    ]
  };
  const sweets = await Sweet.find(searchCriteria);
  res.send(sweets);
});

app.post('/api/sweets', auth, adminOnly, async (req: Request, res: Response) => {
  const sweet = new Sweet(req.body);
  try {
    await sweet.save();
    res.status(201).send(sweet);
  } catch (err) {
    res.status(400).send(err);
  }
});

app.put('/api/sweets/:id', auth, adminOnly, async (req: Request, res: Response) => {
  try {
    const updated = await Sweet.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.send(updated);
  } catch (err) {
    res.status(400).send(err);
  }
});

app.delete('/api/sweets/:id', auth, adminOnly, async (req: Request, res: Response) => {
  await Sweet.findByIdAndDelete(req.params.id);
  res.send({ message: 'Sweet deleted' });
});

// 3. Inventory Routes
app.post('/api/sweets/:id/purchase', auth, async (req: Request, res: Response) => {
  const sweet = await Sweet.findById(req.params.id);
  if (!sweet) return res.status(404).send('Sweet not found');
  if (sweet.quantity < 1) return res.status(400).send('Out of stock');
  
  sweet.quantity -= 1;
  await sweet.save();
  res.send({ message: 'Purchase successful', sweet });
});

app.post('/api/sweets/:id/restock', auth, adminOnly, async (req: Request, res: Response) => {
  const { amount } = req.body;
  const sweet = await Sweet.findById(req.params.id);
  if (!sweet) return res.status(404).send('Sweet not found');
  
  sweet.quantity += amount;
  await sweet.save();
  res.send({ message: 'Restock successful', sweet });
});

// --- SERVER START ---
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sweetshop')
  .then(() => {
    // FIXED: Added backticks for template literal
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.log(err));

export default app;