var mongoose = require('mongoose');

var qnaSchema = mongoose.Schema({
  category: {type:String},
  title: {type:String},
  body: {type:String},
  author: {type:mongoose.Schema.Types.ObjectId, ref:'user_admin'},
  views: {type:Number, default: 0},
  // comment: {type: String},
  // numId: {type:Number, required:true},
  comments: [{
    body: {type:String},
    author: {type:mongoose.Schema.Types.ObjectId, ref:'user_admin'},
    createdAt: {type:Date, default:Date.now}
  }],
  createdAt: {type:Date, default:Date.now},
  updatedAt: Date,
  //이미지관리
  filename: String,
  originalName: String,
  desc: String,
  created: { type: Date, default: Date.now },
  missontitle : String,
  missonsubtitle: String,
  product: String,
  endmission: Date,
  prodfilename: String,
  prodoriginalname: String,
  proddesc: String,
  email: String,
  select: String,
  qna: String,
});

qnaSchema.methods.getFormattedDate = function (date) {
  return date.getFullYear() + "-" + get2digits(date.getMonth()+1)+ "-" + get2digits(date.getDate());
};

qnaSchema.methods.getFormattedTime = function (date) {
  return get2digits(date.getHours()) + ":" + get2digits(date.getMinutes())+ ":" + get2digits(date.getSeconds());
};
function get2digits(num){
  return ("0" + num).slice(-2);
}
var Qna = mongoose.model('qna',qnaSchema);
module.exports = Qna;
