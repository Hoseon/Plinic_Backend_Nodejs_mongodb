var User = require('../models/user');
var Mission = require('../models/Mission');
var Challenge = require('../models/Challenge');
var SkinAnaly = require('../models/SkinAnaly');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcrypt-nodejs');
var config = require('../config/config');
var passport = require('passport');
var KakaoStrategy = require('passport-kakao').Strategy;
var http = require('http');
var request = require('request');
var axios = require('axios');
const AWS = require("aws-sdk");
AWS.config.loadFromPath(__dirname + "/config/awsconfig.json");


exports.skinAnalySave = (req, res) => { //피부분석 데이터가 저장되면 100P를 적립해준다.

  SkinAnaly.findOne({
    email : req.body.email
  },(err, post) => {
    if (err) {
      console.log(err);
      return res.status(400).json({
        'msg': '회원 찾기 에러발생'
      })
    }

    if(post) {
      req.body.cheek.skin_analy.pore = JSON.parse(JSON.stringify(req.body.cheek.skin_analy.pore).replace(/um/g, ""));
      req.body.forehead.skin_analy.pore = JSON.parse(JSON.stringify(req.body.forehead.skin_analy.pore).replace(/um/g, ""));

      SkinAnaly.findOneAndUpdate({
        email: req.body.email
      }, {
        updated_at: new Date(),
        $push: {
          cheek: {
            input: req.body.cheek.input,
            tone: req.body.cheek.skin_analy.tone,
            pore: req.body.cheek.skin_analy.pore,
            wrinkles: req.body.cheek.skin_analy.wrinkles,
            email: req.body.email
          },
          forehead: {
            input: req.body.forehead.input,
            tone: req.body.forehead.skin_analy.tone,
            pore: req.body.forehead.skin_analy.pore,
            wrinkles: req.body.forehead.skin_analy.wrinkles,
            email: req.body.email
          },
        }
      }, (err, post) => {
        if (err) {
          console.log(err);
          return res.status(400).json({
            'msg': '에러발생'
          })
        }
        if(post) {
          return res.status(200).json({
            'msg' : '데이터 처리 완료'
          })
        }
      })
    } else { //신규 유저 일대 최초 이미지와, 데이터를 Save 한다.
             //사진은 비교를 하기 위해서 로컬 소스로 전달한다.
             //원본파일명은 DB형태로 관리 한다.
      
      let newUser = SkinAnaly();

      console.log(req.body.cheek.input);
      newUser.email = req.body.email;
      newUser.gender = req.body.gender;
      newUser.agerange = req.body.agerange;
      newUser.skincomplaint = req.body.skincomplaint;

      newUser.cheek.input = req.body.cheek.input;
      newUser.forehead.input = req.body.forehead.input;


      req.body.cheek.skin_analy.pore = JSON.parse(JSON.stringify(req.body.cheek.skin_analy.pore).replace(/um/g, ""));
      req.body.forehead.skin_analy.pore = JSON.parse(JSON.stringify(req.body.forehead.skin_analy.pore).replace(/um/g, ""));
      
      newUser.firstcheek = req.body.cheek.input.filename; //신규 등록자는 최초 피부 사진 별도 저장 향후 피부 차이 분석 위해 필요
      newUser.firstforhead = req.body.forehead.input.filename; //신규 등록자는 최초 피부 사진 별도 저장 향후 피부 차이 분석 위해 필요

      newUser.cheek = { tone : req.body.cheek.skin_analy.tone,
                        pore : req.body.cheek.skin_analy.pore,
                        wrinkles : req.body.cheek.skin_analy.wrinkles,
                        input : req.body.cheek.input
                      }

      newUser.forehead = {  tone : req.body.forehead.skin_analy.tone,
                            pore : req.body.forehead.skin_analy.pore,
                            wrinkles : req.body.forehead.skin_analy.wrinkles,
                            input : req.body.forehead.input
                          }

      newUser.munjin = {  sleep : req.body.munjin.sleep,
                          alcohol : req.body.munjin.alcohol,
                          fitness : req.body.munjin.fitness,
                        }

      newUser.save((err, user) => {
        if (err) {
          console.log(err);
          return res.status(400).json({
            'msg': '회원의 정보가 존재 하지 않음'
          });
        }
        //플리닉 샵 회원가입
        if(user) {
          const fs2 = require("fs");
          const http = require("http");
          
          //server
          const file = fs2.createWriteStream(__dirname + '/../../skin/'+req.body.cheek.input.filename);
          const file2 = fs2.createWriteStream(__dirname + '/../../skin/'+req.body.forehead.input.filename);

          //http://ec2-3-34-189-215.ap-northeast-2.compute.amazonaws.com/media/images/18ee9911-2a0c-4cbd-b0cf-cfdc81683cec.jpg

          //피쳐링 기존 API 주소 2020-12-07
          // var originalCheekImageUrl = "http://ec2-3-34-189-215.ap-northeast-2.compute.amazonaws.com/media/images/" + req.body.cheek.input.filename;
          // var originalForeheadImageUrl = "http://ec2-3-34-189-215.ap-northeast-2.compute.amazonaws.com/media/images/" + req.body.forehead.input.filename;

          var originalCheekImageUrl = "http://ec2-15-164-210-238.ap-northeast-2.compute.amazonaws.com/media/images/" + req.body.cheek.input.filename;
          var originalForeheadImageUrl = "http://ec2-15-164-210-238.ap-northeast-2.compute.amazonaws.com/media/images/" + req.body.forehead.input.filename;
          http.get(originalCheekImageUrl, response => {
            var stream = response.pipe(file);
            stream.on("finish",  function() {
              console.log("CheekDone");
              http.get(originalForeheadImageUrl, response => {
                var stream = response.pipe(file2);
                stream.on("finish",  function() {
                  console.log("ForheadDone");
                  return res.status(201).json({
                    'msg' : '신규 피부 분석 저장 완료'
                  });
                });  
              });
            });  
          });
        }
      });
    }
  })

  
};


exports.skinAnalyUpdate = (req, res) => { //피부분석 데이터가 저장되면 100P를 적립해준다.

  SkinAnaly.findOne({
    email : req.body.email
  },(err, post) => {
    if (err) {
      console.log(err);
      return res.status(400).json({
        'msg': '회원 찾기 에러발생'
      })
    }

    if(post) {
      SkinAnaly.findOneAndUpdate({
        email: req.body.email
      }, {
        updated_at: new Date(),
        firstcheek : req.body.cheek.input.filename, //신규 등록자는 최초 피부 사진 별도 저장 향후 피부 차이 분석 위해 필요
        firstforhead : req.body.forehead.input.filename, //신규 등록자는 최초 피부 사진 별도 저장 향후 피부 차이 분석 위해 필요
      }, (err, post) => {
        if (err) {
          console.log(err);
          return res.status(400).json({
            'msg': '에러발생'
          })
        }
        if(post) {
          //첨부 파일 교체 작업
          const fs2 = require("fs");
          const http = require("http");
          
          //server
          const file = fs2.createWriteStream(__dirname + '/../../skin/'+req.body.cheek.input.filename);
          const file2 = fs2.createWriteStream(__dirname + '/../../skin/'+req.body.forehead.input.filename);

          //http://ec2-3-34-189-215.ap-northeast-2.compute.amazonaws.com/media/images/18ee9911-2a0c-4cbd-b0cf-cfdc81683cec.jpg

          //http://ec2-15-164-210-238.ap-northeast-2.compute.amazonaws.com


          //2020-12-07 피처링 기존 API 주소
          // var originalCheekImageUrl = "http://ec2-3-34-189-215.ap-northeast-2.compute.amazonaws.com/media/images/" + req.body.cheek.input.filename;
          // var originalForeheadImageUrl = "http://ec2-3-34-189-215.ap-northeast-2.compute.amazonaws.com/media/images/" + req.body.forehead.input.filename;

          //2020-12-07 지원파트너스 신규 API 주소
          var originalCheekImageUrl = "http://ec2-15-164-210-238.ap-northeast-2.compute.amazonaws.com/media/images/" + req.body.cheek.input.filename;
          var originalForeheadImageUrl = "http://ec2-15-164-210-238.ap-northeast-2.compute.amazonaws.com/media/images/" + req.body.forehead.input.filename;
          http.get(originalCheekImageUrl, response => {
            var stream = response.pipe(file);
            stream.on("finish",  function() {
              console.log("CheekDone");
              http.get(originalForeheadImageUrl, response => {
                var stream = response.pipe(file2);
                stream.on("finish",  function() {
                  console.log("ForheadDone");
                  return res.status(201).json({
                    'msg' : '최초 이미지 변경 처리 완료'
                  });
                });  
              });
            });  
          });
        }
      })
    } 
    else { 
      //첨부 파일을 교체 해야 하는데 사용자가 없을 경우
      return res.status(400).json({
        'msg' : '첨부 파일 변경해야 할 사용자가 존재하지 않습니다.'
      });
    }
  })
};


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

exports.challengePointUpdate = (req, res) => {
  // console.log("start");
  // console.log("email : " + req.body.email);
  // console.log("id : " + req.body.id);
  // console.log("points : " + req.body.points);

  Challenge.findOne({
      missionID: req.body.id,
      email: req.body.email
    },
    function (err, result) {
      var todayPoints = 0;
      var minusPoints = 0;
      var usePoints = 0;
      var totalUseTime = req.body.points;
      // console.log("updatedAt : " + result.usedmission[0].updatedAt.getDate());

      // 오늘 사용했던 시간 + 현재 사용한 시간이 1분30초(90초가 넘는지 확인 하는 로직)
      for (var i = 0; i < result.usedmission.length; i++) {
        // console.log(getFormattedDate(new Date()));
        if (getFormattedDate(result.usedmission[i].updatedAt) == getFormattedDate(new Date())) {
          // for (var k = 0; k < result.usedmission[k].points; k++){
          // console.log("점수 : " + result.usedmission[i].points);
          todayPoints = todayPoints + Number(result.usedmission[i].points);
          // console.log(todayPoints);
          // }
        }
      }
      // console.log("total points : " + todayPoints);
      if (todayPoints < 90) {
        if ((todayPoints + Number(req.body.points)) > 90) {
          // console.log("9분을 넘어감");
          // console.log((todayPoints + Number(req.body.points)) - 90)

          //만일 사용시간이 이번 누적으로 9분이 초과 하면 9분만 누적하는 로직
          minusPoints = (todayPoints + Number(req.body.points)) - 90
          usePoints = Number(req.body.points) - minusPoints
          // console.log("적립되어야 할 포인트 : " + usePoints);
          var newPoint = req.body
          newPoint.points = usePoints;
          newPoint.updatedAt = new Date();
          Challenge.update({
            missionID: req.body.id,
            email: req.body.email
          }, {
            $push: {
              usedmission: newPoint
            },
            $inc: { //미션당 사용 시간 외에 일반적인 플리닉의 총 사용시간도 구해야 함 20191028
              "usetime": usePoints
            }
          }, function (err, post2) {
            if (err) {
              // console.log("tags error : " + err);
              return res.status(400).json(err);
            } else {
              User.findOneAndUpdate({
                  email: req.body.email
                }, {
                  $push: {
                    userpoint: newPoint
                  },
                  $inc: {
                    totalusetime: req.body.points,
                    totaluserpoint: req.body.points
                  }
                },
                function (err, response) {
                  if (err) {
                    res.json(0);
                  } else {
                    // res.json(response.credit);
                  }
                });
              // return res.status(201).json(post2);
              return res.status(201).json({
                'msg': '플리닉 오늘 누적 사용시간이 9분을 초과하여 <br>' + getSecondsAsDigitalClock(usePoints) + ' 초만 누적되었습니다. <br> 내일 다시 사용해 주세요 <br> 감사합니다'
              });
            }
          });
        } else { //총 사용시간과 현재 사용시간을 합쳐도 1분30초(90초)가 안넘어 갈때
          // console.log("9분을 안넘어감");
          var newPoint = req.body
          newPoint.updatedAt = new Date();
          Challenge.update({
            missionID: req.body.id,
            email: req.body.email
          }, {
            $push: {
              usedmission: newPoint
            },
            $inc: { //미션당 사용사긴 외에 일반적인 플리닉의 총 사용시간도 구해야 함 20191028
              "usetime": req.body.points
            }
          }, function (err, post2) {
            if (err) {
              // console.log("tags error : " + err);
              return res.status(400).json(err);
            } else {
              User.findOneAndUpdate({
                  email: req.body.email
                }, {
                  $push: {
                    userpoint: newPoint
                  },
                  $inc: {
                    totalusetime: req.body.points,
                    totaluserpoint: req.body.points
                  }
                },
                function (err, response) {
                  if (err) {
                    res.json(0);
                  } else {
                    // res.json(response.credit);
                  }
                });
              return res.status(201).json({
                'msg': '사용시간 ' + getSecondsAsDigitalClock(req.body.points) + '초가 누적되었습니다. <br> 오늘 누적 사용시간 : ' + getSecondsAsDigitalClock(todayPoints + Number(req.body.points))
              });
            }
          });
        }
      } else {
        User.findOneAndUpdate({
            email: req.body.email
          }, {
            $push: {
              userpoint: newPoint
            },
            $inc: {
              totalusetime: req.body.points,
              totaluserpoint: req.body.points
            }
          },
          function (err, response) {
            if (err) {
              res.json(0);
            } else {}
          });
        return res.status(400).json({
          'msg': '오늘은 플리닉을 9분간 사용하여 <br> 누적이 되지 않습니다. <br> 내일 다시 사용해 주세요 <br> 감사합니다'
        });
      }
    });
}

exports.usePointUpdate = (req, res) => {
  // console.log("start");
  // console.log("email : " + req.body.email);
  // console.log("id : " + req.body.id);
  // console.log("points : " + req.body.points);


  User.findOne({
    email: req.body.email
  }, function (err, result) {
    var todayPoints = 0;
    var minusPoints = 0;
    var usePoints = 0;

    // 오늘 사용했던 시간 + 현재 사용한 시간이 1분30초(90P초가 넘는지 확인 하는 로직)
    for (var i = 0; i < result.userpoint.length; i++) {
      if (getFormattedDate(result.userpoint[i].updatedAt) == getFormattedDate(new Date())) {
        //날짜가 오늘이여야 하고
        if (result.userpoint[i].status == 'true') {
          //포인트는 케어하기로 누적한것만 찾아낸다( 출석체크 50P로 누적된건 제외 )
          todayPoints = todayPoints + Number(result.userpoint[i].point); //날짜가 오늘인 점수는 모두다 누적해본다
        }

      }
    }


    //누적 로직 시작
    if (todayPoints < 90) { //하루 9분을 넘어가면

      //만일 사용시간이 이번 누적으로 9분이 초과 하면 9분만 누적하는 로직
      if ((todayPoints + Number(req.body.points)) > 90) {
        // console.log("9분을 넘어감");
        // console.log((todayPoints + Number(req.body.points)) - 90)

        //만일 사용시간이 이번 누적으로 9분이 초과 하면 9분만 누적하는 로직 6분만 이용한걸로 뺀다
        minusPoints = (todayPoints + Number(req.body.points)) - 90
        usePoints = Number(req.body.points) - minusPoints
        // console.log("적립되어야 할 포인트 : " + usePoints);
        var newPoint = req.body
        newPoint.points = usePoints;
        newPoint.updatedAt = new Date();

        var userPoint = req.body.userpoint;
        userPoint.point = usePoints;
        userPoint.updatedAt = new Date();



        User.findOneAndUpdate({
          email: req.body.email
        }, {
          $push: {
            userpoint: userPoint
            //req.body.userpoint
          },
          $inc: { //미션당 사용 시간 외에 일반적인 플리닉의 총 사용시간도 구해야 함 20191028
            "totaluserpoint": usePoints
          }
        }, function (err, post2) {
          if (err) {
            // console.log("tags error : " + err);
            return res.status(400).json(err);
          } else {
            request.post({
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
              },
              // url : 'http://localhost:50082/Point/PlinicAddPoint',
              url: 'http://plinicshop.com:50082/Point/PlinicAddPoint',
              body: 'id=' + req.body.email +
                "&point=" + usePoints +
                "&reason=" + "플리닉사용" +
                "&expire=" + 1096,
              json: false, //헤더 값을 JSON으로 변경한다
            }, function (error, response, body) {
              if (error) {
                console.log("포인트 포스트 전송 에러 발생" + error);
              }
              if (body) {}
              if (response) {}
            });
            return res.status(201).json({
              'point': usePoints + 'P 획득 완료!',
              // 'msg': '오늘 누적 사용시간이 1분30초(90초)을 초과하여 <br>' + getSecondsAsDigitalClock(usePoints) + ' 초만 누적되었습니다.'
              'msg': '오늘 적립된 포인트 : 90P<br>(최대적립 가능 포인트 : 90P)'
            });
          }
        });
      } else { //총 사용시간과 현재 사용시간을 합쳐도 1분30초(90초)가 안넘어 갈때
        // console.log("9분을 안넘어감");
        var newPoint = req.body.userpoint;
        newPoint.updatedAt = new Date();

        User.findOneAndUpdate({
          email: req.body.email
        }, {
          $push: {
            userpoint: newPoint
          },
          $inc: { //미션당 사용사긴 외에 일반적인 플리닉의 총 사용시간도 구해야 함 20191028
            "totaluserpoint": req.body.points
          }
        }, function (err, post2) {
          if (err) {
            // console.log("tags error : " + err);
            return res.status(400).json(err);
          } else {
            request.post({
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
              },
              // url : 'http://localhost:50082/Point/PlinicAddPoint',
              url: 'http://plinicshop.com:50082/Point/PlinicAddPoint',
              body: 'id=' + req.body.email +
                "&point=" + req.body.points +
                "&reason=" + "플리닉사용" +
                "&expire=" + 1096,
              json: false, //헤더 값을 JSON으로 변경한다
            }, function (error, response, body) {
              if (error) {
                console.log("포인트 포스트 전송 에러 발생" + error);
              }
              if (body) {}
              if (response) {}
            });
            return res.status(201).json({
              'point': req.body.points + 'P 획득 완료!',
              'msg': '오늘 적립된 포인트 : ' + (Number(todayPoints) + Number(req.body.points)) + 'P <br>(최대적립 가능 포인트 : 90P)'
            });
          }
        });
      }
    } else {
      var newPoint;
      // newPoint.points = req.body.points;
      // newPoint.updatedAt = new Date();


      var userPoint = req.body.userpoint;
      userPoint.updatedAt = new Date();


      User.findOneAndUpdate({
          email: req.body.email
        }, {
          $push: {
            // userpoint: userPoint
          },
          $inc: {
            // totaluserpoint: req.body.points
          }
        },
        function (err, response) {
          if (err) {
            res.json(0);
          } else {
            // res.json(response.credit);
          }
        });
      return res.status(201).json({
        'point': '적립 초과!',
        'msg': '오늘 적립된 포인트 : 90P<br>(최대적립 가능 포인트 : 90P)'
      });
      // console.log("오늘자로 9분을 모두 사용하여 누적이 되지 않습니다.");
      // return res.status(200).json();
    }
  })

  // User.findOneAndUpdate({
  //     email: req.body.email
  //   }, {
  //     $push: {
  //       userpoint: req.body.userpoint
  //     },
  //     $inc: {
  //       totalusetime: req.body.points,
  //       totaluserpoint: req.body.points
  //     }
  //   },
  //   function(err, response) {
  //     if (err) {
  //       res.json(0);
  //     } else {
  //       return res.status(201).json({
  //         'msg': '사용시간 ' + getSecondsAsDigitalClock(req.body.points) + '초가 누적되었습니다.'
  //       });
  //     }
  //   });
}


function makeRandomStr() {
  var randomStr = "";
  var possible = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  for (let i = 0; i < 8; i++) {
    randomStr += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return randomStr;
}