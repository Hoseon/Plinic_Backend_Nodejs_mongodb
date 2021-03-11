var mongoose = require('mongoose');

var productSchema = mongoose.Schema({
  // title: {type:String, required:true}, //제품명
  // jejosa: {type:String, required:true},//제조사
  // brand: {type:String, required:true},//브랜드
  body: {type:String},
  author: {type:mongoose.Schema.Types.ObjectId, ref:'user_admin', required:true},
  views: {type:Number, default: 0},
  numId: {type:Number, required:true},
  // ---- 20200707 크롤링 데이터 활용
  product_num: {type:String, required:true}, //상품주문코드
  madein: String, //원산지
  brand_name: String, // 제조사
  big_category: String, //대분류
  small_category: String, //소분류
  product_name: String, //상품명
  seller: String, //
  color_type: String, //색상 타입
  function: String, //주요 효능
  ingredient: [{ //전성분
    korean_name: {type:String, required:true},
    english_name: {type:String, required:true},
    ewg_level: {type:String, required:true},
    purpose: {type:String, required:true},
  }],
  image_url: String,
  weight: String, //용량 및 중량
  price: String, //소비자가
  createdAt: {type:Date, defaut:Date.now},
  updatedAt: Date,
  comments: [{
    body: {type:String, required:true},
    author: {type:mongoose.Schema.Types.ObjectId, ref:'user_admin', required:true},
    createdAt: {type:Date, default:Date.now}
  }],
  tab: String, //탭명
  payment: String, //결제수단
  Amount: {type:Number, default:0},//판매가격
  saleAmount: {type:Number, default:0},//할인율
  maxPercent: Number,//최대사용가능 포인트
  outofStock: {type:Boolean, default: false}, //상품 품절
  noPublic: {type:Boolean, default: false}, //상품 비공개
  destination: {type:Boolean, default: false}, //배송지 입력
  destinationType: { type: Boolean, default: false }, //배송비 유형
  filename: String, //대표이미지
  originaFileName: String, //대표이미지
  productFileName: String, //상품이미지
  productOriginalName: String, //상품이지미 원본파일명
  detailImageName: String, //상품 상세이미지
  detailImageOriginalName: String, //상품 상세이미지
  announcementFileName: String, //상품 고시정보 이미지
  announcementOriginalFileName: String, //상품 고시정보 이미지
  productDesc: String, //상품설명
  returnDesc: String, //교환 및 반품
  showLocation: [{
    home: {type: Boolean, default: false},
    poreSize: {type: Boolean, default: false},
    poreCount: {type: Boolean, default: false},
    skinTone: {type: Boolean, default: false},
    clean: {type: Boolean, default: false},
    munjin: {type: Boolean, default: false},
  }],
  tabName: String,
  isPlinic: { type: Boolean, default: false }, //글로우픽 데이터가 아닌 플리닉 관리자에 의해 등록된 자료
  likeCount: {type:Number, default: 0},
  likeUser: [
    {
      email: String,
      createdAt : {type:Date, default:Date.now}
    }
  ]
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
