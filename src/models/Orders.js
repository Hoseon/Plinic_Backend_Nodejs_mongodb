var mongoose = require('mongoose');

var orderSchema = mongoose.Schema({
  author: {type:mongoose.Schema.Types.ObjectId, ref:'User', required:true},
  email: { type: String, required: true },
  paid_at: { type: Date }, //주문일
  started_at : { type: Date }, //결제 시작시각
  imp_uid: { type: String },  //주문번호
  status: { type: String}, //주문상태
  name: { type: String}, //상품명
  productCount: { type: Number }, //수량
  deliverCompany: { type: String },//택배사
  deliverNo : { type: Number }, //운송장번호
  pay_method: { type: String }, //결제방법
  card_code: { type: String },
  card_name: { type: String },
  card_number: { type: String },
  card_quota: { type: Number },
  card_type: { type: Number },
  currency: { type: String },
  amount: { type: Number }, //결제금액
  usePoint: { type: Number },//포인트사용
  buyer_name: { type: String }, //주문자
  buyer_email: { type: String }, //주문자 email
  buyer_tel: { type: String }, //휴대폰
  buyer_postcode: { type: String },//우편번호
  buyer_addr: { type: String },//주소
  cancel_amount: { type: String }, //취소금액
  receipt_url: { type: String },
  cancel_history: [{
    pg_tid: String,
    amount: Number,
    cancelled_at: Date,
    reason: String,
    receipt_url: String
  }],
  change_history: [{
    // pg_tid: String,
    // amount: Number,
    email: String,
    request_at: Date,
    reasonDesc: String,
    reasonType: String,
    // receipt_url: String
  }],
  return_history: [{
    // pg_tid: String,
    // amount: Number,
    email: String,
    request_at: Date,
    reasonDesc: String,
    reasonType: String,
    // receipt_url: String
  }],
  cancel_history: [{
    // pg_tid: String,
    // amount: Number,
    email: String,
    request_at: Date,
    reasonDesc: String,
    reasonType: String,
    // receipt_url: String
  }],
  cancel_reason: String, //취소사유
  cancel_receipt_urls: String, //취소영수증
  cancelled_at: String, //취소시간/일
  createdAt: {type:Date, default:Date.now},
  updatedAt: {type:Date, default:Date.now},
  vbank_code: { type: String },
  vbank_date: { type: String },
  vbank_holder: { type: String }, //입금자명
  vbank_issued_at: { type: String },
  vbank_name: { type: String }, //입금 은행이름
  vbank_num: { type: String }, //입금 계좌번호
  product_name: { type: String }, //상품명
  product_num: { type: String }, //상품 번호
  productFileName: { type: String }, //상품 이미지
  invoiceNo: {type: String},
});

orderSchema.methods.getFormattedDate = function (date) {
  return date.getFullYear() + "-" + get2digits(date.getMonth()+1)+ "-" + get2digits(date.getDate());
};

orderSchema.methods.getFormattedTime = function (date) {
  return get2digits(date.getHours()) + ":" + get2digits(date.getMinutes())+ ":" + get2digits(date.getSeconds());
};
function get2digits(num){
  return ("0" + num).slice(-2);
}
var Orders = mongoose.model('orders',orderSchema);
module.exports = Orders;
