var mongoose = require('mongoose');

var counterSchema = mongoose.Schema({
  name: {type:String, required:true},
  totalCount: {type:Number, required:true},
  todayCount: {type:Number},
  date: {type:String}
});

var NoticeCounter = mongoose.model('noticecounter',counterSchema);
module.exports = NoticeCounter;
