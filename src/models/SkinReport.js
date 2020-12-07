var mongoose = require('mongoose');

var skinReportSchema = mongoose.Schema({
  email: {type:String, required:true}, //출석체크 등록 email
  skinreport: [{
    isreport: {type: Boolean, default:false},
    updatedAt: {type:Date},
  }],
  createdAt: {type:Date, default:Date.now}, //최초 등록 날짜
  updatedAt: Date, //마지막 출석체크 날짜(업데이트 날짜)
});

skinReportSchema.methods.getFormattedDate = function (date) {
  return date.getFullYear() + "-" + get2digits(date.getMonth()+1)+ "-" + get2digits(date.getDate());
};

skinReportSchema.methods.getFormattedTime = function (date) {
  return get2digits(date.getHours()) + ":" + get2digits(date.getMinutes())+ ":" + get2digits(date.getSeconds());
};
function get2digits(num){
  return ("0" + num).slice(-2);
}
var SkinReport = mongoose.model('skinreport',skinReportSchema);
module.exports = SkinReport;
