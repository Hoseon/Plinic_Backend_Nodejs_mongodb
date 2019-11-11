var User = require('../models/user');
var SkinChart = require('../models/SkinChart');
var SkinChartCounter = require('../models/SkinChartCounter');
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
    //expiresIn: 200 // 86400 e xpires in 24 hours
    expiresIn: 86400 // 86400 expires in 24 hours
  });
}

function get2digits(num) {
  return ("0" + num).slice(-2);
}



exports.skinChartSave = (req, response) => {

  // console.log("-------------------------------request-------------");
  console.log("skinchart-------------------------------- : " + req.body.email);
  console.log("skinchart-------------------------------- : " + JSON.stringify(req.body.score));
  // console.log("skinchart-------------------------------- : " + req.body.);
  // console.log("skinchart-------------------------------- : " + JSON.stringify(req.body.qna));
  // console.log("-------------------------------response-------------" + res.body.id);
  // return res.status(400).json({ 'msg': '문의하기가 등록되었습니다. <br /><br /> 곧 관리자에게 Email로 답변을 받을 수 있습니다.' });

  if (!req.body.email || !req.body.score) {
    return response.status(400).json({
      'msg': '스킨차트를 등록 할 수 없습니다. <br / >. 관리자에게 문의 하세요.'
    });
  } else {
    async.waterfall([function(callback) {
      SkinChartCounter.findOne({
        name: "skinchart"
      }, function(err, counter) {
        if (err) callback(err);
        if (counter) {
          callback(null, counter);
        } else {
          SkinChartCounter.create({
            name: "skinchart",
            totalCount: 0
          }, function(err, counter) {
            if (err) return response.json({
              success: false,
              message: err
            });
            callback(null, counter);
          });
        }
      });
    }], function(callback, counter) {
      let newSkinChart = SkinChart(req.body);
      newSkinChart.numId = counter.totalCount + 1;
      // newSkinChart.score2.score = req.body.score;
      var currentDate = new Date(); // 날짜가 같으면 Update 문으로 가고 날짜가 같지 않으면 Save문으로 나간다
      var today = currentDate.getFullYear() + "-" + get2digits(currentDate.getMonth() + 1) + "-" + get2digits(currentDate.getDate());
      SkinChart.findOne({
        email: req.body.email
      }, function(err, result) {
        if (err) {
          console.log("err : " + err);
        }
        if (result) {
          // var scorelen = 0;
          // console.log("result.score.length :  " + result.score.length);
          // scorelen = parseInt(result.score.length)-1;
          // for (var i = 0; i < res.score.length; i++) {
          // console.log("result : " + scorelen);
          // console.log("result.score[0].saveDate : " + result.score[0].saveDate)
          // console.log("result : " + (result.score[scorelen].saveDate));
          // var saveDate = result.score[scorelen].saveDate;
          // console.log("req.body.score.saveDate" + req.body.score.saveDate.substring(0,10));
          // var saveDate = req.body.score.saveDate;
          // var saveToday = saveDate.getFullYear() + "-" + get2digits(saveDate.getMonth() + 1) + "-" + get2digits(saveDate.getDate());
          var saveToday = req.body.score.saveDate.substring(0, 10);
          // saveToday = new Date(saveToday);
          console.log("saveToday" + saveToday);
          // console.log("today: " + today);
          // console.log("saveToday :"  + saveToday);
          // }
          if (today == saveToday) {
            console.log("Update");
            //저장 날짜가 같을때
            SkinChart.findOneAndUpdate({
              email: req.body.email,
              "score.saveDate": {
                $in: saveToday
              }
            }, {
              $set: {
                "score.$.oil": req.body.score.oil,
                "score.$.moisture": req.body.score.moisture
              }
            }, function(err, post) {
              if (err) {
                console.log(err); {
                  return response.status(400).json({
                    'msg': '문의하기가 등록되지 않았습니다. <br /> Error : ' + err
                  });
                }
              }
              if (!post) {
                // console.log("1111111111" + err);
                var newSkinChartScore = req.body.score
                SkinChart.update({
                  email: req.body.email
                }, {
                  $push: {
                    score: newSkinChartScore
                  }
                }, function(err, post2) {
                  if (err) {
                    return response.status(400).json({
                      'msg': '문의하기가 등록되지 않았습니다. <br /> Error : ' + err
                    });
                  }
                  // response.status(201).json(post2);
                  // return true;
                })
              }
              response.status(201).json(post);
              return true;
            });
          } else {
            console.log("dont same");
            //저장 날짜가 같지 않을때
            var newSkinChartScore = req.body.score
            SkinChart.update({
              email: req.body.email
            }, {
              $push: {
                score: newSkinChartScore
              }
            }, function(err, post) {
              if (err) {
                return response.status(400).json({
                  'msg': '문의하기가 등록되지 않았습니다. <br /> Error : ' + err
                });
              }
              response.status(201).json(post);
              return true;
            })
            // newSkinChart.save((err, user) => {
            //   if (err) {
            //     console.log(err);
            //     return response.status(400).json({
            //       'msg': '스킨차트가 등록되지 않았습니다. <br /> Error : ' + err
            //     });
            //   }
            //   response.status(201).json(user);
            //   return true;
            // });
          }
        } else {
          // console.log("New Save")
          newSkinChart.save((err, newSave) => {
            if (err) {
              return response.status(400).json({
                'msg': '스킨차트가 등록되지 않았습니다. <br /> Error : ' + err
              });
            }
            response.status(201).json(newSave);
            return true;
          });
        }
      });
      // newSkinChart.save((err, user) => {
      //     if (err) {
      //       console.log(err);
      //         return res.status(400).json({ 'msg': '스킨차트가 등록되지 않았습니다. <br /> Error : ' + err });
      //     }
      //     return res.status(201).json(user);
      // });
      // return response.status(201).json();
    });
    // create
  }
};


exports.skinChartUpdate = (req, res) => {

  //console.log("-------------------------------request-------------");
  // console.log("qna_Update-------------------------------- : " + req.body.email);
  // console.log("qna_Update-------------------------------- : " + req.body.select);
  // console.log("qna_Update_IDIDID-------------------------------- : " + req.body.id);
  // console.log("qna_Update-------------------------------- : " + JSON.stringify(req.body.qna));
  // //return res.status(400).json({ 'msg': '문의하기가 등록되었습니다. <br /><br /> 곧 관리자에게 Email로 답변을 받을 수 있습니다.' });
  //console.log("-------------------------------response-------------" + res.body.id);

  if (!req.body.email || !req.body.select) {
    return res.status(400).json({
      'msg': '문의하기를 등록 할 수 없습니다. <br / >. 관리자에게 문의 하세요.'
    });
  } else {
    async.waterfall([function(callback) {
      SkinChartCounter.findOne({
        name: "skinchart"
      }, function(err, counter) {
        if (err) callback(err);
        if (counter) {
          callback(null, counter);
        } else {
          SkinChartCounter.create({
            name: "skinchart",
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
      let newSkinChart = SkinChart(req.body);
      newSkinChart.numId = counter.totalCount + 1;

      SkinChart.findOneAndUpdate({
        _id: req.body.id
      }, req.body, function(err, post) {
        if (err) {
          console.log(err);
          return res.status(400).json({
            'msg': '문의하기가 등록되지 않았습니다. <br /> Error : ' + err
          });
        }
        if (!post) {
          console.log(err);
          return res.status(400).json({
            'msg': '문의하기가 내용이 등록되지 않았습니다. <br /> Error : ' + err
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
