var express = require('express'),
    routes = express.Router();
var userController = require('./controller/user-controller');
var qnaController = require('./controller/qna-controller');
var noteController = require('./controller/note-controller');
var skinChartController = require('./controller/skinchart-controller');
var skinQnaController = require('./controller/skinqna-controller');
var careZoneController = require('./controller/carezone-controller');
var rewardController = require('./controller/reward-controller');
var chulsukController = require('./controller/chulsuk-controller');
// var testController = require('./controller/test-controller');
var skinAnalyController = require('./controller/skinAnaly-controller');

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
routes.post('/registersnstoplinic', userController.registerUserSnStoPlinic);
routes.post('/checkUser', userController.checkUser);
routes.post('/billings', userController.billings); //빌링 결제 추가
routes.post('/billingssche', userController.billingSchedule); //빌링 스케쥴 추가 매달 결제 호출을 위해서
routes.post('/billingcancel', userController.billingCancel); //빌링 스케쥴 추가 매달 결제 호출을 위해서
routes.post('/changepush', userController.changePush); // 사용자 정보 푸쉬 알림 변경
routes.post('/updatepushtoken', userController.updatePushToken); // 사용자 정보 푸쉬 알림 변경
routes.post('/userupdatenickname', userController.updateUserNickname); //사용자 닉네임, 생년월, 비밀번호 변경 로직
routes.post('/updateskincomplaint', userController.updateUserSkinComplaint); //사용자 피부타입 변경 로직
routes.post('/savemymainproduct', userController.saveMyMainProduct); //사용자 주 화장품 저장
routes.post('/savemysubproduct', userController.saveSubMainProduct); //사용자 보조 화장품 저장
routes.post('/delsavemymainproduct', userController.delAndSaveMyMainProduct); //사용자 주 화장품 지우고 저장
routes.post('/delsavemysubproduct', userController.delAndSaveSubMainProduct); //사용자 보조 화장품 지우고 저장
routes.post('/login', userController.loginUser);
routes.post('/pointupdate', userController.pointUpdate);
routes.post('/snspointupdate', userController.snsPointUpdate);
routes.post('/usetimeupdate', userController.useTimeUpdate);
routes.post('/userpointupdate', userController.userPointUpdate);
routes.post('/missionsave', userController.missionSave);
routes.post('/challengeupdate', userController.challengeUpdate);//20200210 챌린지 3분 이상 사용시 14주 도전중 1주 추가
routes.post('/challengeupdate2', userController.challengeUpdate2);//20200210 챌린지 3분 이상 사용시 14주 도전중 1주 추가
routes.post('/challengesave', userController.challengeSave); //챌린지를 시작하면 기존 v2를 놔두고 새롭게 챌린지 collection(table)을 만들어서 사용한다.

//피부분석 데이터 저장
routes.post('/saveskinanaly',skinAnalyController.skinAnalySave)

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

//챌린지 보상받기 2020-02-11 챌린지 기능으로 추가
routes.post('/rewardchallengesave', rewardController.rewardChallengeSave);

//출석체크 2020-02-14
routes.post('/chulsuk', chulsukController.chulsukSave);

//사용자 포인트 업데이트(케어하기, 미션) 2020-02-18
routes.post('/challengepointupdate', userController.challengePointUpdate); //챌린지 할 경우 포인트 누적
routes.post('/usepointupdate', userController.usePointUpdate); //일반 케어 하기 할 경우 포인트 누적

//포인트 누적후 사용자 정보 업데이트 해서 가져 오기.
routes.post('/loaduser', userController.loadUser);


//사용자 ID찾기,패스워드 리셋 2020-06-04
routes.post('/findId', userController.findId);
routes.post('/validIdandSendemail', userController.validSendEmail);
routes.post('/changePassword', userController.changePassword);


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

routes.get('/camera', function(req,res){
  res.sendfile(__dirname + '/commons/camera.html');
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
