var mongoose = require('mongoose');

var addressSchema = mongoose.Schema({
  email: { type: String, required: true },
  paid_at: { type: String}, //주문일
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
  cancel_reason: String, //취소사유
  cancel_receipt_urls: String, //취소영수증
  cancelled_at: String, //취소시간/일
  createdAt: {type:Date, default:Date.now},
  updatedAt: Date,
  vbank_code: { type: String },
  vbank_date: { type: String },
  vbank_holder: { type: String },
  vbank_issued_at: { type: String },
  vbank_name: { type: String },
  vbank_num: { type: String },

});

addressSchema.methods.getFormattedDate = function (date) {
  return date.getFullYear() + "-" + get2digits(date.getMonth()+1)+ "-" + get2digits(date.getDate());
};

addressSchema.methods.getFormattedTime = function (date) {
  return get2digits(date.getHours()) + ":" + get2digits(date.getMinutes())+ ":" + get2digits(date.getSeconds());
};
function get2digits(num){
  return ("0" + num).slice(-2);
}
var Adress = mongoose.model('address',addressSchema);
module.exports = Adress;
