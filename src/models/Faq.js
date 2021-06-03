var mongoose = require('mongoose');

var faqSchema = mongoose.Schema({
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
    createdAt: {type:Date, default:Date.now},
    isDelete: {type: Boolean, default: false},
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
  faq: String,
  pushtoken: String,
});

faqSchema.methods.getFormattedDate = function (date) {
  return date.getFullYear() + "-" + get2digits(date.getMonth()+1)+ "-" + get2digits(date.getDate());
};

faqSchema.methods.getFormattedTime = function (date) {
  return get2digits(date.getHours()) + ":" + get2digits(date.getMinutes())+ ":" + get2digits(date.getSeconds());
};
function get2digits(num){
  return ("0" + num).slice(-2);
}
var Faq = mongoose.model('faq',faqSchema);
module.exports = Faq;
