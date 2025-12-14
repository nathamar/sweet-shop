import mongoose, { Schema } from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

// --- DEFINING MODELS (Stand-alone for seeding) ---
const SweetSchema = new Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 0 },
});
const Sweet = mongoose.model('Sweet', SweetSchema);

const UserSchema = new Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'customer'], default: 'customer' },
});
const User = mongoose.model('User', UserSchema);

// --- SEED FUNCTION ---
const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sweetshop');
    console.log('🌱 Connected to DB...');

    // 1. Clear existing data
    await Sweet.deleteMany({});
    await User.deleteMany({});
    console.log('🧹 Old data cleared.');

    // 2. Create Users
    const salt = await bcrypt.genSalt(10);
    const adminPass = await bcrypt.hash('admin123', salt);
    const userPass = await bcrypt.hash('user123', salt);

    const admin = new User({ email: 'admin@sweetshop.com', passwordHash: adminPass, role: 'admin' });
    const customer = new User({ email: 'customer@sweetshop.com', passwordHash: userPass, role: 'customer' });

    await admin.save();
    await customer.save();
    console.log('👤 Users created: Admin & Customer.');

    // 3. Create Sweets
    const sweets = [
      { name: 'Dark Chocolate Truffle', category: 'Chocolate', price: 2.50, quantity: 50 },
      { name: 'Rainbow Gummy Bears', category: 'Gummies', price: 1.20, quantity: 100 },
      { name: 'Sour Worms', category: 'Gummies', price: 1.50, quantity: 0 }, // Out of stock example
      { name: 'Peanut Butter Cup', category: 'Chocolate', price: 3.00, quantity: 30 },
      { name: 'Vanilla Bean Fudge', category: 'Fudge', price: 4.00, quantity: 15 },
    ];

    await Sweet.insertMany(sweets);
    console.log('🍬 Sweets inventory stocked.');

    console.log('✅ SEEDING COMPLETE');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedDB();