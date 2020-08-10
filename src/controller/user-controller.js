var User = require('../models/user');
var Mission = require('../models/Mission');
var Challenge = require('../models/Challenge');
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
    totaluserpoint: user.totaluserpoint,
    ispush: user.ispush,
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
      //플리닉샵 회원가입1
      request.post({
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        // url : 'http://localhost/Point/PlinicAddPoint',
        url: 'https://plinicshop.com/Users/PlinicSNSSignup',
        body: "id=" + req.body.snsid +
          "&usrName=" + req.body.name +
          "&usrPhone=" + req.phonenumber +
          "&usrEmail=" + req.body.email +
          "&from=" + req.body.from +
          "&usrSex=" + req.body.gender +
          "&usrBirthday=" + req.body.birthday +
          "&usrSkin=" + req.body.skincomplaint,
        json: false, //헤더 값을 JSON으로 변경한다
      }, function (error, response, body) {
        if (error) {
          console.log("포인트 포스트 전송 에러 발생" + error);
        }
        if (body) {}
        if (response) {}
      });
      // return res.status(201).json(user);
      return res.status(201).json({
        'user': user
      });

    });
  });
};

exports.checkUser = (req, res) => {
  if (!req.body.email && !req.body.password) {
    return res.status(400).json({
      'msg': "아이디, 비밀번호가 부정확합니다."
    });
  }
  User.findOne({
    email: req.body.email
  }, (err, user) => {
    if (err) {
      return res.status(400).json({
        'msg': "사용자 정보 찾기 에러<br>관리자에게 문의해주세요"
      });
    }
    if (user) {
      return res.status(400).json({
        'msg': "이미 가입되어 있는 사용자 입니다"
      });
    }
    return res.status(200).json({
      'msg': "회원가입 가능"
    });
  })
}

exports.billings = async (req, res) => {
  console.log(new Date(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDay() + 2, 12) / 1000);
  console.log(new Date().getDay());
  // console.log(Math.floor(new Date((new Date().getDay()+30 / 1000))));
  // console.log("빌링키 초기 값 : " + JSON.stringify(req.body));
  // var imp_uid = req.body.imp_uid;
  // var merchant_uid = req.body.merchant_uid;
  // // if(!req.body.email && !req.body.password) {
  // //   return res.status(400).json({
  // //     'msg' : "아이디, 비밀번호가 부정확합니다."
  // //   });
  // // }

  // const getToken = await axios({
  //   url: "https://api.iamport.kr/users/getToken",
  //   method: "post", // POST method
  //   headers: { "Content-Type": "application/json" }, // "Content-Type": "application/json"
  //   data: {
  //     imp_key: "1961322186640885", // REST API키
  //     imp_secret: "IvcgNbZT5D5qVlAO1ge162zjx0Ns2N9Lil15x1ZCE53AqDorTDsZG2je36G5UQQdcSiJTimynp9O3xfW" // REST API Secret
  //   }
  // });
  // const { access_token } = getToken.data.response; // 인증 토큰
  // // console.log(access_token);
  // // console.log("access_token : " + JSON.stringify(getToken.data.response));


  // const getPaymentData = await axios({
  //   url: `https://api.iamport.kr/payments/` + paymentResult.data.response.imp_uid, // imp_uid 전달
  //   method: "get", // GET method
  //   headers: { "Authorization": access_token } // 인증 토큰 Authorization header에 추가
  // });
  // const paymentData = getPaymentData.data.response; // 조회한 결제 정보
  // console.log("결제 정보 : " + JSON.stringify(paymentData));
  // const { status } = paymentData;
  // const { code, message } = paymentResult;

  // const paymentResult = await axios({
  //   url: `https://api.iamport.kr/subscribe/payments/again`,
  //   method: "post",
  //   headers: { "Authorization": access_token }, // 인증 토큰 Authorization header에 추가
  //   data: {
  //     customer_uid: getPaymentData.customer_uid, //휴대폰 앱에서 카드 정보를 넣을 다시에 customer ID
  //     merchant_uid: 'mid_' + new Date().getTime(), // 새로 생성한 결제(재결제)용 주문 번호
  //     amount: 1000,
  //     name: "플리닉 월간 이용권 정기결제"
  //   }
  // });



  // if (paymentResult.data.code == 0) { // 카드사 통신에 성공(실제 승인 성공 여부는 추가 판단이 필요합니다.)
  //   if ( paymentResult.data.response.status == "paid" ) { //카드 정상 승인
  //     console.log("paid처리");
  //     const scheResult = await axios({
  //       url: `https://api.iamport.kr/subscribe/payments/schedule`,
  //       method: "post",
  //       headers: { "Authorization": access_token }, // 인증 토큰 Authorization header에 추가
  //       data: {
  //         customer_uid: getPaymentData.customer_uid, // 카드(빌링키)와 1:1로 대응하는 값
  //         schedules: [
  //           {
  //             merchant_uid: 'mid_' + new Date().getTime()+1, // 주문 번호
  //             schedule_at: new Date(new Date().getDay() + 30).getTime(), // 결제 시도 시각 in Unix Time Stamp. ex. 다음 달 1일
  //             amount: 1000,
  //             name: "플리닉 다음달 월간 이용권 정기결제",
  //           }
  //         ]
  //       }
  //     });
  //     // console.log("스케쥴 결과 : " + JSON.stringify(scheResult));
  //   } else { //카드 승인 실패 (ex. 고객 카드 한도초과, 거래정지카드, 잔액부족 등)
  //     //paymentResult.status : failed 로 수신됩니다.
  //     console.log("222222처리");
  //     res.send({ 
  //       // ... 
  //     });
  //   }
  //   return res.status(200).json({
  //     'msg' : "카드 결제 처리 완료"
  //   });
  // } else { // 카드사 요청에 실패 (paymentResult is null)
  //   console.log("카드사 요청 처리 실패");
  //   res.send({ 
  //     // ... 
  //   });
  // }

  // // const getPaymentData = await axios({
  // //   url: `https://api.iamport.kr/payments/` + imp_uid, // imp_uid 전달
  // //   method: "get", // GET method
  // //   headers: { "Authorization": access_token } // 인증 토큰 Authorization header에 추가
  // // });
  // // const paymentData = getPaymentData.data.response; // 조회한 결제 정보

  // // console.log(JSON.stringify(paymentData));
}

exports.billingSchedule = async (req, res) => {

  //-----------------------초기 세팅 시작 ---------------------------------
  console.log("초기 값 : " + JSON.stringify(req.body));
  const {
    imp_uid,
    merchant_uid
  } = req.body;
  console.log("전달된: " + imp_uid);
  // 액세스 토큰(access token) 발급 받기
  const getToken = await axios({
    url: "https://api.iamport.kr/users/getToken",
    method: "post", // POST method
    headers: {
      "Content-Type": "application/json"
    }, // "Content-Type": "application/json"
    data: {
      imp_key: "1961322186640885", // REST API키
      imp_secret: "IvcgNbZT5D5qVlAO1ge162zjx0Ns2N9Lil15x1ZCE53AqDorTDsZG2je36G5UQQdcSiJTimynp9O3xfW" // REST API Secret
    }
  });
  const {
    access_token
  } = getToken.data.response; // 인증 토큰
  //-----------------------초기 세팅 종료---------------------------------


  //------------------------결제 정보 확인 시작  ------------------------------
  // imp_uid로 아임포트 서버에서 결제 정보 조회
  /* ...중략 ... */
  const getPaymentData = await axios({
    url: `https://api.iamport.kr/payments/` + imp_uid, // imp_uid 전달
    method: "get", // GET method
    headers: {
      "Authorization": access_token
    } // 인증 토큰 Authorization header에 추가
  });
  const paymentData = getPaymentData.data.response; // 조회한 결제 정보
  console.log("초기 정보  : " + JSON.stringify(getPaymentData.data));
  console.log("결제 정보 : " + JSON.stringify(paymentData));
  //------------------------결제 정보 확인 종료  ------------------------------


  //------------------------빌링 고객인지 확인이 되면 결제 초기 결제 진행 시작----------------------------
  if (paymentData.status == "paid") { // 결제 완료
    console.log("스케줄 시작");
    if (paymentData.amount == '0') {
      console.log("초기 결제 진행");
      const paymentResult = await axios({
        url: `https://api.iamport.kr/subscribe/payments/again`,
        method: "post",
        headers: {
          "Authorization": access_token
        }, // 인증 토큰 Authorization header에 추가
        data: {
          customer_uid: paymentData.customer_uid, //휴대폰 앱에서 카드 정보를 넣을 다시에 customer ID
          merchant_uid: 'mid_' + new Date().getTime(), // 새로 생성한 결제(재결제)용 주문 번호
          amount: 1000,
          name: "플리닉 월간 이용권 정기결제"
        }
      });
    } else { //--------------------초기 결제가 아닐대 스케쥴 잡기
      console.log("다음달 유닉스 시간 : " + Math.floor(new Date(new Date().getDay() + 30).getTime() / 1000))
      axios({
        url: `https://api.iamport.kr/subscribe/payments/schedule`,
        method: "post",
        headers: {
          "Authorization": access_token
        }, // 인증 토큰 Authorization header에 추가
        data: {
          customer_uid: paymentData.customer_uid, // 카드(빌링키)와 1:1로 대응하는 값
          schedules: [{
            merchant_uid: 'mid_' + new Date().getTime(), // 주문 번호
            schedule_at: new Date(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDay() + 2, 12) / 1000, //1596711600 // 결제 시도 시각 in Unix Time Stamp. ex. 다음 달 1일
            amount: 2000,
            name: "월간 이용권 정기결제",
          }]
        }
      });
    }
    // DB에 결제 정보 저장
    // await Orders.findByIdAndUpdate(merchant_uid, { $set: paymentData }); // Mongoose
    // 새로운 결제 예약
    console.log("스케줄 종료");
  } else {
    // 재결제 시도
  }
}

exports.billingCancel = async (req, res) => {

  //-----------------------초기 세팅 시작 ---------------------------------
  console.log("초기 값 : " + JSON.stringify(req.body));
  const { customer_uid, merchant_uid } = req.body;
  console.log("전달된 customer_uid : " + customer_uid);
  // 액세스 토큰(access token) 발급 받기
  const getToken = await axios({
    url: "https://api.iamport.kr/users/getToken",
    method: "post", // POST method
    headers: {
      "Content-Type": "application/json"
    }, 
    data: {
      imp_key: "1961322186640885", // REST API키
      imp_secret: "IvcgNbZT5D5qVlAO1ge162zjx0Ns2N9Lil15x1ZCE53AqDorTDsZG2je36G5UQQdcSiJTimynp9O3xfW" // REST API Secret
    }
  });
  const { access_token } = getToken.data.response; // 인증 토큰
  //-----------------------초기 세팅 종료---------------------------------


  // ---------------------- 결제 스케쥴 전부 취소 처리 시작
  const unScheduleResult = await axios({
    url: "https://api.iamport.kr/subscribe/payments/unschedule",
    method: "post", // POST method
    headers: {
      "Content-Type": "application/json",
      "Authorization": access_token
    }, // 인증 토큰 Authorization header에 추가
    data: {
      customer_uid: customer_uid, // REST API키
      merchant_uid: merchant_uid // REST API Secret
    }
  });
  const { code, message, response } = unScheduleResult.data; // 인증 토큰
  // console.log(unScheduleResult);
  // console.log("unScheduleResult.code : " + code);
  // console.log("unScheduleResult.response : " + response);
  // console.log("unScheduleResult.message : " + message);

  if(code == 0) {
    // console.log("결제 취소 처리 성공");

    const deleteBillKeyResult = await axios({
      url: "https://api.iamport.kr/subscribe/customers/" + customer_uid,
      method: "delete", // Delete method
      headers: {
        "Content-Type": "application/json",
        "Authorization": access_token
      }, // 인증 토큰 Authorization header에 추가
      data: {
        customer_uid: customer_uid, // REST API키
        merchant_uid: merchant_uid // REST API Secret
      }
    }); 

    if(deleteBillKeyResult.data.code == 0) {
      // console.log("키 삭제 완료");
      // console.log(deleteBillKeyResult.data.message);
      // console.log(deleteBillKeyResult.data.response);
      return res.status(200).json({
        "msg" : "예약 취소 키 삭제 완료"
      });
    } else {
      // console.log("키 삭제 실패");
      // console.log(deleteBillKeyResult.data.message);
      // console.log(deleteBillKeyResult.data.response);
      return res.status(400).json({
        "msg" : deleteBillKeyResult.data.message
      });
    }
  } else {
    // console.log("결제 취소 처리 실패");
    // console.log(message);
    return res.status(400).json({
      "msg" : message
    });
  }
  // ---------------------- 결제 스케쥴 전수 취소 처리 종료
}


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

    if (user.pwreset) {
      return res.status(400).json({
        msg: '임시 비밀번호를 메일로 발급했습니다<br>비밀번호 초기화 후 사용해주세요'
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
    function (accessToken, refreshToken, profile, done) {
      User.findOne({
        'kakao.id': profile.id
      }, function (err, user) {
        if (!user) {
          user = new User({
            name: profile.nickname,
            email: profile.id,
            username: profile.nickname,
            provider: 'kakao',
            naver: profile._json
          });
          user.save(function (err) {
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
    function (err, result) {
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
      }, function (err, post2) {
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
    function (err, result) {
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

      if (todayPoints < 119) {
        //하루 2분을 안넘겼을대 로직을 짠다
        if ((todayPoints + Number(req.body.points)) >= 119) {
          //현재 누적한 시간을 포함해서 2분을 넘겼을때 로직 (배열에 저장과 동시에 챌린지 카운트 배열에 별도 저장)
          var newPoint = req.body
          newPoint.points = req.body.points;
          newPoint.updatedAt = new Date();

          var dailycheck = {
            isdaily: true,
            updatedAt: new Date(),
            status: "챌린지 성공"
          }
          if (isupdate) {
            Challenge.update({
              missionID: req.body.id,
              email: req.body.email
            }, {
              $push: {
                dailycheck: dailycheck,
                usedmission: newPoint
              },
              $inc: {
                "usetime": req.body.points
              }
            }, function (err, reulst) {
              if (err) {
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
          }, {
            $push: {
              usedmission: newPoint
            },
            $inc: {
              "usetime": req.body.points
            }
          }, function (err, reulst) {
            if (err) {
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
          function (err, response) {
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
          }, function (err, post2) {
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
                function (err, response) {
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
          }, function (err, post2) {
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
                function (err, response) {
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
          function (err, response) {
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
    function (err, response) {
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
    function (err, response) {
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
    function (err, response) {
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
    function (err, response) {
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
  // console.log("main" + JSON.stringify(req.body.product));
  User.update({
    email: req.body.email
  }, {
    $push: {
      mainproduct: req.body.product
    }
  }, function (err, result2) {
    if (err) {
      return res.status(400).json(err);
    } else {
      return res.status(201).json({
        'msg': '메인 화장품 저장!!'
      });
    }
  });
};

exports.saveSubMainProduct = (req, res) => {
  // console.log("sub" + JSON.stringify(req.body.product));
  User.update({
    email: req.body.email
  }, {
    $push: {
      subproduct: req.body.product
    }
  }, function (err, result2) {
    if (err) {
      return res.status(400).json(err);
    } else {
      return res.status(201).json({
        'msg': '서브 화장품 저장!!'
      });
    }
  });
};

exports.delAndSaveMyMainProduct = (req, res) => {
  // console.log("main" + JSON.stringify(req.body.product));
  User.update({
    email: req.body.email
  }, {
    $pop: {
      mainproduct: -1
    }
  }, function (err, result2) {
    if (err) {
      return res.status(400).json(err);
    } else {
      User.update({
        email: req.body.email
      }, {
        $push: {
          mainproduct: req.body.product
        }
      }, function (err, result2) {
        if (err) {
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
  // console.log("sub" + JSON.stringify(req.body.product));
  User.update({
    email: req.body.email
  }, {
    $pop: {
      subproduct: -1
    }
  }, function (err, result2) {
    if (err) {
      return res.status(400).json(err);
    } else {
      User.update({
        email: req.body.email
      }, {
        $push: {
          subproduct: req.body.product
        }
      }, function (err, result2) {
        if (err) {
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

exports.findId = (req, res) => {
  if (!req.body.name && !req.body.birthday) {
    return res.status(400).json({
      'msg': '이름, 생년월을를 입력해 주세요.'
    });
  }

  User.findOne({
    name: req.body.name,
    birthday: req.body.birthday
  }, (err, user) => {
    if (err) {
      return res.status(400).json({
        'msg': '사용자 정보를 찾을 수 없습니다.'
      });
    }
    if (user) {
      // return res.status(400).json({ 'msg': 'The user already exists' });
      return res.status(201).json({
        'id': user.email
      });
    }
    if (!user) {
      return res.status(400).json({
        'msg': '사용자 정보를 찾을 수 없습니다.'
      })
    }
  });
};


exports.validSendEmail = (req, res) => {
  if (!req.body.email && !req.body.name && !req.body.birthday) {
    return res.status(400).json({
      'msg': "이메일, 이름, 생년월을를 입력해 주세요."
    });
  }

  User.findOne({
    email: req.body.email,
    name: req.body.name,
    birthday: req.body.birthday
  }, (err, user) => {
    if (err) {
      return res.status(400).json({
        'msg': "사용자 정보를 찾을 수 없습니다."
      });
    }
    if (user) {
      AWS.config.update({
        region: "us-west-2"
      });
      var ses = new AWS.SES();
      var temp_pw = makeRandomStr();
      let params = {
        Destination: {
          ToAddresses: [user.email], // 받는 사람 이메일 주소
          CcAddresses: [], // 참조
          BccAddresses: [] // 숨은 참조
        },
        Message: {
          Body: {
            Text: {
              Data: "안녕하세요 플리닉 입니다. \n 회원님의 임시 비밀번호는 " + temp_pw + " 입니다. \n플리닉 앱에서 비밀번호 초기화를 진행해주세요.\n감사합니다.", // 본문 내용
              Charset: "utf-8" // 인코딩 타입
            }
          },
          Subject: {
            Data: "플리닉 임시 비밀번호 발송", // 제목 내용
            Charset: "utf-8" // 인코딩 타입
          }
        },
        Source: "no-reply@g1p.co.kr", // 보낸 사람 주소
        ReplyToAddresses: ["no-reply@g1p.co.kr"] // 답장 받을 이메일 주소
      }
      ses.sendEmail(params, function (err, data) {
        if (err) {
          console.log(err);
        }

        if (data) { //임시비밀번호 전송이 성공되면 USER에 패스워드 상태가 리셋상태, 그리고 임시 비밀번호를 db에 저장한다.
          req.body.pwreset = true;
          req.body.pwresetvalue = temp_pw;
          User.findOneAndUpdate({
            email: req.body.email,
            name: req.body.name,
            birthday: req.body.birthday
          }, req.body, (err, result) => {
            if (err) {
              return res.status(400).json({
                'msg': "비밀번호를 초기화 할 수 없습니다."
              });
            }
            if (result) {
              return res.status(201).json({
                'msg': "회원님의 Email로<br>임시 비밀번호를 발송했습니다<br>임시 비밀번호로 패스워드 변경해주세요"
              });
            }
          });
        }
      })
      AWS.config.update({
        region: "ap-northeast-2"
      });

      // return res.status(400).json({ 'msg': 'The user already exists' });
      // return res.status(201).json({
      //   'id': user.email
      // });
    }
    if (!user) {
      return res.status(400).json({
        'msg': "사용자 정보를 찾을 수 없습니다."
      })
    }
  });
};

exports.updatePushToken = (req, res) => { //로그인 시 마다 사용자의 푸쉬토큰을 업데이트 한다 2020-06-16
  if (!req.body.email && !!req.body.pushtoken) {
    return res.status(400).json({
      'msg': "시스템 오류 관리자에게 문의하세요"
    });
  }
  User.findOneAndUpdate({
    email: req.body.email
  }, req.body, (err, user) => {

    if (err) {
      return res.status(400).json({
        'msg': "푸쉬 토큰을 변경 할 수 없습니다"
      });
    }

    if (user) {
      return res.status(201).json({
        'msg': "푸쉬토큰 변경 완료"
      });
    } else {
      return res.status(400).json({
        'msg': "시스템 오류 관리자에게 문의하세요"
      });
    }

  });
}

exports.changePush = (req, res) => {
  if (!req.body.email && !!req.body.ispush) {
    return res.status(400).json({
      'msg': "시스템 오류 관리자에게 문의하세요"
    });
  }
  User.findOneAndUpdate({
    email: req.body.email
  }, req.body, (err, user) => {

    if (err) {
      return res.status(400).json({
        'msg': "푸쉬 허용을 변경 할 수 없습니다"
      });
    }

    if (user) {
      return res.status(201).json({
        'msg': "푸쉬허용 변경"
      });
    } else {
      return res.status(400).json({
        'msg': "시스템 오류 관리자에게 문의하세요"
      });
    }

  });
}

exports.changePassword = (req, res) => {
  if (!req.body.temp && !req.body.birthday && !req.body.email && !req.body.name && !req.body.password && !req.body.passwordconfirm) {
    return res.status(400).json({
      'msg': "사용자 정보가 정확하지 않습니다."
    });
  }


  User.findOne({
    email: req.body.email,
    name: req.body.name,
    birthday: req.body.birthday,
    pwresetvalue: req.body.temp,
  }, (err, user) => {
    if (err) {
      return res.status(400).json({
        'msg': "사용자 정보를 찾을 수 없습니다."
      });
    }
    if (user) {
      if (user.pwresetvalue != req.body.temp) {
        return res.status(400).json({
          'msg': "임시 비밀번호가 틀립니다!!"
        });
      }
      //비밀번호 암호화로 저장
      bcrypt.genSalt(10, async function (err, salt) {
        if (err) return next(err);
        await bcrypt.hash(req.body.password, salt, null, function (err, hash) {
          if (err) return next(err);
          req.body.password = hash; // 암호화로 만들고
          req.body.pwreset = false;
          User.findOneAndUpdate({ // 저장한다.
            email: req.body.email,
            name: req.body.name,
            birthday: req.body.birthday
          }, req.body, (err, result) => {
            if (err) {
              return res.status(400).json({
                'msg': "비밀번호를 초기화 할 수 없습니다."
              });
            }
            if (result) {
              return res.status(201).json({
                'msg': "회원님의 비밀번호가<br>정상적으로 변경되었습니다."
              });
            }
          });
        });
      });
    }
    if (!user) {
      return res.status(400).json({
        'msg': "사용자 정보를 찾을 수 없습니다."
      })
    }
  });
};




function makeRandomStr() {
  var randomStr = "";
  var possible = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  for (let i = 0; i < 8; i++) {
    randomStr += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return randomStr;
}