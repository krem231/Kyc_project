const mongoose = require("mongoose");

const wallet_schema=new mongoose.Schema({
  user_id:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User",
    required: true,
    unique:false
  },
  balance:{
    type: Number,
  default: 0
  },
  currency:{
    type: String,
  default: "vnd"
  },
  status:{
    type: String,
    enum:['active','inactive'],
    default:"active"
  },
  create_at:{
    type:Date,
  default: Date.now 
  },
});
const Wallet = mongoose.model("Wallet", wallet_schema);
module.exports = Wallet