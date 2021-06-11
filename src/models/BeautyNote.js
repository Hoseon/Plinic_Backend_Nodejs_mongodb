var mongoose = require('mongoose');

var beautynoteSchema = mongoose.Schema({
  title: {type:String,},
  body: {type:String},
  // author: {type:mongoose.Schema.Types.ObjectId, ref:'user_admin', required:true},
  views: {type:Number, default: 0},
  numId: {type:Number,},
  comments: [{
    email: String,
    comment: String,
    img_url: String,
    // body: {type:String, required:true},
    // author: {type:mongoose.Schema.Types.ObjectId, ref:'user_admin', required:true},
    createdAt: {type:Date, default:Date.now},
    updatedAt: {type: Date, default:Date.now},
    isDelete: {type: Boolean, default: false}, //true일 경우 삭제(가려짐)
    nameAdmin: {type: Boolean, default: true}, //관리자 페이지에서 쓰면 true로 넘겨서 이메일 대신 '관리자'로 보이게끔
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
  posturl: String,
  email: String,
  select: String,
  tags: String,
  contents : String,
  editor: {type: Boolean, default: false},
  editorUpdateAt: Date,
  like: {type:Number, default: 0},
  likeuser: {type:Array, default: ''},
  pushtoken: String,
});

beautynoteSchema.methods.getFormattedDate = function (date) {
  return date.getFullYear() + "-" + get2digits(date.getMonth()+1)+ "-" + get2digits(date.getDate());
};

beautynoteSchema.methods.getFormattedTime = function (date) {
  return get2digits(date.getHours()) + ":" + get2digits(date.getMinutes())+ ":" + get2digits(date.getSeconds());
};
function get2digits(num){
  return ("0" + num).slice(-2);
}
var BeautyNote = mongoose.model('beautynote',beautynoteSchema);
module.exports = BeautyNote;
