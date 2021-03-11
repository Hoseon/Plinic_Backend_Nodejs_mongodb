var mongoose = require('mongoose');

var productsReviewSchema = mongoose.Schema({
  email: {type:String, required:true}, //출석체크 등록 email
  content: {type: String}, //리뷰내용
  rating: {type: Number}, //별점수
  product_num: { type: String }, //Product ID와 매칭
  product_name: {type: String}, //최초 등록 날짜
  createdAt: {type:Date, default:Date.now}, //최초 등록 날짜
  updatedAt: Date, //마지막 출석체크 날짜(업데이트 날짜)
});

productsReviewSchema.methods.getFormattedDate = function (date) {
  return date.getFullYear() + "-" + get2digits(date.getMonth()+1)+ "-" + get2digits(date.getDate());
};

productsReviewSchema.methods.getFormattedTime = function (date) {
  return get2digits(date.getHours()) + ":" + get2digits(date.getMinutes())+ ":" + get2digits(date.getSeconds());
};
function get2digits(num){
  return ("0" + num).slice(-2);
}
var ProductsReview = mongoose.model('productsreview',productsReviewSchema);
module.exports = ProductsReview;
