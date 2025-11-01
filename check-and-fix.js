import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const currentUri = process.env.MONGODB_URI || 'mongodb+srv://vermanaman2106_db_user:JalqGXz5zUTUkBwP@cluster0.gcms4tf.mongodb.net/uniways?appName=Cluster0';

console.log('Current MONGODB_URI:', currentUri.replace(/:[^:@]+@/, ':****@'));

// Fix the database name to "Uniways"
const fixedUri = currentUri.replace(/\/\w+\?/, '/Uniways?');

console.log('\nFixed MONGODB_URI:', fixedUri.replace(/:[^:@]+@/, ':****@'));
console.log('\n📝 Update your .env file with this URI:\n');
console.log(`MONGODB_URI=${fixedUri}`);

async function testFixed() {
  try {
    console.log('\n🧪 Testing fixed connection...\n');
    await mongoose.connect(fixedUri);
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log(`✅ Connected to database: "${db.databaseName}"`);
    console.log(`📁 Collections found: ${collections.length}`);
    
    if (collections.length > 0) {
      for (const col of collections) {
        const count = await db.collection(col.name).countDocuments();
        console.log(`   - ${col.name}: ${count} documents`);
      }
      
      const facultyCol = db.collection('FacultyProfile');
      const facultyCount = await facultyCol.countDocuments();
      console.log(`\n✅ FacultyProfile collection: ${facultyCount} documents`);
      
      if (facultyCount > 0) {
        const sample = await facultyCol.findOne();
        console.log('\n📄 Sample document:');
        console.log(JSON.stringify(sample, null, 2));
      }
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Test successful! Use the URI above in your .env file');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testFixed();

