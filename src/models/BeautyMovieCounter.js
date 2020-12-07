var mongoose = require('mongoose');

var beautyMoviecounterSchema = mongoose.Schema({
  name: {type:String, required:true},
  totalCount: {type:Number, required:true},
  todayCount: {type:Number},
  date: {type:String}
});

var BeautyMovieCounter = mongoose.model('beautyMovieCounter',beautyMoviecounterSchema);
module.exports = BeautyMovieCounter;
