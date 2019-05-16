var mongoose = require('mongoose');

var counterSchema = mongoose.Schema({
  name: {type:String, required:true},
  totalCount: {type:Number, required:true},
  todayCount: {type:Number},
  date: {type:String}
});

var CarezoneCounter = mongoose.model('carezonecounter',counterSchema);
module.exports = CarezoneCounter;
