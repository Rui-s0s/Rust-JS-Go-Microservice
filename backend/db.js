import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/shopDB';
    const conn = await mongoose.connect(uri);

    // --- The "Basic Shit" Tests ---
    const dbName = conn.connection.name;
    const host = conn.connection.host;
    const readyState = conn.connection.readyState;

    // console.log(`✅ MongoDB Connected!`);
    // console.log(`📍 Host: ${host}`);        // Should be 'mongo_db' if in Docker
    // console.log(`📂 Database: ${dbName}`); // Should be 'shopDB'
    // console.log(`🚦 Status: ${readyState === 1 ? 'Ready' : 'Not Ready'}`);

  } catch (err) {
    console.error(`❌ Connection Error: ${err.message}`);
    process.exit(1);
  }
};

export default connectDB;

connectDB()