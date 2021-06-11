var mongoose = require('mongoose');

var commubeautySchema = mongoose.Schema({
  // title: {type:String, required:true},
  body: {type:String, required:true},
  author: {type:mongoose.Schema.Types.ObjectId, ref:'user_admin', required:true},
  views: {type:Number, default: 0},
  numId: {type:Number, required:true},
  comments: [{
    body: {type:String, required:true},
    author: {type:mongoose.Schema.Types.ObjectId, ref:'user_admin', required:true},
    createdAt: {type:Date, default:Date.now},
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
  editor: {type: Boolean, default: false},
  editorUpdateAt: Date,
  like: {type:Number, default: 0},
  likeuser: {type:Array, default: ''},
  midtext: String,
  showLocation: [{
    home: {type: Boolean, default: false}, //메인 홈
    poreSize: {type: Boolean, default: false}, //모공크기
    poreCount: {type: Boolean, default: false}, //모공수
    skinTone: {type: Boolean, default: false}, //피부톤
    clean : {type: Boolean, default: false}, //클린지수
    munjin: {type: Boolean, default: false}, //생활문진
    editor: {type: Boolean, default: false}, //에디터추천
  }],
  tabLocation: [{ // 탭명 노출
    tip: {type: Boolean, default: false},
    hit: {type: Boolean, default: false},
    new: {type: Boolean, default: false},
  }],
  visible: {type: Boolean, default: true}, //활성화
  seq: {type: Number, default: 99}, //활성화
});

commubeautySchema.methods.getFormattedDate = function (date) {
  return date.getFullYear() + "-" + get2digits(date.getMonth()+1)+ "-" + get2digits(date.getDate());
};

commubeautySchema.methods.getFormattedTime = function (date) {
  return get2digits(date.getHours()) + ":" + get2digits(date.getMinutes())+ ":" + get2digits(date.getSeconds());
};

commubeautySchema.methods.getFormattedTime = function (date) {
  return get2digits(date.getHours()) + ":" + get2digits(date.getMinutes())+ ":" + get2digits(date.getSeconds());
};

commubeautySchema.methods.isEmpty = function (str) {
  if(typeof str == "undefined" || str == null || str == "")
      return true;
  else
      return false ;
};

commubeautySchema.methods.nvl = function (str, defaultStr) {
  if(typeof str == "undefined" || str == null || str == "")
      str = defaultStr ;
   
  return str ;
};

function get2digits(num){
  return ("0" + num).slice(-2);
}

var CommuBeauty = mongoose.model('commubeauty',commubeautySchema);
module.exports = CommuBeauty;
