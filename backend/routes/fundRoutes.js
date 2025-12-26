
const express = require('express');
const {createFundController} = require('../controllers/fundController');
const auth = require('../middleware/auth');

const router = express.Router();
router.post('/funds',auth,createFundController)
module.exports=router;