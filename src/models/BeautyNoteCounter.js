var mongoose = require('mongoose');

var beautynotecounterSchema = mongoose.Schema({
  name: {type:String, required:true},
  totalCount: {type:Number, required:true},
  todayCount: {type:Number},
  date: {type:String}
});

var BeautyNoteCounter = mongoose.model('beautynoteCounter',beautynotecounterSchema);
module.exports = BeautyNoteCounter;
