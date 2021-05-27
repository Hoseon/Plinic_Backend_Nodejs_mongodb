var mongoose = require("mongoose");

var pointSettingSchema = mongoose.Schema({
  pointAt: String, // 포인트 적립 내용
  createAt: { type: Date, default: Date.now }, // 생성일
  updateAt: { type: Date }, // 변경일
  usePoint: {type:Boolean, default: false}, // 포인트 사용여부 사용/미사용
  point: Number, // 적립 포인트
  daylimit: Number // 1일 최대 적립횟수
});

pointSettingSchema.methods.getFormattedDate = function(date) {
  return ( date.getFullYear() + "-" + get2digits(date.getMonth() + 1) + "-" + get2digits(date.getDate()));
};

pointSettingSchema.methods.getFormattedTime = function(date) {
  return ( get2digits(date.getHours()) + ":" + get2digits(date.getMinutes()) + ":" + get2digits(date.getSeconds()));
};

function get2digits(num) {
  return ("0" + num).slice(-2);
}
var PointSetting = mongoose.model("pointSetting", pointSettingSchema);
module.exports = PointSetting;
