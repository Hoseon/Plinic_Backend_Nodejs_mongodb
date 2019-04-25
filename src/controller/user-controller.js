var User = require('../models/user');
var jwt = require('jsonwebtoken');
var config = require('../config/config');
var passport = require('passport');
var KakaoStrategy = require('passport-kakao').Strategy;

function createToken(user) {
    return jwt.sign({ id: user.id, email: user.email }, config.jwtSecret, {
        //expiresIn: 200 // 86400 expires in 24 hours
        expiresIn: 86400 // 86400 expires in 24 hours
      });
}

exports.registerUser = (req, res) => {
    if (!req.body.email || !req.body.password) {
        console.log(req.body.email);
        console.log(req.body.password);
        return res.status(400).json({ 'msg': 'You need to send email and password' });
    }

    User.findOne({ email: req.body.email }, (err, user) => {
        if (err) {
            return res.status(400).json({ 'msg': err });
        }

        if (user) {
            return res.status(400).json({ 'msg': 'The user already exists' });
        }

        let newUser = User(req.body);
        newUser.save((err, user) => {
            if (err) {
                return res.status(400).json({ 'msg': err });
            }
            return res.status(201).json(user);
        });
    });
};

exports.loginUser = (req, res) => {
    if (!req.body.email || !req.body.password) {
        return res.status(400).send({ 'msg': 'You need to send email and password' });
    }

    User.findOne({ email: req.body.email }, (err, user) => {
        if (err) {
            return res.status(400).send({ 'msg': err });
        }

        if (!user) {
            return res.status(400).json({ 'msg': 'The user does not exist' });
        }

        user.comparePassword(req.body.password, (err, isMatch) => {
            if (isMatch && !err) {
                return res.status(200).json({
                    token: createToken(user)
                });
            } else {
                return res.status(400).json({ msg: 'The email and password don\'t match.' });
            }
        });
    });
};

exports.loginUser_Kakao = (req, res) => {

  passport.use(new KakaoStrategy({
      clientID : '3fad3ed55ef1830fd6d1c10faf0d9072' ,
      clientSecret: '13NCCqRqTNBCcrN8vVNuyupWrH3kv6qM', // clientSecret을 사용하지 않는다면 넘기지 말거나 빈 스트링을 넘길 것
      callbackURL : '/api/auth/login/kakao/callback'
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
