const mongoose = require('mongoose');

// Kết nối MongoDB
const mongoURI = 'mongodb+srv://luan11t90_db_user:mmbvl123456@cluster0.oaqzcwv.mongodb.net/kyc_pm';

const connectDB = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB Atlas (Database: kyc_pm)');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit nếu connect fail
  }
};

module.exports = {connectDB};