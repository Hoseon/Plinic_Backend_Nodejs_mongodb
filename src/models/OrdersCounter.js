var mongoose = require('mongoose');

var counterSchema = mongoose.Schema({
  name: {type:String, required:true},
  totalCount: {type:Number, required:true},
  todayCount: {type:Number},
  date: {type:String}
});

var OrdersCounter = mongoose.model('orderscounter',counterSchema);
module.exports = OrdersCounter;
