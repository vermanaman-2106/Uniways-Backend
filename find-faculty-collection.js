import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Try both database names
const databases = ['Uniways', 'uniways'];

async function findFacultyCollection(dbName) {
  const uri = process.env.MONGODB_URI?.replace(/\/\w+\?/, `/${dbName}?`) || 
              `mongodb+srv://vermanaman2106_db_user:JalqGXz5zUTUkBwP@cluster0.gcms4tf.mongodb.net/${dbName}?appName=Cluster0`;
  
  try {
    console.log(`\n🔄 Testing database: "${dbName}"`);
    await mongoose.connect(uri);
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log(`   Collections found: ${collections.length}`);
    collections.forEach(col => {
      console.log(`     - ${col.name}`);
    });
    
    // Check for faculty-related collections
    const facultyCols = collections.filter(col => 
      col.name.toLowerCase().includes('faculty') || 
      col.name.toLowerCase().includes('profile')
    );
    
    if (facultyCols.length > 0) {
      for (const col of facultyCols) {
        const count = await db.collection(col.name).countDocuments();
        console.log(`\n✅ Found "${col.name}" with ${count} documents`);
        if (count > 0) {
          const sample = await db.collection(col.name).findOne();
          console.log(`   Sample document:`, JSON.stringify(sample, null, 2));
        }
      }
    }
    
    await mongoose.disconnect();
    return facultyCols.length > 0;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    return false;
  }
}

async function main() {
  console.log('🔍 Searching for FacultyProfile collection...\n');
  
  for (const dbName of databases) {
    const found = await findFacultyCollection(dbName);
    if (found) {
      console.log(`\n✅ FacultyProfile collection found in database: "${dbName}"`);
      console.log(`💡 Update your .env MONGODB_URI to use: .../${dbName}?...`);
      break;
    }
  }
  
  console.log('\n✅ Search completed');
  process.exit(0);
}

main();

