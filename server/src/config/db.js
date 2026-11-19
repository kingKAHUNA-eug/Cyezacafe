import dns from 'dns';
import mongoose from 'mongoose';

// Some networks (phone hotspots, certain routers) refuse the SRV lookups that
// mongodb+srv:// needs, which shows up as "querySrv ECONNREFUSED".
// Setting DNS_SERVERS=8.8.8.8,8.8.4.4 in .env makes Node use Google DNS instead.
if (process.env.DNS_SERVERS) {
  dns.setServers(process.env.DNS_SERVERS.split(',').map((s) => s.trim()));
}

export default async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI is missing. Copy .env.example to .env and fill it in.');
    process.exit(1);
  }
  mongoose.set('strictQuery', true);

  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
    console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (err) {
    // Mongoose often hides the real cause behind a generic "IP whitelist" message.
    // Print what each server actually answered with.
    console.error('--- MongoDB connection details ---');
    const servers = err.reason?.servers;
    if (servers) {
      for (const [address, desc] of servers) {
        console.error(`${address} -> ${desc.error?.message || desc.type || 'no response'}`);
      }
    } else {
      console.error(err.message);
    }
    console.error('----------------------------------');
    throw err;
  }
}