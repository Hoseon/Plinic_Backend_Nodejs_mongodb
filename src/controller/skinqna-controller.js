var User = require('../models/user');
var SkinQna = require('../models/SkinQna');
var Tags = require('../models/Tags');
var PointLog = require('../models/PointLog');
var SkinQnaCounter = require('../models/SkinQnaCounter');
var jwt = require('jsonwebtoken');
var async = require('async');
var config = require('../config/config');
var passport = require('passport');
var KakaoStrategy = require('passport-kakao').Strategy;

function createToken(user) {
  return jwt.sign({
    id: user.id,
    email: user.email,
    name: user.name
  }, config.jwtSecret, {
    //expiresIn: 200 // 86400 expires in 24 hours
    expiresIn: 86400 // 86400 expires in 24 hours
  });
}

exports.skinQnaSave = (req, res) => {

  // console.log("-------------------------------request-------------");
  // console.log("qna email -------------------------------- : " + req.body.email);
  // console.log("qna-------------------------------- : " + req.body.select);
  // console.log("qna-------------------------------- : " + req.body.tags);
  // console.log("qna-------------------------------- : " + JSON.stringify(req.body.qna));
  // //return res.status(400).json({ 'msg': '문의하기가 등록되었습니다. <br /><br /> 곧 관리자에게 Email로 답변을 받을 수 있습니다.' });
  //console.log("-------------------------------response-------------" + res.body.id);

  if (!req.body.email || !req.body.select) {
    return res.status(400).json({
      'msg': '피부고민을 등록 할 수 없습니다. <br / >. 관리자에게 문의 하세요.'
    });
  } else {
    async.waterfall([function(callback) {
      SkinQnaCounter.findOne({
        name: "skinqna"
      }, function(err, counter) {
        if (err) callback(err);
        if (counter) {
          callback(null, counter);
        } else {
          SkinQnaCounter.create({
            name: "skinqna",
            totalCount: 0
          }, function(err, counter) {
            if (err) return res.json({
              success: false,
              message: err
            });
            callback(null, counter);
          });
        }
      });
    }], function(callback, counter) {
      let newSkinQna = SkinQna(req.body);
      newSkinQna.numId = counter.totalCount + 1;
      newSkinQna.save((err, data) => {
        if (err) {
          console.log(err);
          return res.status(400).json({
            'msg': '피부고민이 등록되지 않았습니다. <br /> Error : ' + err
          });
        }


        console.log("포인트 등록 시작 : " + req.body.email);
        //포인트를 등록한다. 2020-05-25
        PointLog.findOne({
          email: req.body.email
        },
        function(err, result) {
          if (result) {

            var prePointLog = {
              reason: "뷰티플 글쓰기 작성",
              point: 50,
              status : 'skinqna'
            }

            PointLog.findOne({
              email: req.body.email
            }, (err, data) => {
              if (err) {
                console.log("톡 작성 후 포인트 적립 실패(사용자 못찾음) : " + req.body.email + " : " + req.body.review.product_name);
                res.status(400).json(err);
              }
              
              if (data) {
                var isReview = false;
                for (var i = 0; i < data.point.length; i++) {
                  if (getFormattedDate(data.point[i].createdAt) == getFormattedDate(new Date())) {
                    if (data.point[i].reason == '뷰티플 글쓰기 작성') {
                      // console.log(getFormattedDate(data.point[i].createdAt) + " : " + getFormattedDate(new Date()));
                      isReview = true;
                    }
                  } 
                }

                if (isReview) { //오늘 톡을 작성한게 있다면 포인트 적립 없이 진행
                  console.log("뷰티플 글쓰기 작성은 되었으나 포인트는 적립되지 않음");
                } else { //오늘 톡을 작성한게 있다면 포인트 적립 진행
                  PointLog.update({
                    email: req.body.email
                  }, {
                      $push: { point: prePointLog },
                      $inc: { "totalPoint": 50 }
                    }, (err, result) => {
                      if (err) {
                        console.log("글쓰기 포인트 적립 에러 발생 : " + req.body.email);
                        res.status(400).json();
                      }
                      if (result) {
                        // res.status(200).json(result);
                      } else {
                        console.log("글쓰기 포인트 적립 에러 발생 2 : " + req.body.email);
                        res.status(400).json();
                      }
                  });
                }
              }
              });
            
            // for(var i =0; i< result.point.length; i++) {
            //   if (getFormattedDate(new Date(result.point[i].createdAt)) == getFormattedDate(new Date())) {
            //     if(result.point[i].reason=="skinqna" || result.point[i].reason=="뷰티플 글쓰기 작성") {
            //       return res.status(400);
            //       //         // 'msg': '하루 한번만 포인트가 누적됩니다!!'
            //     }
            //   }
            // }
            // //커뮤니티 글 작성시 1회/일 50점을 쌓아 준다 2020-05-25
            // User.update({
            //   email : req.body.email
            // }, {
            //   $push: {
            //     userpoint : {point: 50, updatedAt: new Date(), status: 'skinqna'}
            //   }, $inc: { //미션당 사용사긴 외에 일반적인 플리닉의 총 사용시간도 구해야 함 20191028
            //     "totaluserpoint": 50
            //   }
            // }, function(err, result2){
            //   if(err) {
            //     // return res.status(400).json(err);
            //   } else {
            //     // return res.status(201).json({
            //       // 'msg': '커뮤니티 작성 포인트가 누적되었습니다111!!'
            //     // });
            //   }
            //   });
            

            //포인트 로그 플리닉샵 --> 플리닉으로 변경 2021-03-04
            // PointLog.update({
            //   email: req.body.email
            // }, {
            //     $push: { point: prePointLog },
            //     $inc: { "totalPoint": 50 }
            //   }, (err, result) => {
            //     if (err) {
            //       console.log("글쓰기 포인트 적립 에러 발생 : " + req.body.email);
            //       res.status(400).json();
            //     }
            //     if (result) {
            //       // res.status(200).json(result);
            //     } else {
            //       console.log("글쓰기 포인트 적립 에러 발생 2 : " + req.body.email);
            //       res.status(400).json();
            //     }
            // });
          } else {
            // //검색결과가 없으면 신규 등록
            // User.update({
            //   email : req.body.email
            // }, {
            //   $push: {
            //     userpoint : {point: 50, updatedAt: new Date(), status: 'skinqna'}
            //   }, $inc: { //미션당 사용사긴 외에 일반적인 플리닉의 총 사용시간도 구해야 함 20191028
            //     "totaluserpoint": 50
            //   }
            // }, function(err, result2){
            //   if(err) {
            //     return res.status(400).json(err);
            //   } else {
            //     return res.status(201).json({
            //       'msg': '커뮤니티 작성 포인트가 누적되었습니다222!!'
            //     });
            //   }
            // });
          }
        });

        // let newTags = Tags();
        // newTags.tags = req.body.tags;
        // newTags.save((err, tags) =>{
        //   if (err) {
        //     console.log("tags erros : " + err);
        //       // return res.status(400).json({ 'msg': '문의하기가 등록되지 않았습니다. <br /> Error : ' + err });
        //   } else {
        //     console.log("tags result :  " + tags);
        //   }
        // });
        var newTags = req.body.tags
        Tags.update({
          _id: '5d2c39cc9cc12aae489d2f08'
        }, {
          $push: {
            tags: newTags
          }
        }, function(err, post2) {
          if (err) {
            console.log("tags error : " + err);
          } else {
            // console.log("result tags : " + JSON.stringify(post2));
          }
        })
        return res.status(201).json(data);
        // return res.status(201).json(user);
        // return res.status(201).json({
        //     token: createToken(user)
        // });
      });
    });
    // create
  }
};


exports.skinQnaUpdate = (req, res) => {

  //console.log("-------------------------------request-------------");
  // console.log("qna_Update-------------------------------- : " + req.body.email);
  // console.log("qna_Update-------------------------------- : " + req.body.select);
  // console.log("qna_Update_IDIDID-------------------------------- : " + req.body.id);
  // console.log("qna_Update-------------------------------- : " + JSON.stringify(req.body.qna));
  // //return res.status(400).json({ 'msg': '문의하기가 등록되었습니다. <br /><br /> 곧 관리자에게 Email로 답변을 받을 수 있습니다.' });
  //console.log("-------------------------------response-------------" + res.body.id);

  if (!req.body.email || !req.body.select) {
    return res.status(400).json({
      'msg': '피부고민을 등록 할 수 없습니다. <br / >. 관리자에게 문의 하세요.'
    });
  } else {
    async.waterfall([function(callback) {
      SkinQnaCounter.findOne({
        name: "qna"
      }, function(err, counter) {
        if (err) callback(err);
        if (counter) {
          callback(null, counter);
        } else {
          SkinQnaCounter.create({
            name: "qna",
            totalCount: 0
          }, function(err, counter) {
            if (err) return res.json({
              success: false,
              message: err
            });
            callback(null, counter);
          });
        }
      });
    }], function(callback, counter) {
      let newQna = SkinQna(req.body);
      newQna.numId = counter.totalCount + 1;

      SkinQna.findOneAndUpdate({
        _id: req.body.id
      }, req.body, function(err, post) {
        if (err) {
          console.log(err);
          return res.status(400).json({
            'msg': '피부고민이 등록되지 않았습니다. <br /> Error : ' + err
          });
        }
        if (!post) {
          console.log(err);
          return res.status(400).json({
            'msg': '피부고민이 내용이 등록되지 않았습니다. <br /> Error : ' + err
          });
        }
        return res.status(201).json(post);
      });
      // newQna.save((err, user) => {
      //     if (err) {
      //       console.log(err);
      //         return res.status(400).json({ 'msg': '문의하기가 등록되지 않았습니다. <br /> Error : ' + err });
      //     }
      //     return res.status(201).json(user);
      //     // return res.status(201).json(user);
      //     // return res.status(201).json({
      //     //     token: createToken(user)
      //     // });
      // });
    });
    // create
  }
};

exports.replySave = (req, res) => {
  var newReply = req.body
  SkinQna.update({
    _id: req.body.id
  }, {
    $push: {
      comments: newReply
    }
  }, function(err, post2) {
    if (err) {
      console.log("tags error : " + err);
      return res.status(400).json(err);
    } else {
      //2021-03-04 게시글 댓글 작성시 포인트 적립 5포인트
      var prePointLog = {
        reason: "게시글 댓글 작성",
        point: 10,
        status : 'skinqnaReply'
      }

      var reviewCount = 0;
      
      //포인트 로그 플리닉샵 --> 2021-04-27 포인트 적립 로직 1일5회 제한 으로 변경
      PointLog.findOne({
        email: req.body.email
      }, (err, data) => {
        
        if (err) {
          console.log("게시글 댓글 작성 포인트 적립 에러 발생 : " + req.body.email);
          res.status(400).json();
        }
          
        for (var i = 0; i < data.point.length; i++) {
          if (getFormattedDate(data.point[i].createdAt) == getFormattedDate(new Date())) {
            if (data.point[i].reason == '게시글 댓글 작성') {
              reviewCount++;
            }
          } 
        }
          
        if (5 > reviewCount) {
          PointLog.update({
            email: req.body.email
          }, {
              $push: { point: prePointLog },
              $inc: { "totalPoint": 10 }
            }, (err, result) => {
              if (err) {
                console.log("게시글 댓글 작성 포인트 적립 에러 발생 : " + req.body.email);
                res.status(400).json();
              }
              if (result) {
                // res.status(200).json(result);
              } else {
                console.log("게시글 댓글 작성 에러 발생 2 : " + req.body.email);
                res.status(400).json();
              }
          });
        } 
      });

      // console.log("result tags : " + JSON.stringify(post2));
      return res.status(201).json(post2);
    }
  })

}


exports.replyUpdate = (req, res) => {
  // console.log(req.body.email);
  // console.log(req.body.id);
  // console.log(req.body.comment);

  var newReply = req.body
  SkinQna.updateOne({
      "comments._id": req.body.id
    }, {
      $set: {
        "comments.$.comment": req.body.comment,
        "comments.$.createdAt": Date.now()
      }
    },
    function(err, post2) {
      if (err) {
        console.log("tags error : " + err);
        return res.status(400).json({
          'msg': '댓글이 수정 되지 않았습니다. <br /> Error : ' + err
        });
      } else {
        // console.log("result tags : " + JSON.stringify(post2));
        return res.status(201).json(post2);
      }
    })

}


exports.replyDelete = (req, res) => {
  // console.log(req.body.email);
  // console.log(req.body.id);
  // console.log(req.body.comment);

  var newReply = req.body
  SkinQna.updateOne({
      "comments._id": req.body.id
    }, {
      $pull: {
        comments: {
          _id: req.body.id
        }
      }
    },
    function(err, post2) {
      if (err) {
        console.log("tags error : " + err);
        return res.status(400).json({
          'msg': '댓글이 삭제 되지 않았습니다. <br /> Error : ' + err
        });
      } else {
        // console.log("result tags : " + JSON.stringify(post2));
        return res.status(201).json(post2);
      }
    })

}

function getFormattedDate(date) {
  return date.getFullYear() + "-" + get2digits(date.getMonth() + 1) + "-" + get2digits(date.getDate());
};

function get2digits(num){
  return ("0" + num).slice(-2);
}

