var mongoose = require('mongoose');

var noticeSchema = mongoose.Schema({
  // category: {type:String, required:true},
  title: {type:String, required:true},
  body: {type:String, required:true},
  author: {type:mongoose.Schema.Types.ObjectId, ref:'user_admin', required:true},
  views: {type:Number, default: 0},
  numId: {type:Number, required:true},
  comments: [{
    body: {type:String, required:true},
    // author: {type:mongoose.Schema.Types.ObjectId, ref:'user_admin', required:true},
    createdAt: {type:Date, default:Date.now},
    updatedAt: {type: Date, default:Date.now},
    email: String,
    comment: String,
    img_url: String,
    title: String,
    name: String,
    pushtoken: String,
    isDelete: {type: Boolean, default: false},
    recomments: [{ //대댓글
      body: {type:String},
      email: {type:String},
      parent_id: {type:String},
      createdAt: {type:Date, default:Date.now},
      isDelete: {type: Boolean, default: false},
    }],
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
  notice: String,

});

noticeSchema.methods.getFormattedDate = function (date) {
  return date.getFullYear() + "-" + get2digits(date.getMonth()+1)+ "-" + get2digits(date.getDate());
};

noticeSchema.methods.getFormattedTime = function (date) {
  return get2digits(date.getHours()) + ":" + get2digits(date.getMinutes())+ ":" + get2digits(date.getSeconds());
};

noticeSchema.methods.isEmpty = function (str) {
  if(typeof str == "undefined" || str == null || str == "")
      return true;
  else
      return false ;
};

noticeSchema.methods.nvl = function (str, defaultStr) {
  if(typeof str == "undefined" || str == null || str == "")
      str = defaultStr ;
   
  return str ;
};

function get2digits(num){
  return ("0" + num).slice(-2);
}
var Notice = mongoose.model('notice',noticeSchema);
module.exports = Notice;
