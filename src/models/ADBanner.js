var mongoose = require('mongoose');

var adBannerSchema = mongoose.Schema({
  title: {type:String, required:true},
  body: {type:String},
  twoBody: {type:String},
  ThreeBody: {type:String},
  author: {type:mongoose.Schema.Types.ObjectId, ref:'user_admin', required:true},
  // views: {type:Number, default: 0},
  // numId: {type:Number, required:true},
  // comments: [{
  //   body: {type:String, required:true},
  //   author: {type:mongoose.Schema.Types.ObjectId, ref:'user_admin', required:true},
  //   createdAt: {type:Date, default:Date.now}
  // }],
  homePopup: {type: Boolean, default: false},
  createdAt: {type:Date, default:Date.now},
  updatedAt: Date,
  //이미지관리
  filename: String,
  originalName: String,

  twoFileName: String,
  twoOriginalName: String,

  threeFileName: String,
  threeOriginalName: String,
  //상품 URL
  url: String, 
  twoUrl: String,
  threeUrl: String,
});

adBannerSchema.methods.getFormattedDate = function (date) {
  return date.getFullYear() + "-" + get2digits(date.getMonth()+1)+ "-" + get2digits(date.getDate());
};

adBannerSchema.methods.getFormattedTime = function (date) {
  return get2digits(date.getHours()) + ":" + get2digits(date.getMinutes())+ ":" + get2digits(date.getSeconds());
};
function get2digits(num){
  return ("0" + num).slice(-2);
}
var ADBanner = mongoose.model('adBanner',adBannerSchema);
module.exports = ADBanner;
