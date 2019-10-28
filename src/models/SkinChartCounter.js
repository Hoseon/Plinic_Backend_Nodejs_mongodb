var mongoose = require('mongoose');

var skinChartcounterSchema = mongoose.Schema({
  name: {type:String, required:true},
  totalCount: {type:Number, required:true},
  todayCount: {type:Number},
  date: {type:String}
});

var SkinChartCounter = mongoose.model('skinchartcounter',skinChartcounterSchema);
module.exports = SkinChartCounter;
