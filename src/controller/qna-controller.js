var User = require('../models/user');
var Qna = require('../models/Qna');
var QnaCounter = require('../models/QnaCounter');
var jwt = require('jsonwebtoken');
var async = require('async');
var config = require('../config/config');
var passport = require('passport');
var KakaoStrategy = require('passport-kakao').Strategy;

function createToken(user) {
    return jwt.sign({ id: user.id, email: user.email, name: user.name }, config.jwtSecret, {
        //expiresIn: 200 // 86400 expires in 24 hours
        expiresIn: 86400 // 86400 expires in 24 hours
      });
}

exports.qnaSave = (req, res) => {

    //console.log("-------------------------------request-------------");
    console.log("qna-------------------------------- : " + req.body.email);
    console.log("qna-------------------------------- : " + req.body.select);
    console.log("qna-------------------------------- : " + JSON.stringify(req.body.qna));
    //return res.status(400).json({ 'msg': '문의하기가 등록되었습니다. <br /><br /> 곧 관리자에게 Email로 답변을 받을 수 있습니다.' });
    //console.log("-------------------------------response-------------" + res.body.id);

    if (!req.body.email || !req.body.select) {
        return res.status(400).json({ 'msg': '문의하기를 등록 할 수 없습니다. <br / >. 관리자에게 문의 하세요.' });
    } else{
      async.waterfall([function(callback) {
        QnaCounter.findOne({
          name: "qna"
        }, function(err, counter) {
          if (err) callback(err);
          if (counter) {
            callback(null, counter);
          } else {
            QnaCounter.create({
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
        let newQna = Qna(req.body);
        newQna.numId = counter.totalCount + 1;
        newQna.save((err, user) => {
            if (err) {
              console.log(err);
                return res.status(400).json({ 'msg': '문의하기가 등록되지 않았습니다. <br /> Error : ' + err });
            }
            return res.status(201).json(user);
            // return res.status(201).json(user);
            // return res.status(201).json({
            //     token: createToken(user)
            // });
        });
      });
       // create
    }

//     Qna.findOne({ email: req.body.email }, (err, user) => {
//         if (err) {
//           return res.status(400).json({ 'msg': err });
//         }
//
//         if (user) {
//           //이미 미션을 등록 한 상태
//           // return res.status(400).json({ 'msg': 'The user already exists' });
//             return res.status(400).json({ 'msg': '이미 다른 미션을 등록 한 상태입니다. <br> (미션은 1인 1개만 등록 할 수 있습니다.)' });
//         } else {
//           //등록 한 미션이 없을 때
//           let newQna = Qna(req.body);
//           newQna.save((err, user) => {
//               if (err) {
//                 console.log(err);
//                   return res.status(400).json({ 'msg': err });
//               }
//               return res.status(201).json(user);
//               // return res.status(201).json({
//               //     token: createToken(user)
//               // });
//
//           });
//           // return res.status(400).json({ 'msg': '이미 등록된 회원입니다.' });
//         }
//
//
//     });
// };


// exports.registerUser = (req, res) => {
//     if (!req.body.email || !req.body.password) {
//         return res.status(400).json({ 'msg': '이메일, 패스워드를 입력해 주세요.' });
//     }
//
//     User.findOne({ email: req.body.email }, (err, user) => {
//         if (err) {
//             return res.status(400).json({ 'msg': '사용자 정보를 찾을 수 없습니다.' });
//         }
//
//         if (user) {
//           // return res.status(400).json({ 'msg': 'The user already exists' });
//             return res.status(400).json({ 'msg': '이미 등록된 회원입니다.' });
//         }
//
//         let newUser = User(req.body);
//         newUser.save((err, user) => {
//             if (err) {
//                 return res.status(400).json({ 'msg': '회원가입이 되지 않습니다. <br/> 관리자에게 문의 해주세요.' });
//             }
//
//             // return res.status(201).json(user);
//             return res.status(201).json({
//                 token: createToken(user)
//             });
//
//         });
//     });
// };

// exports.loginUser = (req, res) => {
//     if (!req.body.email || !req.body.password) {
//         return res.status(400).send({ 'msg': '이메일, 패스워드를 다시 입력 해 주세요.' });
//     }
//
//     User.findOne({ email: req.body.email }, (err, user) => {
//         if (err) {
//             return res.status(400).send({ 'msg': '존재하지 않는 회원입니다.' });
//         }
//
//         if (!user) {
//           // return res.status(400).json({ 'msg': 'The user does not exist' });
//             return res.status(400).json({ 'msg': '존재하지 않는 회원입니다.' });
//         }
//
//         user.comparePassword(req.body.password, (err, isMatch) => {
//             if (isMatch && !err) {
//                 return res.status(200).json({
//                     token: createToken(user)
//                 });
//             } else {
//               // return res.status(400).json({ msg: 'The email and password don\'t match.' });
//                 return res.status(400).json({ msg: '비밀번호가 일치하지 않습니다.' });
//             }
//         });
//     });
// };
//
// exports.loginUser_Kakao = (req, res) => {
//
//   passport.use(new KakaoStrategy({
//       clientID : '3fad3ed55ef1830fd6d1c10faf0d9072' ,
//       clientSecret: '13NCCqRqTNBCcrN8vVNuyupWrH3kv6qM', // clientSecret을 사용하지 않는다면 넘기지 말거나 빈 스트링을 넘길 것
//       callbackURL : '/api/auth/login/kakao/callback'
//     },
//     function(accessToken, refreshToken, profile, done) {
//         User.findOne({
//             'kakao.id': profile.id
//         }, function(err, user) {
//             if (!user) {
//                 user = new User({
//                     name: profile.nickname,
//                     email: profile.id,
//                     username: profile.nickname,
//                     provider: 'kakao',
//                     naver: profile._json
//                 });
//                 user.save(function(err) {
//                     if (err) console.log('mongoDB error : ' + err);
//                     return done(err, user);
//                 });
//             } else {
//                     return done(err, user);
//             }
//         });
//     }
//   ));




    // req.body.email = "chs0131@hanmail.net";
    // req.body.password = "chs8310131";
    // if (!req.body.email || !req.body.password) {
    //     return res.status(400).send({ 'msg': 'You need to send email and password' });
    // }
    //
    // User.findOne({ email: req.body.email }, (err, user) => {
    //     if (err) {
    //         return res.status(400).send({ 'msg': err });
    //     }
    //
    //     if (!user) {
    //         return res.status(400).json({ 'msg': 'The user does not exist' });
    //     }
    //
    //     user.comparePassword(req.body.password, (err, isMatch) => {
    //         if (isMatch && !err) {
    //             return res.status(200).json({
    //                 token: createToken(user)
    //             });
    //         } else {
    //             return res.status(400).json({ msg: 'The email and password don\'t match.' });
    //         }
    //     });
    // });
};
