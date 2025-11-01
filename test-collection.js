import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb+srv://vermanaman2106_db_user:JalqGXz5zUTUkBwP@cluster0.gcms4tf.mongodb.net/uniways?appName=Cluster0';

async function testCollection() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const dbName = db.databaseName;
    console.log(`📊 Connected to database: "${dbName}"`);
    
    // List all databases
    const adminDb = mongoose.connection.db.admin();
    const databases = await adminDb.listDatabases();
    console.log(`\n📚 All databases on server:`);
    databases.databases.forEach(db => {
      console.log(`   - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });
    
    // List all collections in current database
    const collections = await db.listCollections().toArray();
    console.log(`\n📁 Collections in database "${dbName}":`);
    if (collections.length === 0) {
      console.log('   ❌ No collections found');
    } else {
      collections.forEach(col => {
        console.log(`   - ${col.name}`);
      });
    }
    
    // Try to find FacultyProfile collection (case-insensitive)
    const allCollectionNames = collections.map(c => c.name);
    const facultyCollectionName = allCollectionNames.find(name => 
      name.toLowerCase() === 'facultyprofile' || 
      name.toLowerCase() === 'facultyprofiles' ||
      name.toLowerCase().includes('faculty')
    );
    
    if (facultyCollectionName) {
      console.log(`\n✅ Found collection: "${facultyCollectionName}"`);
      const collection = db.collection(facultyCollectionName);
      const count = await collection.countDocuments();
      console.log(`   Document count: ${count}`);
      
      if (count > 0) {
        const sample = await collection.findOne();
        console.log(`\n📄 Sample document structure:`);
        console.log(JSON.stringify(sample, null, 2));
      } else {
        console.log(`   ⚠️ Collection exists but has 0 documents`);
      }
    } else {
      console.log('\n❌ FacultyProfile collection not found');
      console.log('   Checking if collection exists with different case...');
      
      // Try direct access with different case variations
      const possibleNames = ['FacultyProfile', 'facultyProfile', 'facultyprofile', 'FacultyProfiles', 'faculty_profiles'];
      for (const name of possibleNames) {
        try {
          const testCol = db.collection(name);
          const count = await testCol.countDocuments();
          if (count > 0) {
            console.log(`\n✅ Found collection: "${name}" with ${count} documents`);
            const sample = await testCol.findOne();
            console.log(`   Sample:`, JSON.stringify(sample, null, 2));
            break;
          }
        } catch (e) {
          // Collection doesn't exist with this name
        }
      }
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Test completed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testCollection();

