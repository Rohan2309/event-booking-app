const mongoose = require('mongoose');
const PaymentSchema = new mongoose.Schema({
  booking:{type:mongoose.Schema.Types.ObjectId, ref:'Booking', required:true},
  amount:{type:Number, required:true},
  method:{type:String, enum:['card','upi','wallet','cash','mock'], default:'mock'},
  status:{type:String, enum:['pending','completed','failed'], default:'pending'},
  txRef:{type:String}
},{timestamps:true});
module.exports = mongoose.model('Payment', PaymentSchema);
