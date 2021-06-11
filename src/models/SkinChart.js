var mongoose = require('mongoose');

var skinChartSchema = mongoose.Schema({
  category: {type:String},
  title: {type:String},
  body: {type:String},
  views: {type:Number, default: 0},
  // comment: {type: String},
  // numId: {type:Number, required:true},
  comments: [{
    body: {type:String},
    author: {type:mongoose.Schema.Types.ObjectId, ref:'user_admin'},
    createdAt: {type:Date, default:Date.now},
    isDelete: {type: Boolean, default: false}, //true일 경우 삭제(가려짐)
    nameAdmin: {type: Boolean, default: true}, //관리자 페이지에서 쓰면 true로 넘겨서 이메일 대신 '관리자'로 보이게끔
  }],
  createdAt: {type:Date, default:Date.now},
  updatedAt: Date,
  desc: String,
  created: { type: Date, default: Date.now },
  email: String,
  // score: String,
  score: [{
    moisture: {type:String},
    oil: {type:String},
    saveDate: {type:Date}
  }],
});

skinChartSchema.methods.getFormattedDate = function (date) {
  return date.getFullYear() + "-" + get2digits(date.getMonth()+1)+ "-" + get2digits(date.getDate());
};

skinChartSchema.methods.getFormattedTime = function (date) {
  return get2digits(date.getHours()) + ":" + get2digits(date.getMinutes())+ ":" + get2digits(date.getSeconds());
};
function get2digits(num){
  return ("0" + num).slice(-2);
}
var SkinChart = mongoose.model('skinchart',skinChartSchema);
module.exports = SkinChart;
