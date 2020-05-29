var mongoose = require('mongoose');

var productSchema = mongoose.Schema({
  title: {type:String, required:true}, //제품명
  jejosa: {type:String, required:true},//제조사
  brand: {type:String, required:true},//브랜드
  daebunryu: {type:String, required:true},//대분류
  sobunryu: {type:String, required:true},//소분류
  sungbunno: {type:String, required:true},//성분 No
  mainfunction: {type:String, required:true},//주요 기능
  sungbun: {type:String, required:true},//성분
  sungbuneng: {type:String, required:true},//성분(영문명)
  gineung: {type:String, required:true},//기능
  body: {type:String, required:true},
  author: {type:mongoose.Schema.Types.ObjectId, ref:'user_admin', required:true},
  views: {type:Number, default: 0},
  numId: {type:Number, required:true},
  comments: [{
    body: {type:String, required:true},
    author: {type:mongoose.Schema.Types.ObjectId, ref:'user_admin', required:true},
    createdAt: {type:Date, default:Date.now}
  }],
  createdAt: {type:Date, default:Date.now},
  updatedAt: Date,
  //이미지관리
  filename: String,
  originalName: String,
  desc: String,
  created: { type: Date, default: Date.now },
  url: String, //스마트스토어 URL
});

productSchema.methods.getFormattedDate = function (date) {
  return date.getFullYear() + "-" + get2digits(date.getMonth()+1)+ "-" + get2digits(date.getDate());
};

productSchema.methods.getFormattedTime = function (date) {
  return get2digits(date.getHours()) + ":" + get2digits(date.getMinutes())+ ":" + get2digits(date.getSeconds());
};
function get2digits(num){
  return ("0" + num).slice(-2);
}
var Product = mongoose.model('product',productSchema);
module.exports = Product;
