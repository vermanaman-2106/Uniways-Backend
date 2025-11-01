import mongoose from 'mongoose';
import dotenv from 'dotenv';
import FacultyProfile from '../models/Faculty.js';
import User from '../models/User.js';

dotenv.config({ path: './.env' });

async function checkFacultyUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all faculty profiles
    const facultyProfiles = await FacultyProfile.find({});
    console.log(`📋 Found ${facultyProfiles.length} faculty profiles\n`);

    // Check each faculty profile
    let linkedCount = 0;
    let unlinkedCount = 0;
    const unlinked = [];

    for (const profile of facultyProfiles) {
      const user = await User.findOne({
        email: profile.email.toLowerCase().trim(),
        role: 'faculty',
      });

      if (user) {
        linkedCount++;
        console.log(`✅ ${profile.name} (${profile.email}) - Linked to User ID: ${user._id}`);
      } else {
        unlinkedCount++;
        unlinked.push({
          name: profile.name,
          email: profile.email,
          id: profile._id,
        });
        console.log(`❌ ${profile.name} (${profile.email}) - No User account found`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`📊 Summary:`);
    console.log(`   Total Faculty Profiles: ${facultyProfiles.length}`);
    console.log(`   ✅ Linked to User: ${linkedCount}`);
    console.log(`   ❌ Not Linked: ${unlinkedCount}`);
    console.log('='.repeat(60));

    if (unlinked.length > 0) {
      console.log('\n⚠️  Faculty members NOT registered in User collection:');
      console.log('\nTo fix this, these faculty members need to:');
      console.log('1. Open the app');
      console.log('2. Go to Sign Up page');
      console.log('3. Register with their email from FacultyProfile');
      console.log('4. Select Role: Faculty');
      console.log('\n📝 Unlinked Faculty:');
      unlinked.forEach((faculty, index) => {
        console.log(`\n${index + 1}. ${faculty.name}`);
        console.log(`   Email: ${faculty.email}`);
        console.log(`   FacultyProfile ID: ${faculty.id}`);
        console.log(`   → Sign up with email: ${faculty.email}`);
      });
    } else {
      console.log('\n✅ All faculty members have User accounts!');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkFacultyUsers();

