// scripts/create-admin-simple.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env from root directory (2 levels up from scripts folder)
dotenv.config({ path: join(__dirname, '../.env') });

// ✅ FIXED: Correct path to model - go up one level from scripts to BACKEND, then into models
import AdminVendor from '../models/AdminVendor.js';

const createAdmin = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/unimarket';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Get credentials from command line or use defaults
    const email = process.argv[2] || 'migoboi@gmail.com';
    const password = process.argv[3] || 'Admin123!';
    const fullName = process.argv[4] || 'Super Admin';
    
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || 'Super';
    const lastName = nameParts.slice(1).join(' ') || 'Admin';
    
    // Hash password
    console.log('🔐 Hashing password...');
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Check if admin exists
    const existingAdmin = await AdminVendor.findOne({ email: email.toLowerCase() });
    
    if (existingAdmin) {
      console.log('⚠️ Admin already exists. Updating...');
      
      existingAdmin.password = hashedPassword;
      existingAdmin.passwordChangedAt = new Date();
      existingAdmin.role = 'super_admin';
      existingAdmin.status = 'active';
      existingAdmin.emailVerified = true;
      existingAdmin.emailVerifiedAt = new Date();
      
      // Add to password history
      if (!existingAdmin.passwordHistory) existingAdmin.passwordHistory = [];
      existingAdmin.passwordHistory.push({
        password: hashedPassword,
        changedAt: new Date()
      });
      
      await existingAdmin.save();
      
      console.log('\n✅ ADMIN UPDATED SUCCESSFULLY!');
      console.log('=================================');
      console.log('📧 Email:', email);
      console.log('🔑 Password:', password);
      console.log('👤 Role: super_admin');
      console.log('🆔 ID:', existingAdmin._id);
      console.log('=================================\n');
    } else {
      // Create new admin
      console.log('👤 Creating new admin...');
      
      const admin = new AdminVendor({
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        role: 'super_admin',
        status: 'active',
        emailVerified: true,
        emailVerifiedAt: new Date(),
        
        // Basic permissions
        permissions: [
          'users.view', 'users.create', 'users.edit', 'users.delete',
          'vendors.view', 'vendors.approve', 'vendors.suspend',
          'products.view', 'products.create', 'products.edit', 'products.delete',
          'orders.view', 'orders.edit', 'orders.refund',
          'settings.view', 'settings.edit',
          'audit.trail', 'analytics.view'
        ],
        
        // Admin profile
        adminProfile: {
          employeeId: `ADMIN${Date.now().toString().slice(-6)}`,
          position: 'System Administrator',
          department: 'management',
          joinedAt: new Date(),
          accessLevel: 'super_admin',
          loginHistory: []
        },
        
        // Password history
        passwordHistory: [{
          password: hashedPassword,
          changedAt: new Date()
        }],
        
        passwordChangedAt: new Date(),
        loginAttempts: 0
      });
      
      await admin.save();
      
      console.log('\n✅ ADMIN CREATED SUCCESSFULLY!');
      console.log('=================================');
      console.log('📧 Email:', email);
      console.log('🔑 Password:', password);
      console.log('👤 Role: super_admin');
      console.log('🆔 ID:', admin._id);
      console.log('=================================\n');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

createAdmin();