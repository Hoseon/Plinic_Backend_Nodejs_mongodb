var mongoose = require('mongoose');

var skincounterSchema = mongoose.Schema({
  name: {type:String, required:true},
  totalCount: {type:Number, required:true},
  todayCount: {type:Number},
  date: {type:String}
});

var SkinQnaCounter = mongoose.model('skinqnacounter',skincounterSchema);
module.exports = SkinQnaCounter;
