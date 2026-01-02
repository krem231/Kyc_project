const express = require('express');
const auth = require('../middleware/auth');
const web3Controller=require('../controllers/web3Controller')
const router = express.Router();


router.get('/web3/test', auth,web3Controller.web3Status);
module.exports=router;