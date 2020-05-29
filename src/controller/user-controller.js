var User = require('../models/user');
var Mission = require('../models/Mission');
var Challenge = require('../models/Challenge');
var jwt = require('jsonwebtoken');
var config = require('../config/config');
var passport = require('passport');
var KakaoStrategy = require('passport-kakao').Strategy;
var http = require('http');
var request = require('request');


function createToken(user) {
  return jwt.sign({
    id: user.id,
    email: user.email,
    name: user.name,
    skincomplaint: user.skincomplaint,
    country: user.country,
    gender: user.gender,
    birthday: user.birthday,
    pushtoken: user.pushtoken,
    totaluserpoint : user.totaluserpoint,
  }, config.jwtSecret, {
    //expiresIn: 200 // 86400 expires in 24 hours
    expiresIn: 86400 // 86400 expires in 24 hours
  });
}

exports.missionSave = (req, res) => {

  //console.log("-------------------------------request-------------");
  // console.log(req.body);
  //console.log("-------------------------------response-------------" + res.body.id);


  if (!req.body.missionID || !req.body.email) {
    return res.status(400).json({
      'msg': '미션을 등록 할 수 없습니다. 관리자에게 문의 하세요.'
    });
  }

  Mission.findOne({
    email: req.body.email,
    missioncomplete: false
  }, (err, user) => {
    if (err) {
      return res.status(400).json({
        'msg': err
      });
    }

    if (user) {
      //이미 미션을 등록 한 상태
      // return res.status(400).json({ 'msg': 'The user already exists' });
      return res.status(400).json({
        'msg': '이미 다른 미션을 등록 한 상태입니다. <br> (미션은 1인 1개만 등록 할 수 있습니다.)'
      });

    } else {
      //등록 한 미션이 없거나 완료가 되었을 때
      let newMission = Mission(req.body);
      newMission.save((err, user) => {
        if (err) {
          console.log(err);
          return res.status(400).json({
            'msg': err
          });
        }
        return res.status(201).json(user);
        // return res.status(201).json({
        //     token: createToken(user)
        // });

      });
      // return res.status(400).json({ 'msg': '이미 등록된 회원입니다.' });
    }


  });
};

exports.challengeSave = (req, res) => {

  //console.log("-------------------------------request-------------");
  // console.log(req.body);
  //console.log("-------------------------------response-------------" + res.body.id);


  if (!req.body.missionID || !req.body.email) {
    return res.status(400).json({
      'msg': '미션을 등록 할 수 없습니다. 관리자에게 문의 하세요.'
    });
  }

  Challenge.findOne({
    email: req.body.email,
    missioncomplete: false
  }, (err, user) => {
    if (err) {
      return res.status(400).json({
        'msg': err
      });
    }

    if (user) {
      //이미 미션을 등록 한 상태
      // return res.status(400).json({ 'msg': 'The user already exists' });
      return res.status(400).json({
        'msg': '이미 다른 미션을 등록 한 상태입니다. <br> (미션은 1인 1개만 등록 할 수 있습니다.)'
      });

    } else {
      //등록 한 미션이 없거나 완료가 되었을 때
      let newMission = Challenge(req.body);
      newMission.save((err, user) => {
        if (err) {
          console.log(err);
          return res.status(400).json({
            'msg': err
          });
        }
        return res.status(201).json(user);
        // return res.status(201).json({
        //     token: createToken(user)
        // });

      });
      // return res.status(400).json({ 'msg': '이미 등록된 회원입니다.' });
    }


  });
};


exports.registerUser = (req, res) => {
  // console.log("Register ::::::: " + JSON.stringify(req.body));
  if (!req.body.email || !req.body.password) {
    return res.status(400).json({
      'msg': '이메일, 패스워드를 입력해 주세요.'
    });
  }

  User.findOne({
    email: req.body.email
  }, (err, user) => {
    if (err) {
      return res.status(400).json({
        'msg': '사용자 정보를 찾을 수 없습니다.'
      });
    }

    if (user) {
      // return res.status(400).json({ 'msg': 'The user already exists' });
      return res.status(400).json({
        'msg': '이미 등록된 회원입니다.'
      });
    }

    let newUser = User(req.body);
    newUser.totaluserpoint = 5000;
    newUser.save((err, user) => {
      if (err) {
        return res.status(400).json({
          'msg': '회원가입이 되지 않습니다. <br/> 관리자에게 문의 해주세요.'
        });
      }
      //플리닉 샵 회원가입
      
      // return res.status(201).json(user);
      return res.status(201).json({
        token: createToken(user)
      });

    });
  });
};

exports.registerUserSnS = (req, res) => {
  console.log(":::::::::::::::::::::::" + JSON.stringify(req.body));
  // return res.status(400).json({
  //   'msg': 'SNS를 통한 로그인이 되지 않습니다. <br/>관리자에게 문의하세요'
  // });


  if (!req.body.email) {
    return res.status(400).json({
      'msg': 'SNS를 통한 로그인이 되지 않습니다. <br/>관리자에게 문의하세요'
    });
  }

  User.findOne({
    email: req.body.email
  }, (err, user) => {
    if (err) {
      return res.status(400).json({
        'msg': '사용자 정보를 찾을 수 없습니다.'
      });
    }

    if (user) {
      // return res.status(400).json({ 'msg': 'The user already exists' });
      return res.status(201).json({
        'msg': '이미 등록된 회원입니다.'
      });
    }

    let newUser = User(req.body);
    newUser.totaluserpoint = 5000;
    newUser.save((err, user) => {
      if (err) {
        return res.status(400).json({
          'msg': '회원가입이 되지 않습니다. <br/> 관리자에게 문의 해주세요.'
        });
      }
      //플리닉샵 회원가입
      request.post({
        headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
        // url : 'http://localhost/Point/PlinicAddPoint',
        url : 'https://plinicshop.com/Users/PlinicSNSSignup',
        body : "id=" + req.body.snsid +
               "&usrName=" + req.body.name + 
               "&usrPhone=" + req.phonenumber + 
               "&usrEmail=" + req.body.email + 
               "&from=" + req.body.from + 
               "&usrSex=" + req.body.gender + 
               "&usrBirthday=" + req.body.birthday + 
               "&usrSkin=" + req.body.skincomplaint,
        json : false, //헤더 값을 JSON으로 변경한다
      }, function(error, response, body){
        if(error) {
          console.log("포인트 포스트 전송 에러 발생" + error);
        }
        if(body) {
        }
        if(response) {
        }
      });


      // return res.status(201).json(user);
      return res.status(201).json({
        'user': user
      });

    });
  });
};


exports.registerUserSnStoPlinic = (req, res) => {
  console.log(":::::::::::::registerUserSnStoPlinic::::::::::" + JSON.stringify(req.body));
  // return res.status(400).json({
  //   'msg': 'SNS를 통한 로그인이 되지 않습니다. <br/>관리자에게 문의하세요'
  // });


  if (!req.body.email) {
    return res.status(400).json({
      'msg': 'SNS를 통한 로그인이 되지 않습니다. <br/>관리자에게 문의하세요'
    });
  }

  User.findOne({
    email: req.body.email
  }, (err, user) => {
    if (err) {
      return res.status(400).json({
        'msg': '사용자 정보를 찾을 수 없습니다.'
      });
    }

    if (user) {
      // return res.status(400).json({ 'msg': 'The user already exists' });
      return res.status(201).json({
        'msg': '이미 등록된 회원입니다.'
      });
    }

    let newUser = User(req.body);
    newUser.totaluserpoint = 5000;
    newUser.save((err, user) => {
      if (err) {
        return res.status(400).json({
          'msg': '회원가입이 되지 않습니다. <br/> 관리자에게 문의 해주세요.'
        });
      }
      // return res.status(201).json(user);
      return res.status(201).json({
        'user': user
      });

    });
  });
};




exports.loginUser = (req, res) => {
  if (!req.body.email || !req.body.password) {
    return res.status(400).send({
      'msg': '이메일, 패스워드를 다시 입력 해 주세요.'
    });
  }

  User.findOne({
    email: req.body.email
  }, (err, user) => {
    if (err) {
      return res.status(400).send({
        'msg': '존재하지 않는 회원입니다.'
      });
    }

    if (!user) {
      // return res.status(400).json({ 'msg': 'The user does not exist' });
      return res.status(400).json({
        'msg': '존재하지 않는 회원입니다.'
      });
    }

    user.comparePassword(req.body.password, (err, isMatch) => {
      if (isMatch && !err) {
        // console.log(JSON.stringify(user));
        return res.status(200).json({
          token: createToken(user)
        });
      } else {
        // return res.status(400).json({ msg: 'The email and password don\'t match.' });
        return res.status(400).json({
          msg: '비밀번호가 일치하지 않습니다.'
        });
      }
    });
  });
};

exports.loginUser_Kakao = (req, res) => {

  passport.use(new KakaoStrategy({
      clientID: '3fad3ed55ef1830fd6d1c10faf0d9072',
      clientSecret: '13NCCqRqTNBCcrN8vVNuyupWrH3kv6qM', // clientSecret을 사용하지 않는다면 넘기지 말거나 빈 스트링을 넘길 것
      callbackURL: '/api/auth/login/kakao/callback'
    },
    function(accessToken, refreshToken, profile, done) {
      User.findOne({
        'kakao.id': profile.id
      }, function(err, user) {
        if (!user) {
          user = new User({
            name: profile.nickname,
            email: profile.id,
            username: profile.nickname,
            provider: 'kakao',
            naver: profile._json
          });
          user.save(function(err) {
            if (err) console.log('mongoDB error : ' + err);
            return done(err, user);
          });
        } else {
          return done(err, user);
        }
      });
    }
  ));
};

exports.snsPointUpdate = (req, res) => {
  Mission.findOne({
      missionID: req.body.id,
      email: req.body.email
    },
    function(err, result) {
      var todayPoints = 0;
      var minusPoints = 0;
      var usePoints = 0;
      var snsPoint = Number(req.body.snsPoint);
      // var totalUseTime = req.body.points;
      // console.log("updatedAt : " + result.usedmission[0].updatedAt.getDate());

      // 오늘 사용했던 시간 + 현재 사용한 시간이 1분30초(90초가 넘는지 확인 하는 로직)

      // 날짜비교 로직 ----------------------------------------------------------------------------------------//
      // for (var i = 0; i < result.usedmission.length; i++) {
      //   // console.log(getFormattedDate(new Date()));
      //   if (getFormattedDate(result.usedmission[i].updatedAt) == getFormattedDate(new Date())) {
      //     // for (var k = 0; k < result.usedmission[k].points; k++){
      //     // console.log("점수 : " + result.usedmission[i].points);
      //     todayPoints = todayPoints + Number(result.usedmission[i].points);
      //     // console.log(todayPoints);
      //     // }
      //   }
      // }
      //----------------------------------------------------------------------------------------//

      // console.log("total points : " + todayPoints);
      //총 사용시간과 현재 사용시간을 합쳐도 1분30초(90초)가 안넘어 갈때
      // console.log("9분을 안넘어감");
      var newPoint = req.body
      newPoint.updatedAt = new Date();
      Mission.update({
        missionID: req.body.id,
        email: req.body.email
      }, {
        // $push: {
        //   usedmission: newPoint
        // },
        $inc: { //미션당 사용사긴 외에 일반적인 플리닉의 총 사용시간도 구해야 함 20191028
          "usetime": snsPoint
        }
      }, function(err, post2) {
        if (err) {
          // console.log("tags error : " + err);
          return res.status(400).json(err);
        } else {
          // User.findOneAndUpdate({
          //     email: req.body.email
          //   }, {
          //     $inc: {
          //       totalusetime: req.body.points
          //     }
          //   },
          //   function(err, response) {
          //     if (err) {
          //       res.json(0);
          //     } else {
          //       // res.json(response.credit);
          //     }
          //   });
          return res.status(201).json({
            'msg': 'SNS 보너스 시간을 획득 하였습니다.'
          });
        }
      });
    });
}


exports.challengeUpdate2 = (req, res) => {
  // console.log("start");
  // console.log("email : " + req.body.email);
  // console.log("id : " + req.body.id);
  // console.log("points : " + req.body.points);

  Challenge.findOne({
      missionID: req.body.id,
      email: req.body.email
    },
    function(err, result) {
      var todayPoints = 0;
      var minusPoints = 0;
      var usePoints = 0;
      var totalUseTime = req.body.points;
      var isupdate = true;
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

      for (var i = 0; i < result.dailycheck.length; i++) {
        if (getFormattedDate(result.dailycheck[i].updatedAt) == getFormattedDate(new Date())) {
          // 같은날 챌린지가 업데이트 되는건지 확인
          isupdate = false;
        }
      }

      if(todayPoints < 119) {
        //하루 2분을 안넘겼을대 로직을 짠다
        if((todayPoints + Number(req.body.points)) >= 119){
          //현재 누적한 시간을 포함해서 2분을 넘겼을때 로직 (배열에 저장과 동시에 챌린지 카운트 배열에 별도 저장)
          var newPoint = req.body
          newPoint.points = req.body.points;
          newPoint.updatedAt = new Date();

          var dailycheck = {
            isdaily : true,
            updatedAt : new Date(),
            status: "챌린지 성공"
          }
          if(isupdate){
            Challenge.update({
              missionID: req.body.id,
              email: req.body.email
            },{
              $push: {
                dailycheck: dailycheck,
                usedmission: newPoint
              },
              $inc: {
                "usetime": req.body.points
              }
            },function(err, reulst){
              if(err) {
                return res.status(400).json(err);
              } else {
                return res.status(201).json({
                  'msg': '오늘 사용시간 2분을 초과 하여 <br> 챌린지 도전에 성공하였습니다.'
                });
              }
            })
          } else {
            return res.status(201).json({
              'msg': '오늘 사용시간 2분을 초과 하여 <br> 챌린지 도전에 성공하였습니다!.'
            });
          }
        } else {
          //오늘 마지막 누적 사용시간을 다 해도 2분은 안넘겼을때 로직(시간 배열에 일반 저장)
          var newPoint = req.body
          newPoint.points = req.body.points;
          newPoint.updatedAt = new Date();

          Challenge.update({
            missionID: req.body.id,
            email: req.body.email
          },{
            $push: {
              usedmission: newPoint
            },
            $inc: {
              "usetime": req.body.points
            }
          },function(err, reulst){
            if(err) {
              return res.status(400).json(err);
            } else {
              return res.status(201).json({
                'msg': '조금 더(2분) 을 사용하여 <br> 챌린지 도전에 성공하세요.'
              });
            }
          })
        }
      } else {
        //하루 2분을 넘겼을때를 처리 한다.(오늘할 챌리지를 모두 하였으니 내일 하라는 알람 메세지를 전송)
        return res.status(201).json({
          'msg': '오늘 챌린지를 모두 달성하였습니다. <br> 내일 다시 챌린지를 도전하세요.'
        });
      }

      // // console.log("total points : " + todayPoints);
      // if (todayPoints < 90) { //하루 1분30초를 넘어가면
      //   if ((todayPoints + Number(req.body.points)) > 90) {
      //     // console.log("9분을 넘어감");
      //     // console.log((todayPoints + Number(req.body.points)) - 90)
      //
      //     //만일 사용시간이 이번 누적으로 9분이 초과 하면 9분만 누적하는 로직
      //     minusPoints = (todayPoints + Number(req.body.points)) - 90
      //     usePoints = Number(req.body.points) - minusPoints
      //     // console.log("적립되어야 할 포인트 : " + usePoints);
      //     var newPoint = req.body
      //     newPoint.points = usePoints;
      //     newPoint.updatedAt = new Date();
      //     Challenge.update({
      //       missionID: req.body.id,
      //       email: req.body.email
      //     }, {
      //       $push: {
      //         usedmission: newPoint
      //       },
      //       $inc: { //미션당 사용 시간 외에 일반적인 플리닉의 총 사용시간도 구해야 함 20191028
      //         "usetime": usePoints
      //       }
      //     }, function(err, post2) {
      //       if (err) {
      //         // console.log("tags error : " + err);
      //         return res.status(400).json(err);
      //       } else {
      //         User.findOneAndUpdate({
      //             email: req.body.email
      //           }, {
      //             $push : {
      //               userpoint: newPoint
      //             },
      //             $inc: {
      //               totalusetime: req.body.points,
      //               totaluserpoint: req.body.points
      //             }
      //           },
      //           function(err, response) {
      //             if (err) {
      //               res.json(0);
      //             } else {
      //               // res.json(response.credit);
      //             }
      //           });
      //         // return res.status(201).json(post2);
      //         return res.status(201).json({
      //           'msg': '플리닉 오늘 누적 사용시간이 9분을 초과하여 <br>' + getSecondsAsDigitalClock(usePoints) + ' 초만 누적되었습니다. <br> 내일 다시 사용해 주세요 <br> 감사합니다'
      //         });
      //       }
      //     });
      //   } else { //총 사용시간과 현재 사용시간을 합쳐도 1분30초(90초)가 안넘어 갈때
      //     // console.log("9분을 안넘어감");
      //     var newPoint = req.body
      //     newPoint.updatedAt = new Date();
      //     Challenge.update({
      //       missionID: req.body.id,
      //       email: req.body.email
      //     }, {
      //       $push: {
      //         usedmission: newPoint
      //       },
      //       $inc: { //미션당 사용사긴 외에 일반적인 플리닉의 총 사용시간도 구해야 함 20191028
      //         "usetime": req.body.points
      //       }
      //     }, function(err, post2) {
      //       if (err) {
      //         // console.log("tags error : " + err);
      //         return res.status(400).json(err);
      //       } else {
      //         User.findOneAndUpdate({
      //             email: req.body.email
      //           }, {
      //             $push: {
      //               userpoint: newPoint
      //             },
      //             $inc: {
      //               totalusetime: req.body.points,
      //               totaluserpoint: req.body.points
      //             }
      //           },
      //           function(err, response) {
      //             if (err) {
      //               res.json(0);
      //             } else {
      //               // res.json(response.credit);
      //             }
      //           });
      //         return res.status(201).json({
      //           'msg': '사용시간 ' + getSecondsAsDigitalClock(req.body.points) + '초가 누적되었습니다. <br> 오늘 누적 사용시간 : ' + getSecondsAsDigitalClock(todayPoints + Number(req.body.points))
      //         });
      //       }
      //     });
      //   }
      // } else {
      //   var newPoint;
      //   newPoint.points = req.body.points;
      //   newPoint.updatedAt = new Date();
      //   User.findOneAndUpdate({
      //       email: req.body.email
      //     }, {
      //       $push: {
      //         userpoint: newPoint
      //       },
      //       $inc: {
      //         totalusetime: req.body.points,
      //         totaluserpoint: req.body.points
      //       }
      //     },
      //     function(err, response) {
      //       if (err) {
      //         res.json(0);
      //       } else {
      //         // res.json(response.credit);
      //       }
      //     });
      //   return res.status(400).json({
      //     'msg': '오늘은 플리닉을 9분간 사용하여 <br> 누적이 되지 않습니다. <br> 내일 다시 사용해 주세요 <br> 감사합니다'
      //   });
      //   // console.log("오늘자로 9분을 모두 사용하여 누적이 되지 않습니다.");
      //   // return res.status(200).json();
      // }
    });
}





exports.challengeUpdate = (req, res) => {
  console.log("start");
  console.log("email : " + req.body.email);
  console.log("id : " + req.body.id);
  console.log("points : " + req.body.points);

  Challenge.findOne({
      missionID: req.body.id,
      email: req.body.email
    },
    function(err, result) {
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
      if (todayPoints < 90) { //하루 9분을 넘어가면
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
          }, function(err, post2) {
            if (err) {
              // console.log("tags error : " + err);
              return res.status(400).json(err);
            } else {
              User.findOneAndUpdate({
                  email: req.body.email
                }, {
                  $push : {
                    userpoint: newPoint
                  },
                  $inc: {
                    totalusetime: req.body.points,
                    totaluserpoint: req.body.points
                  }
                },
                function(err, response) {
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
          // console.log("1분30초를 안넘어감");
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
          }, function(err, post2) {
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
                function(err, response) {
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
        var newPoint;
        newPoint.points = req.body.points;
        newPoint.updatedAt = new Date();
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
          function(err, response) {
            if (err) {
              res.json(0);
            } else {
              // res.json(response.credit);
            }
          });
        return res.status(400).json({
          'msg': '오늘은 플리닉을 9분간 사용하여 <br> 누적이 되지 않습니다. <br> 내일 다시 사용해 주세요 <br> 감사합니다'
        });
        // console.log("오늘자로 9분을 모두 사용하여 누적이 되지 않습니다.");
        // return res.status(200).json();
      }
    });
}

exports.pointUpdate = (req, res) => {
  // console.log("start");
  // console.log("email : " + req.body.email);
  // console.log("id : " + req.body.id);
  // console.log("points : " + req.body.points);

  Mission.findOne({
      missionID: req.body.id,
      email: req.body.email
    },
    function(err, result) {
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
          Mission.update({
            missionID: req.body.id,
            email: req.body.email
          }, {
            $push: {
              usedmission: newPoint
            },
            $inc: { //미션당 사용 시간 외에 일반적인 플리닉의 총 사용시간도 구해야 함 20191028
              "usetime": usePoints
            }
          }, function(err, post2) {
            if (err) {
              // console.log("tags error : " + err);
              return res.status(400).json(err);
            } else {
              User.findOneAndUpdate({
                  email: req.body.email
                }, {
                  $inc: {
                    totalusetime: req.body.points
                  }
                },
                function(err, response) {
                  if (err) {
                    res.json(0);
                  } else {
                    // res.json(response.credit);
                  }
                });
              // return res.status(201).json(post2);
              return res.status(201).json({
                'msg': '오늘 누적 사용시간이 90초를 초과하여 <br>' + getSecondsAsDigitalClock(usePoints) + ' 초만 누적되었습니다. <br> 내일 다시 사용해 주세요 <br> 감사합니다'
              });
            }
          });
        } else { //총 사용시간과 현재 사용시간을 합쳐도 1분30초(90초)가 안넘어 갈때
          // console.log("9분을 안넘어감");
          var newPoint = req.body
          newPoint.updatedAt = new Date();
          Mission.update({
            missionID: req.body.id,
            email: req.body.email
          }, {
            $push: {
              usedmission: newPoint
            },
            $inc: { //미션당 사용사긴 외에 일반적인 플리닉의 총 사용시간도 구해야 함 20191028
              "usetime": req.body.points
            }
          }, function(err, post2) {
            if (err) {
              // console.log("tags error : " + err);
              return res.status(400).json(err);
            } else {
              User.findOneAndUpdate({
                  email: req.body.email
                }, {
                  $inc: {
                    totalusetime: req.body.points
                  }
                },
                function(err, response) {
                  if (err) {
                    res.json(0);
                  } else {
                    // res.json(response.credit);
                  }
                });
              return res.status(201).json({
                'msg': '오늘 적립된 포인트 : ' + todayPoints + Number(req.body.points) + 'P<br>(최대 적립 가능 포인트 : 90P)' 
                // 'msg': '사용시간 ' + getSecondsAsDigitalClock(req.body.points) + '초가 누적되었습니다. <br> 오늘 누적 사용시간 : ' + getSecondsAsDigitalClock(todayPoints + Number(req.body.points))
              });
            }
          });
        }
      } else {
        User.findOneAndUpdate({
            email: req.body.email
          }, {
            $inc: {
              totalusetime: req.body.points
            }
          },
          function(err, response) {
            if (err) {
              res.json(0);
            } else {
              // res.json(response.credit);
            }
          });
        return res.status(400).json({
          'msg': '오늘은 플리닉을 9분간 사용하여 <br> 누적이 되지 않습니다. <br> 내일 다시 사용해 주세요 <br> 감사합니다'
        });
        // console.log("오늘자로 9분을 모두 사용하여 누적이 되지 않습니다.");
        // return res.status(200).json();

      }
      // var newPoint = req.body
      // newPoint.updatedAt = new Date();
      // Mission.update({
      //   missionID: req.body.id,
      //   email: req.body.email
      // }, {
      //   $push: {
      //     usedmission: newPoint
      //   }, $inc: { "usetime": req.body.points}
      // }, function(err, post2) {
      //   if (err) {
      //     console.log("tags error : " + err);
      //     return res.status(400).json(err);
      //   } else {
      //     // console.log("result tags : " + JSON.stringify(post2));
      //     return res.status(201).json(post2);
      //   }
      // });

      // if (result) {
      //   result.body = "플리닉으로 매일 1회(최대 9분)";
      //   result.save();
      //   console.log(result.body);
      //   console.log("result : " + result);
      //   return res.status(201).json(result);
      // }
      // if (err) {
      //   console.log("err : " + err)
      //   return res.status(400).json(err);
      // }

    });


  // User.findOneAndUpdate({ email : req.body.email }), { $inc: { "totalusetime": req.body.points } }, function(err, usetime){
  //   console.log("222");
  //   if(err){
  //     console.log("error : " + err);
  //     return res.status(400).json(err);
  //   }
  //   if(usetime) {
  //     console.log("성공 " + usetime);
  //   }
  // }
}

exports.useTimeUpdate = (req, res) => {
  User.findOneAndUpdate({
      email: req.body.email
    }, {
      $inc: {
        totalusetime: req.body.points
      }
    },
    function(err, response) {
      if (err) {
        res.json(0);
      } else {
        return res.status(201).json({
          'msg': '사용시간 ' + getSecondsAsDigitalClock(req.body.points) + '초가 누적되었습니다.'
        });
      }
    });
}

exports.userPointUpdate = (req, res) => {
  User.findOneAndUpdate({
      email: req.body.email
    }, {
      $inc: {
        totaluserpoint: req.body.points
      }
    },
    function(err, response) {
      if (err) {
        res.json(0);
      } else {
        return res.status(201).json({
          'msg': '사용시간 ' + getSecondsAsDigitalClock(req.body.points) + '초가 누적되었습니다.'
        });
      }
    });
}



exports.updateUserNickname = (req, res) => {
  User.findOneAndUpdate({
      email: req.body.email
    }, {
      name: req.body.nickname
    },
    function(err, response) {
      if (err) {
        res.json(0);
      } else {
        return res.status(201).json({
          "msg": "회원님의 닉네임이 저장 되었습니다. \\n\\n 로그아웃 후 로그인 하시면 닉네임이 변경됩니다."
        });
      }
    });
}

exports.updateUserSkinComplaint = (req, res) => {
  User.findOneAndUpdate({
      email: req.body.email
    }, {
      skincomplaint: req.body.skincomplaint
    },
    function(err, response) {
      if (err) {
        res.json(0);
      } else {
        return res.status(201).json({
          "msg": "회원님의 닉네임이 저장 되었습니다. <br> 로그아웃 후 로그인 하시면 닉네임이 변경됩니다."
        });
      }
    });
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



exports.challengePointUpdate = (req, res) => {
  // console.log("start");
  // console.log("email : " + req.body.email);
  // console.log("id : " + req.body.id);
  // console.log("points : " + req.body.points);

  Challenge.findOne({
      missionID: req.body.id,
      email: req.body.email
    },
    function(err, result) {
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
          }, function(err, post2) {
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
                function(err, response) {
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
          }, function(err, post2) {
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
                function(err, response) {
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
          function(err, response) {
            if (err) {
              res.json(0);
            } else {
            }
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
  },function(err, result) {
      var todayPoints = 0;
      var minusPoints = 0;
      var usePoints = 0;

      // 오늘 사용했던 시간 + 현재 사용한 시간이 1분30초(90P초가 넘는지 확인 하는 로직)
      for (var i = 0; i < result.userpoint.length; i++) {
        if (getFormattedDate(result.userpoint[i].updatedAt) == getFormattedDate(new Date())) {
          //날짜가 오늘이여야 하고
          if(result.userpoint[i].status == 'true') {
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
        }, function(err, post2) {
          if (err) {
            // console.log("tags error : " + err);
            return res.status(400).json(err);
          } else {
            request.post({
              headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
              // url : 'http://localhost:50082/Point/PlinicAddPoint',
              url : 'http://plinicshop.com:50082/Point/PlinicAddPoint',
              body : 'id=' + req.body.email +
                     "&point=" +  usePoints +
                     "&expire=" + 1096,
              json : false, //헤더 값을 JSON으로 변경한다
            }, function(error, response, body){
              if(error) {
                console.log("포인트 포스트 전송 에러 발생" + error);
              }
              if(body) {
              }
              if(response) {
              }
            });
            return res.status(201).json({
              'point': usePoints +'P 획득 완료!',
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
        }, function(err, post2) {
          if (err) {
            // console.log("tags error : " + err);
            return res.status(400).json(err);
          } else {
            request.post({
              headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
              // url : 'http://localhost:50082/Point/PlinicAddPoint',
              url : 'http://plinicshop.com:50082/Point/PlinicAddPoint',
              body : 'id=' + req.body.email +
                     "&point=" +  req.body.points +
                     "&expire=" + 1096,
              json : false, //헤더 값을 JSON으로 변경한다
            }, function(error, response, body){
              if(error) {
                console.log("포인트 포스트 전송 에러 발생" + error);
              }
              if(body) {
              }
              if(response) {
              }
            });
            return res.status(201).json({
              'point': req.body.points +'P 획득 완료!',
              'msg': '오늘 적립된 포인트 : ' + (Number(todayPoints) + Number(req.body.points))+ 'P <br>(최대적립 가능 포인트 : 90P)'
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
        function(err, response) {
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


exports.loadUser = (req, res) => {
  // console.log(req.body.email);
  if (!req.body.email) {
    return res.status(400).send({
      'msg': '이메일, 패스워드를 다시 입력 해 주세요.'
    });
  }

  User.findOne({
    email: req.body.email
  }, (err, user) => {
    if (err) {
      return res.status(400).send({
        'msg': '존재하지 않는 회원입니다.'
      });
    }

    if (!user) {
      // return res.status(400).json({ 'msg': 'The user does not exist' });
      return res.status(400).json({
        'msg': '존재하지 않는 회원입니다.'
      });
    } else {
      return res.status(200).json({
        user
      });
    }
  });
};


exports.saveMyMainProduct = (req, res) => { 
  console.log("main" + JSON.stringify(req.body.product));
  User.update({
    email : req.body.email
  }, {
    $push: {
      mainproduct : req.body.product
    }
  }, function(err, result2){
    if(err) {
      return res.status(400).json(err);
    } else {
      return res.status(201).json({
        'msg': '메인 화장품 저장!!'
      });
    }
  });
};

exports.saveSubMainProduct = (req, res) => { 
  console.log("sub" + JSON.stringify(req.body.product));
  User.update({
    email : req.body.email
  }, {
    $push: {
      subproduct : req.body.product
    }
  }, function(err, result2){
    if(err) {
      return res.status(400).json(err);
    } else {
      return res.status(201).json({
        'msg': '서브 화장품 저장!!'
      });
    }
  });
};

exports.delAndSaveMyMainProduct = (req, res) => { 
  console.log("main" + JSON.stringify(req.body.product));
  User.update({
    email : req.body.email
  }, {
    $pop: {
      mainproduct : -1
    }
  }, function(err, result2){
    if(err) {
      return res.status(400).json(err);
    } else {
      User.update({
        email : req.body.email
      }, {
        $push: {
          mainproduct : req.body.product
        }
      }, function(err, result2){
        if(err) {
          return res.status(400).json(err);
        } else {
          return res.status(201).json({
            'msg': '서브 화장품 지우고 저장!!'
          });
        }
      });
    }
  });
};

exports.delAndSaveSubMainProduct = (req, res) => { 
  console.log("sub" + JSON.stringify(req.body.product));
  User.update({
    email : req.body.email
  }, {
    $pop: {
      subproduct : -1
    }
  }, function(err, result2){
    if(err) {
      return res.status(400).json(err);
    } else {
      User.update({
        email : req.body.email
      }, {
        $push: {
          subproduct : req.body.product
        }
      }, function(err, result2){
        if(err) {
          return res.status(400).json(err);
        } else {
          return res.status(201).json({
            'msg': '서브 화장품 지우고 저장!!'
          });
        }
      });
    }
  });
};

