var mongoose = require('mongoose');

var tagsSchema = mongoose.Schema({
  // title: {type:String, required:true},
  body: {type:String},
  // author: {type:mongoose.Schema.Types.ObjectId, ref:'user_admin', required:true},
  views: {type:Number, default: 0},
  // numId: {type:Number, required:true},
  createdAt: {type:Date, default:Date.now},
  updatedAt: Date,
  //태그 관리 총집합
  tags: String,
});

tagsSchema.methods.getFormattedDate = function (date) {
  return date.getFullYear() + "-" + get2digits(date.getMonth()+1)+ "-" + get2digits(date.getDate());
};

tagsSchema.methods.getFormattedTime = function (date) {
  return get2digits(date.getHours()) + ":" + get2digits(date.getMinutes())+ ":" + get2digits(date.getSeconds());
};
function get2digits(num){
  return ("0" + num).slice(-2);
}
var Tags = mongoose.model('tags',tagsSchema);
module.exports = Tags;
