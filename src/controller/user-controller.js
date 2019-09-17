var User = require('../models/user');
var Mission = require('../models/Mission');
var jwt = require('jsonwebtoken');
var config = require('../config/config');
var passport = require('passport');
var KakaoStrategy = require('passport-kakao').Strategy;

function createToken(user) {
  return jwt.sign({
    id: user.id,
    email: user.email,
    name: user.name,
    pushtoken : user.pushtoken
  }, config.jwtSecret, {
    //expiresIn: 200 // 86400 expires in 24 hours
    expiresIn: 86400 // 86400 expires in 24 hours
  });
}

exports.missionSave = (req, res) => {

  //console.log("-------------------------------request-------------");
  console.log(req.body);
  //console.log("-------------------------------response-------------" + res.body.id);


  if (!req.body.missionID || !req.body.email) {
    return res.status(400).json({
      'msg': '미션을 등록 할 수 없습니다. 관리자에게 문의 하세요.'
    });
  }

  Mission.findOne({
    email: req.body.email
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
      //등록 한 미션이 없을 때
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


exports.registerUser = (req, res) => {
  console.log("Register ::::::: " + req);
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
    newUser.save((err, user) => {
      if (err) {
        return res.status(400).json({
          'msg': '회원가입이 되지 않습니다. <br/> 관리자에게 문의 해주세요.'
        });
      }

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
    newUser.save((err, user) => {
      if (err) {
        return res.status(400).json({
          'msg': '회원가입이 되지 않습니다. <br/> 관리자에게 문의 해주세요.'
        });
      }

      // return res.status(201).json(user);
      return res.status(201).json({
        'user' : user
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
      // console.log("updatedAt : " + result.usedmission[0].updatedAt.getDate());

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
      if (todayPoints < 540) {
        if ((todayPoints + Number(req.body.points)) > 540) {
          // console.log("9분을 넘어감");
          // console.log((todayPoints + Number(req.body.points)) - 540)
          minusPoints = (todayPoints + Number(req.body.points)) - 540
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
            $inc: {
              "usetime": usePoints
            }
          }, function(err, post2) {
            if (err) {
              // console.log("tags error : " + err);
              return res.status(400).json(err);
            } else {
              // return res.status(201).json(post2);
              return res.status(201).json({
                'msg': '플리닉 오늘 누적 사용시간이 9분을 초과하여 <br>' + getSecondsAsDigitalClock(usePoints) + ' 초만 누적되었습니다. <br> 내일 다시 사용해 주세요 <br> 감사합니다'
              });
            }
          });
        } else { //총 사용시간과 현재 사용시간을 합쳐도 9분(540초)가 안넘어 갈때
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
            $inc: {
              "usetime": req.body.points
            }
          }, function(err, post2) {
            if (err) {
              // console.log("tags error : " + err);
              return res.status(400).json(err);
            } else {
              return res.status(201).json({
                'msg': '플리닉 사용시간 ' + getSecondsAsDigitalClock(req.body.points) + '초가 누적되었습니다. <br> 오늘 누적 사용시간 : ' +getSecondsAsDigitalClock(todayPoints + Number(req.body.points))
              });
            }
          });
        }
      } else {
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
