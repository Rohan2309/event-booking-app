const mongoose = require('mongoose');
const EventSchema = new mongoose.Schema({
  title:{type:String, required:true},
  slug:{type:String, lowercase:true},
  description:{type:String},
  category:{type:mongoose.Schema.Types.ObjectId, ref:'Category'},
  location:{type:String},
  date:{type:Date},
  price:{type:Number, default:0},
  capacity:{type:Number, default:0},
  image:{type:String},
  createdBy:{type:mongoose.Schema.Types.ObjectId, ref:'User'}
},{timestamps:true});
module.exports = mongoose.model('Event', EventSchema);
