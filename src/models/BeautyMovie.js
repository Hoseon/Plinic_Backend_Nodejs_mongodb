var mongoose = require('mongoose');

var beautyMovieSchema = mongoose.Schema({
  title: {type:String, required:false},
  body: {type:String, required:true},
  author: {type:mongoose.Schema.Types.ObjectId, ref:'user_admin', required:true},
  views: {type:Number, default: 0},
  numId: {type:Number, required:true},
  comments: [{
    email: {type:String},
    body: {type:String},
    createdAt: {type:Date, default:Date.now},
    recomments: [{ //대댓글
      body: {type:String},
      email: {type:String},
      parent_id: {type:String},
      createdAt: {type:Date, default:Date.now}
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
  posturl: String,
  posturlId: String,
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
    tip: {type: Boolean, default: false}, //핫클립
    hit: {type: Boolean, default: false}, //플리닉
    new: {type: Boolean, default: false}, //봐야해
  }],
  visible: { type: Boolean, default: true }, //활성화
  seq : { type: Number, default: 1},
});

beautyMovieSchema.methods.getFormattedDate = function (date) {
  return date.getFullYear() + "-" + get2digits(date.getMonth()+1)+ "-" + get2digits(date.getDate());
};

beautyMovieSchema.methods.getFormattedTime = function (date) {
  return get2digits(date.getHours()) + ":" + get2digits(date.getMinutes())+ ":" + get2digits(date.getSeconds());
};
function get2digits(num){
  return ("0" + num).slice(-2);
}

beautyMovieSchema.methods.isEmpty = function (str) {
  if(typeof str == "undefined" || str == null || str == "")
      return true;
  else
      return false ;
};

beautyMovieSchema.methods.nvl = function (str, defaultStr) {
  if(typeof str == "undefined" || str == null || str == "")
      str = defaultStr ;
   
  return str ;
};

var BeautyMovie = mongoose.model('beautyMovie',beautyMovieSchema);
module.exports = BeautyMovie;
