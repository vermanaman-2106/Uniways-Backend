import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb+srv://vermanaman2106_db_user:JalqGXz5zUTUkBwP@cluster0.gcms4tf.mongodb.net/uniways?appName=Cluster0';

async function testConnection() {
  try {
    console.log('🔄 Attempting to connect to MongoDB...');
    console.log('📍 Connection URI:', uri.replace(/:[^:@]+@/, ':****@')); // Hide password
    
    const conn = await mongoose.connect(uri, {
      serverApi: {
        version: '1',
        strict: true,
        deprecationErrors: true,
      }
    });
    
    console.log('✅ MongoDB Connected Successfully!');
    console.log(`   Host: ${conn.connection.host}`);
    console.log(`   Database: ${conn.connection.name}`);
    console.log(`   State: ${conn.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
    
    // Test database operations
    const collections = await conn.connection.db.listCollections().toArray();
    console.log(`   Collections: ${collections.length} found`);
    if (collections.length > 0) {
      console.log('   Collection names:', collections.map(c => c.name).join(', '));
    }
    
    await mongoose.disconnect();
    console.log('✅ Connection test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ MongoDB Connection Failed!');
    console.error('   Error:', error.message);
    if (error.message.includes('authentication')) {
      console.error('   💡 Check your username and password in the connection string');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('DNS')) {
      console.error('   💡 Check your network connection and MongoDB Atlas cluster URL');
    } else if (error.message.includes('timeout')) {
      console.error('   💡 Connection timeout - check your IP whitelist in MongoDB Atlas');
    }
    process.exit(1);
  }
}

testConnection();

