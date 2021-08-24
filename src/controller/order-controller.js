var PointLog = require("../models/PointLog");
var Orders = require("../models/Orders");
var jwt = require("jsonwebtoken");
var bcrypt = require("bcrypt-nodejs");
var config = require("../config/config");
var passport = require("passport");
var KakaoStrategy = require("passport-kakao").Strategy;
var http = require("http");
var request = require("request");
var axios = require("axios");
const AWS = require("aws-sdk");
AWS.config.loadFromPath(__dirname + "/config/awsconfig.json");

exports.setUserOrders = (req, res) => {
  //사용자 포인트 차감 저장 로직
  if (!req.body.orderinfo.buyer_email) {
    res.status(400).json();
  }
  var date = new Date(req.body.orderinfo.paid_at * 999.9799415);  //유닉스 TimeStamp to UDT로 변경 --> 그 후 ejs에서는 KST로 변경하여 사용
  var started_date = new Date(req.body.orderinfo.started_at * 999.9799415);
  req.body.orderinfo.paid_at = date;
  req.body.orderinfo.started_at = started_date;

 
  Orders.create(req.body.orderinfo, function(err, post) {
    if (err)
      res.status(400).json(err);

    if (post) {
      res.status(200).json(post);
    } else {
      res.status(400).json();
    }
  });
};

exports.UpdateChangeOrders = (req, res) => { //사용자 교환요청 처리
  //사용자 포인트 차감 저장 로직
  if (!req.body.reasonType && !req.body.reasonDesc && !req.body.email) {
    res.status(400).json();
  }
 
  Orders.findOneAndUpdate({
    _id: req.body.id
  }, {
      $push: {
        change_history : req.body
      },
      $set: {
        status: 'swap_request',
        updatedAt: Date.now()
      },
  }, function (err, post) {
    if (err) {
      console.log("사용자 교환 요청 처리 에러 1 : " + req.body.email);
      res.status(400).json(err);
    }
      
    if (post) {
      res.status(200).json(post);
    } else {
      console.log("사용자 교환 요청 처리 에러 2 : " + req.body.email);
      res.status(400).json();
    }
  });
};

exports.UpdateReturnOrders = (req, res) => { //사용자 반품요청 처리
  //사용자 포인트 차감 저장 로직
  if (!req.body.reasonType && !req.body.reasonDesc && !req.body.email) {
    res.status(400).json();
  }
 
  Orders.findOneAndUpdate({
    _id: req.body.id
  }, {
      $push: {
        return_history : req.body
      },
      $set: {
        status: 'return_request',
        updatedAt: Date.now()
      },
  }, function (err, post) {
    if (err) {
      console.log("사용자 반품 요청 처리 에러 1 : " + req.body.email);
      res.status(400).json(err);
    }
      
    if (post) {
      res.status(200).json(post);
    } else {
      console.log("사용자 반품 요청 처리 에러 2 : " + req.body.email);
      res.status(400).json();
    }
  });
};

exports.UpdateCancelOrders = (req, res) => { //사용자 취소요청 처리
  //사용자 포인트 차감 저장 로직
  if (!req.body.reasonType && !req.body.reasonDesc && !req.body.email) {
    res.status(400).json();
  }
 
  Orders.findOneAndUpdate({
    _id: req.body.id
  }, {
      $push: {
        cancel_history : req.body
      },
      $set: {
        status: 'cencel_request',
        updatedAt: Date.now()
      },
  }, function (err, post) {
    if (err) {
      console.log("사용자 취소 요청 처리 에러 1 : " + req.body.email);
      res.status(400).json(err);
    }
      
    if (post) {
      res.status(200).json(post);
    } else {
      console.log("사용자 취소 요청 처리 에러 2 : " + req.body.email);
      res.status(400).json();
    }
  });
};

exports.UpdateCompletedOrders = (req, res) => { //사용자 취소요청 처리
  //사용자 포인트 차감 저장 로직
  if (!req.body.id && !req.body.email) {
    res.status(400).json();
  }
 
  Orders.findOneAndUpdate({
    _id: req.body.id
  }, {
      $set: {
        status: 'deliver_completed',
        updatedAt: Date.now()
      },
  }, function (err, post) {
    if (err) {
      console.log("사용자 구매 확정 처리 에러 1 : " + req.body.email);
      res.status(400).json(err);
    }
      
    if (post) {
      res.status(200).json(post);
    } else {
      console.log("사용자 구매 확정 처리 에러 2 : " + req.body.email);
      res.status(400).json();
    }
  });
};

exports.getUserOrders = (req, res) => {
  //사용자 포인트 차감 저장 로직
  if (!req.params.email) {
    res.status(400).json();
  }

  Orders.find({
    email : req.params.email
  }, (err, result) => {
      if (err) {
        console.log("사용자 오더 정보 조회 실패 : " + req.params.email);
        res.status(400).json(err);
      }

      if (result) {
        res.status(200).json(result);
      } else {
        console.log("사용자 오더 정보 조회 실패2 : " + req.params.email);
        res.status(400).json(err);
      }
  }) 
};

exports.getUserOrdersTrackingInfo = (req, res) => {
  // console.log(req.params.email);
  // console.log(req.params.t_invoice);
  var request = require('request'); 

  var url = 'http://info.sweettracker.co.kr/api/v1/trackingInfo';
  var queryParams = '?' + encodeURIComponent('t_key') + '=XnVEEK1m0nYcjNF3Vp8uTQ'; /* Service Key*/
  queryParams += '&' + encodeURIComponent('t_code') + '=' + encodeURIComponent('04'); /* 한 페이지 결과 수 */
  queryParams += '&' + encodeURIComponent('t_invoice') + '=' + encodeURIComponent(req.params.t_invoice); /* 한 페이지 결과 수 */

  request({ 
    url: url + queryParams,
    method: 'GET'
  }, function (error, response, body) {
    if (error) {
      console.log("배송 정보 가져 오기 실패1 : " + req.params.email);
      console.log("배송 정보 가져 오기 실패2 : " + req.params.t_invoice);
      res.status(400).json(error);
    }
    // console.log('Status', response.statusCode);
    // console.log('Headers', JSON.stringify(response.headers));
    // console.log('Reponse received', body);
      if (body) {
        res.send(body);
      } else {
        console.log("배송 정보 가져 오기 실패3 : " + req.body.email);
        console.log("배송 정보 가져 오기 실패4 : " + req.body.t_invoice);
      }
  });
};

function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      skincomplaint: user.skincomplaint,
      country: user.country,
      gender: user.gender,
      birthday: user.birthday,
      pushtoken: user.pushtoken,
      totaluserpoint: user.totaluserpoint,
      ispush: user.ispush,
      phonenumber: user.phonenumber
    },
    config.jwtSecret,
    {
      //expiresIn: 200 // 86400 expires in 24 hours
      expiresIn: 86400 // 86400 expires in 24 hours
    }
  );
}

function getFormattedDate(date) {
  return (
    date.getFullYear() +
    "-" +
    get2digits(date.getMonth() + 1) +
    "-" +
    get2digits(date.getDate())
  );
}

function get2digits(num) {
  return ("0" + num).slice(-2);
}

function getSecondsAsDigitalClock(inputSeconds) {
  var sec_num = parseInt(inputSeconds.toString(), 10); // don't forget the second param
  var hours = Math.floor(sec_num / 3600);
  var minutes = Math.floor((sec_num - hours * 3600) / 60);
  var seconds = sec_num - hours * 3600 - minutes * 60;
  var hoursString = "";
  var minutesString = "";
  var secondsString = "";
  hoursString = hours < 10 ? "0" + hours : hours.toString();
  minutesString = minutes < 10 ? "0" + minutes : minutes.toString();
  secondsString = seconds < 10 ? "0" + seconds : seconds.toString();
  return minutesString + ":" + secondsString;
  // return hoursString + ':' + minutesString + ':' + secondsString;
}

function makeRandomStr() {
  var randomStr = "";
  var possible =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  for (let i = 0; i < 8; i++) {
    randomStr += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return randomStr;
}

function getCovertKoreaTime(time) {
  return new Date(
    new Date(time).getTime() - new Date().getTimezoneOffset() * 60000
  );
}

function isEmpty(str) {
  if (typeof str == "undefined" || str == null || str == "") return true;
  else return false;
}
