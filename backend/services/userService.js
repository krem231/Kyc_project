const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Import từ models
const registerUser=require('./regis');
const loginUser= require('./login');

module.exports = { registerUser, loginUser };