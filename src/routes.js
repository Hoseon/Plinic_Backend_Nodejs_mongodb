var express = require('express'),
    routes = express.Router();
var userController = require('./controller/user-controller');
var qnaController = require('./controller/qna-controller');
var noteController = require('./controller/note-controller');
var skinChartController = require('./controller/skinchart-controller');
var skinQnaController = require('./controller/skinqna-controller');
var careZoneController = require('./controller/carezone-controller');
var rewardController = require('./controller/reward-controller');
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
routes.post('/registersns', userController.registerUserSnS);
routes.post('/userupdatenickname', userController.updateUserNickname); //사용자 닉네임, 생년월, 비밀번호 변경 로직
routes.post('/updateskincomplaint', userController.updateUserSkinComplaint); //사용자 피부타입 변경 로직
routes.post('/login', userController.loginUser);
routes.post('/pointupdate', userController.pointUpdate);
routes.post('/snspointupdate', userController.snsPointUpdate);
routes.post('/usetimeupdate', userController.useTimeUpdate);

routes.post('/missionsave', userController.missionSave);

//문의 하기 저장
routes.post('/qnasave', qnaController.qnaSave);
routes.post('/qnaupdate', qnaController.qnaUpdate);

//뷰티노트 저장
routes.post('/notesave', noteController.noteSave);
routes.post('/noteupdate', noteController.noteUpdate);
routes.post('/replysave', noteController.replySave);
routes.post('/replyupdate', noteController.replyUpdate);
routes.post('/replydelete', noteController.replyDelete);

//피부고민 저장
routes.post('/skinqnasave', skinQnaController.skinQnaSave);
routes.post('/skinqnaupdate', skinQnaController.skinQnaUpdate);
routes.post('/replyskinqnasave', skinQnaController.replySave);
routes.post('/replyskinqnaupdate', skinQnaController.replyUpdate);
routes.post('/replyskinqnadelete', skinQnaController.replyDelete);

//챌린지 댓글 저장/수정/삭제 20190822
routes.post('/replycarezonesave', careZoneController.replySave);
routes.post('/replycarezoneupdate', careZoneController.replyUpdate);
routes.post('/replycarezonedelete', careZoneController.replyDelete);


//문진표 저장 및 업데이트 20190709
routes.post('/skinchartsave', skinChartController.skinChartSave);
routes.post('/skinchartupdate', skinChartController.skinChartUpdate);


//보상받기
routes.post('/rewardsave', rewardController.rewardSave);


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

routes.get('/daumjuso', function(req,res){
  res.sendfile(__dirname + '/commons/juso.html');
});

var juso = null;
routes.post('/daumjuso', function(req,res) {
	juso = null;
	juso = req.body
  // console.log("받은 데이터는? " + JSON.stringify(juso));
})

routes.get('/daumjuso/mobile', function(req,res) {
	// console.log(juso);
	res.send(juso);
	juso = null;
});


module.exports = routes;
