const express = require('express');
const authMiddleware = require('../../middlewares/auth');
const userController = require('../../controllers/admin/customer.controller');
const { register, login, verifyOTP, resendOTP } = require('../../controllers/userController');
const { verifyRecaptcha } = require('../../middlewares/recaptcha.middleware');

const router = express.Router();

// Public routes
router.post('/register', verifyRecaptcha, register);
router.post('/login', verifyRecaptcha, login);
router.post('/verify-otp', verifyOTP);  // Xác thực OTP
router.post('/resend-otp', resendOTP);  // Gửi lại OTP

// Admin routes
router.use(authMiddleware);

router.get('/', userController.getAllUsers); 
router.post('/', userController.addUser); 
router.put('/:id', userController.updateUser); 
router.delete('/:id', userController.deleteUser); 
router.put('/ban/:id', userController.banUser); 
router.put('/unban/:id', userController.unbanUser); 

module.exports = router;