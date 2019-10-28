var mongoose = require('mongoose');

var commubeautycounterSchema = mongoose.Schema({
  name: {type:String, required:true},
  totalCount: {type:Number, required:true},
  todayCount: {type:Number},
  date: {type:String}
});

var CommuBeautyCounter = mongoose.model('commubeautyCounter',commubeautycounterSchema);
module.exports = CommuBeautyCounter;
