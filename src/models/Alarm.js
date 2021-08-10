var mongoose = require('mongoose');

var alarmSchema = mongoose.Schema({
  email: { type: String}, // 보내는 사람 이메일
  writerEmail: { type: String}, // 이메일
  alertType: { type: String}, // 경고 유형?
  alarmName : { type: String}, // 알람 이름
  alarmCondition : { type: String}, // 알람 상태
  alarmDesc: { type: String }, // 알람 내용
  mange: {type: Boolean, default: false}, // .
  createdAt: {type:Date, default:Date.now},
  updatedAt: Date,
  skinId: {type:String},
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
