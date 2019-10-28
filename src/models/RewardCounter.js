var mongoose = require('mongoose');

var counterSchema = mongoose.Schema({
  name: {type:String, required:true},
  totalCount: {type:Number, required:true},
  todayCount: {type:Number},
  date: {type:String}
});

var RewardCounter = mongoose.model('rewardcounter',counterSchema);
module.exports = RewardCounter;
