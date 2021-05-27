var mongoose = require('mongoose');

var alarmSchema = mongoose.Schema({
  alertType: { type: String},
  alarmName : { type: String},
  alarmCondition : { type: String},
  alarmDesc: { type: String },
  mange: {type: Boolean, default: false},
  createdAt: {type:Date, default:Date.now},
  updatedAt: Date,
});

alarmSchema.methods.getFormattedDate = function (date) {
  return date.getFullYear() + "-" + get2digits(date.getMonth()+1)+ "-" + get2digits(date.getDate());
};

alarmSchema.methods.getFormattedTime = function (date) {
  return get2digits(date.getHours()) + ":" + get2digits(date.getMinutes())+ ":" + get2digits(date.getSeconds());
};
function get2digits(num){
  return ("0" + num).slice(-2);
}
var Alarm = mongoose.model('alarm',alarmSchema);
module.exports = Alarm;
