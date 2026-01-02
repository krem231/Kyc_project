
const express = require('express');
const {createFundController,getFundsController} = require('../controllers/fundController');
const auth = require('../middleware/auth');

const router = express.Router();
router.post('/funds',auth,createFundController);
router.get('/funds',auth,getFundsController);
module.exports=router;