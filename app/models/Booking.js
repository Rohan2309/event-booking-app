const { required } = require('joi');
const mongoose = require('mongoose');
const BookingSchema = new mongoose.Schema({
  user:{type:mongoose.Schema.Types.ObjectId, ref:'User', required:true},
  event:{type:mongoose.Schema.Types.ObjectId, ref:'Event', required:true},
  tickets:{type:Number, default:1},
  status:{type:String, enum:['pending','confirmed','cancelled'], default:'pending'},
  totalAmount:{type:Number, required:true}
},{timestamps:true});
module.exports = mongoose.model('Booking', BookingSchema);
