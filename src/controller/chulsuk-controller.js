var User = require('../models/user');
var Mission = require('../models/Mission');
var Challenge = require('../models/Challenge');
var Chulsuk = require('../models/Chulsuk');
var config = require('../config/config');

exports.chulsukSave = (req, res) => {

  if (!req.body.email) {
    return res.status(400).json({
      'msg': '출석체크 서버에 문제가 발생했습니다<br> 잠시 후 다시 출첵 해주세요.'
    });
  }

  Chulsuk.findOne({
      email: req.body.email
    },
    function(err, result) {
      if (result) {
        // for (var i = 0; i < result.chulcheck.length; i++) {
          if (getFormattedDate(result.chulcheck[(result.chulcheck.length)-1].updatedAt) == getFormattedDate(new Date())) {
            return res.status(400).json({
              'msg': '하루 두번 출석 할 수 없습니다!!'
            });
          } else {
            //오늘 날짜가 발견되지 않았으면 업데이트 실시
            var newChulsuk = req.body.chulcheck
            Chulsuk.update({
              email: req.body.email
            }, {
              $push: {
                chulcheck: newChulsuk
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
                    userpoint : {point: 10, updatedAt: new Date(), status: 'chulsuk'}
                  }, $inc: { //미션당 사용사긴 외에 일반적인 플리닉의 총 사용시간도 구해야 함 20191028
                    "totaluserpoint": 10
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
        let newMission = Chulsuk(req.body);
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
                userpoint : {point: 10, updatedAt: new Date(), status: 'chulsuk'}
              }, $inc: { //미션당 사용사긴 외에 일반적인 플리닉의 총 사용시간도 구해야 함 20191028
                "totaluserpoint": 10
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

      // 오늘 사용했던 시간 + 현재 사용한 시간이 1분 30초(90초가 넘는지 확인 하는 로직)

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
      //총 사용시간과 현재 사용시간을 합쳐도 1분 30초(90초)가 안넘어 갈때
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
                'msg': '사용시간 ' + getSecondsAsDigitalClock(req.body.points) + '초가 누적되었습니다. <br> 오늘 누적 사용시간 : ' + getSecondsAsDigitalClock(todayPoints + Number(req.body.points))
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
        if (getFormattedDate(result.usedmission[i].updatedAt) == getFormattedDate(new Date())) { //오늘날짜 비교 하는 로직
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
                'msg': '플리닉 오늘 누적 사용시간이 9분을 초과하여 <br>' + getSecondsAsDigitalClock(usePoints) + ' 초만 누적되었습니다. <br> 내일 다시 사용해 주세요 <br> 감사합니다'
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
                'msg': '사용시간 ' + getSecondsAsDigitalClock(req.body.points) + '초가 누적되었습니다. <br> 오늘 누적 사용시간 : ' + getSecondsAsDigitalClock(todayPoints + Number(req.body.points))
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
