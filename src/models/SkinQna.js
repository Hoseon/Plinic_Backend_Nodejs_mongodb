var mongoose = require('mongoose');

var skinqnaSchema = mongoose.Schema({
  category: {type:String},
  title: {type:String},
  body: {type:String},
  author: {type:mongoose.Schema.Types.ObjectId, ref:'user_admin'},
  views: {type:Number, default: 0},
  // comment: {type: String},
  // numId: {type:Number, required:true},
  // comments: [{
  //   body: {type:String},
  //   author: {type:mongoose.Schema.Types.ObjectId, ref:'user_admin'},
  //   createdAt: {type:Date, default:Date.now}
  // }],
  comments: [{
    email: String,
    comment: String,
    img_url: String,
    // body: {type:String, required:true},
    // author: {type:mongoose.Schema.Types.ObjectId, ref:'user_admin', required:true},
    createdAt: {type:Date, default:Date.now},
    updatedAt: {type: Date, default:Date.now},
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
  tags: String,
  editor: {type: Boolean, default: false},
  editorUpdateAt: Date,
  contents: String,
  like: {type:Number, default: 0},
  likeuser: {type:Array, default: ''},
});

skinqnaSchema.methods.getFormattedDate = function (date) {
  return date.getFullYear() + "-" + get2digits(date.getMonth()+1)+ "-" + get2digits(date.getDate());
};

skinqnaSchema.methods.getFormattedTime = function (date) {
  return get2digits(date.getHours()) + ":" + get2digits(date.getMinutes())+ ":" + get2digits(date.getSeconds());
};
function get2digits(num){
  return ("0" + num).slice(-2);
}
var SkinQna = mongoose.model('skinqna',skinqnaSchema);
module.exports = SkinQna;
