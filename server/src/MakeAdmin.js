import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import User from './models/User.js';

// Make an existing account an admin, and optionally set a new password:
//   npm run make-admin -- someone@example.com
//   npm run make-admin -- someone@example.com NewPassword123
async function run() {
  const [email, newPassword] = process.argv.slice(2);
  if (!email) throw new Error('Usage: npm run make-admin -- email@example.com [newPassword]');

  await connectDB();
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new Error(`No account found for ${email}. Register it in the app first, or run: npm run seed`);

  user.role = 'admin';
  user.isActive = true;
  if (newPassword) {
    if (newPassword.length < 8) throw new Error('The password must be at least 8 characters');
    user.password = newPassword; // hashed automatically when saved
  }
  await user.save();
  console.log(`${user.email} is now an admin${newPassword ? ' and the password was changed' : ''}.`);
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error(err.message);
  await mongoose.disconnect();
  process.exit(1);
});