var User = require('../models/user');
var Mission = require('../models/Mission');
var Challenge = require('../models/Challenge');
var SkinReport = require('../models/SkinReport');
var ProductsReview = require('../models/ProductsReview');
var config = require('../config/config');

exports.skinReportSave = (req, res) => {

  if (!req.body.email) {
    return res.status(400).json({
      'msg': '출석체크 서버에 문제가 발생했습니다<br> 잠시 후 다시 출첵 해주세요.'
    });
  }

  SkinReport.findOne({
      email: req.body.email
    },
    function(err, result) {
      if (result) {
        // for (var i = 0; i < result.chulcheck.length; i++) {
          if (getFormattedDate(result.skinreport[(result.skinreport.length)-1].updatedAt) == getFormattedDate(new Date())) {
            return res.status(400).json({
              'msg': '하루 한번 피부 리포트 100P가 쌓입니다!!'
            });
          } else {
            //오늘 날짜가 발견되지 않았으면 업데이트 실시
            var newSkinReport = req.body.skinreport
            SkinReport.update({
              email: req.body.email
            }, {
              $push: {
                skinreport: newSkinReport
              }
            }, function(err, post2) {
              if (err) {
                return res.status(400).json(err);
              } else {
                // return res.status(201).json(post2);
                //출석체크가 성공하면 포인트 50점을 쌓아 준다 2020-02-19
                User.update({
                  email : req.body.email
                }, {
                  $push: {
                    userpoint : {point: 100, updatedAt: new Date(), status: 'SkinReport'}
                  }, $inc: { //미션당 사용사긴 외에 일반적인 플리닉의 총 사용시간도 구해야 함 20191028
                    "totaluserpoint": 100
                  }
                }, function(err, result2){
                  if(err) {
                    return res.status(400).json(err);
                  } else {
                    return res.status(201).json({
                      'msg': '출석체크 되었습니다 <br> 내일 또 출석체크 해주세요!!'
                    });
                  }
                });
              }
            });
          }
        // }
      } else {
        //검색결과가 없으면 신규 등록
        let newMission = SkinReport(req.body);
        newMission.save((err, user) => {
          if (err) {
            console.log(err);
            return res.status(400).json({
              'msg': err
            });
          } if(!err) {
            User.update({
              email : req.body.email
            }, {
              $push: {
                userpoint : {point: 100, updatedAt: new Date(), status: 'SkinReport'}
              }, $inc: { //미션당 사용사긴 외에 일반적인 플리닉의 총 사용시간도 구해야 함 20191028
                "totaluserpoint": 100
              }
            }, function(err, result2){
              if(err) {
                return res.status(400).json(err);
              } else {
                return res.status(201).json({
                  'msg': '신규 출석체크 되었습니다 <br> 내일 또 출석체크 해주세요!!'
                });
              }
            });
          }
          // return res.status(201).json({
          //   'msg': '출석체크 되었습니다 <br> 내일 또 출석체크 해주세요!!'
          // });
        });
      }
    });
};

exports.registerReview = (req, res) => {
  if (!req.body.email) {
    return res.status(400).json({
      'msg': '사용자 정보가 정확하지 않습니다<br>다시 로그인 후 작성하세요'
    });
  } else {
    let newReview = ProductsReview();
    newReview.email = req.body.email;
    newReview.content = req.body.review.content;
    newReview.rating = req.body.review.rating;
    newReview.product_num = req.body.review.product_num;
    newReview.product_name = req.body.review.product_name;

    newReview.save((err, data) => {
      if(!data) {
        return res.status(400).json({
          'msg': '리뷰등록 에러발생'
        });
      }
      if(data) {
        return res.status(200).json({
          'msg': '리뷰가 등록 되었습니다.'
        });
      }
      if(err) {
        return res.status(400).json({
          'msg': '리뷰등록 에러발생'
        });
      }
    });
  }
}

exports.deleteReview = (req, res) => {
  // console.log(req.body.email);
  // console.log(req.body.id);
  if (!req.body.email && !req.body.id) {
    return res.status(400).json({
      'msg': '사용자 정보가 정확하지 않습니다<br>다시 로그인 후 작성하세요'
    });
  } else {
    ProductsReview.findOneAndDelete({
      _id : req.body.id,
      email : req.body.email
    }, function(err, result) { 
      if(err) {
        return res.status(400).json({
          'msg': '리뷰삭제 에러발생'
        });
      }
      if(result) {
        return res.status(200).json({
          'msg': '리뷰삭제 성공'
        });
      } else {
        return res.status(400).json({
          'msg': '리뷰삭제 에러발생22'
        });
      }
    });
  }
}

exports.productReviewUpdate = (req, res) => {
  if (!req.body.email && !req.body.id) {
    return res.status(400).json({
      'msg': '사용자 정보가 정확하지 않습니다<br>다시 로그인 후 작성하세요'
    });
  } else {
    ProductsReview.findOneAndUpdate({
      _id : req.body.id,
      email : req.body.email
    }, req.body, function(err, result) { 
      if(err) {
        return res.status(400).json({
          'msg': '리뷰업데이트 에러발생'
        });
      }
      if(result) {
        return res.status(200).json({
          'msg': '리뷰업데이트 성공'
        });
      } else {
        return res.status(400).json({
          'msg': '리뷰업데이트 에러발생22'
        });
      }
    });
  }
}

function getFormattedDate(date) {
  return date.getFullYear() + "-" + get2digits(date.getMonth() + 1) + "-" + get2digits(date.getDate());
};

function get2digits(num) {
  return ("0" + num).slice(-2);
}

function getSecondsAsDigitalClock(inputSeconds) {
  var sec_num = parseInt(inputSeconds.toString(), 10); // don't forget the second param
  var hours = Math.floor(sec_num / 3600);
  var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
  var seconds = sec_num - (hours * 3600) - (minutes * 60);
  var hoursString = '';
  var minutesString = '';
  var secondsString = '';
  hoursString = (hours < 10) ? "0" + hours : hours.toString();
  minutesString = (minutes < 10) ? "0" + minutes : minutes.toString();
  secondsString = (seconds < 10) ? "0" + seconds : seconds.toString();
  return minutesString + ':' + secondsString;
  // return hoursString + ':' + minutesString + ':' + secondsString;
}
