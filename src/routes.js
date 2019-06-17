var express = require('express'),
    routes = express.Router();
var userController = require('./controller/user-controller');
var passport = require('passport');
var mysql      = require('mysql');
var dbconfig   = require('./config/database.js');
var KakaoStrategy = require('passport-kakao').Strategy;
var connection = mysql.createConnection(dbconfig);

//app.use(passport.initialize());
var passportMiddleware = require('./middleware/passport');
passport.use(passportMiddleware);

routes.get('/', (req, res) => {
    return res.send('Hello, this is the API!');
});

routes.post('/register', userController.registerUser);
routes.post('/login', userController.loginUser);


routes.post('/missionsave', userController.missionSave);

//routes.get('/auth/kakao', userController.loginUser_Kakao);

routes.get('/auth/kakao', passport.authenticate('kakao',{
    failureRedirect: '#!/login'
}));

routes.get('/auth/login/kakao/callback', passport.authenticate('kakao',{
    successRedirect: '/menu/first',
    failureRedirect: '#!/login'
}));

routes.get('/special', passport.authenticate('jwt', { session: false }), (req, res) => {
    return res.json({ msg: `Hey ${req.user.email}! I open at the close.` });
});

module.exports = routes;
