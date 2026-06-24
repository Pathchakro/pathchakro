const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Read .env.local manually
const envPath = path.join(__dirname, '../.env.local');
if (!fs.existsSync(envPath)) {
  console.error('.env.local file not found');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
let mongoUri = '';
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts[0] && parts[0].trim() === 'MONGODB_URI') {
    mongoUri = parts.slice(1).join('=').trim();
  }
});

// Clean quotes if present
if (mongoUri.startsWith('"') && mongoUri.endsWith('"')) {
  mongoUri = mongoUri.slice(1, -1);
}
if (mongoUri.startsWith("'") && mongoUri.endsWith("'")) {
  mongoUri = mongoUri.slice(1, -1);
}

if (!mongoUri) {
  console.error('MONGODB_URI not found in .env.local');
  process.exit(1);
}

console.log('Connecting to database...');

// Define minimal user schema
const UserSchema = new mongoose.Schema({
  email: String,
  role: String,
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function run() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    const targetEmail = 'imranshuvo101@gmail.com';
    const user = await User.findOne({ email: targetEmail });

    if (!user) {
      console.log(`User with email ${targetEmail} not found in database yet. They will automatically get the 'super-admin' role when they sign in.`);
    } else {
      user.role = 'super-admin';
      await user.save();
      console.log(`Successfully updated ${targetEmail} role to 'super-admin' in the database!`);
    }
  } catch (error) {
    console.error('Error updating user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

run();
