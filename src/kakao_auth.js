'use strict'
//https://github.com/FirebaseExtended/custom-auth-samples/tree/master/kakao 카카오에서 제공하는 본 코드입니다.
const admin = require('./firebase_admin.js');
const Async = require('async');
const axios = require('axios');


const kakaoRequestMeUrl = 'https://kapi.kakao.com/v2/user/me'

/**
 * requestMe - Returns user profile from Kakao API
 *
 * @param  {String} kakaoAccessToken Access token retrieved by Kakao Login API
 * @return {Promiise}      User profile response in a promise
 */
function requestMe(kakaoAccessToken,callback) {
  console.log('Requesting user profile from Kakao API server. '+ kakaoAccessToken)
  return axios.get(kakaoRequestMeUrl,{
    method: 'GET',
    headers: {'Authorization': 'Bearer ' + kakaoAccessToken}
  }).then((result)=>{
    callback(null,result.data,result);
  });
}

/**
   * updateOrCreateUser - Update Firebase user with the give email, create if
   * none exists.
   *
   * @param  {String} userId        user id per app
   * @param  {String} email         user's email address
   * @param  {String} displayName   user
   * @param  {String} photoURL      profile photo url
   * @return {Prommise} Firebase user record in a promise
   */
function updateOrCreateUser(userId, email, displayName, photoURL) {
  console.log('updating or creating a firebase user');
  const updateParams = {
    provider: 'KAKAO',
    displayName: displayName,
  };
  if (displayName) {
    updateParams['displayName'] = displayName;
  } else {
    updateParams['displayName'] = email;
  }
  if (photoURL) {
    updateParams['photoURL'] = photoURL;
  }
  console.log(updateParams);
  return admin.auth().updateUser(userId, updateParams).then(function(userRecord) {
    // See the UserRecord reference doc for the contents of `userRecord`.
    console.log("Successfully updated user", userRecord.toJSON());
    userRecord['uid'] = userId;
    if (email) {
      userRecord['email'] = email;
    }
    return admin.auth().createUser(userRecord);
  });
}

/**
 * createFirebaseToken - returns Firebase token using Firebase Admin SDK
 *
 * @param  {String} kakaoAccessToken access token from Kakao Login API
 * @return {Promise}                  Firebase token in a promise
 */
function createFirebaseToken(kakaoAccessToken,callback) {

  Async.waterfall([
    (next)=>{
      requestMe(kakaoAccessToken, (error, response, boy) => {
        console.log("111111");
        console.log(response)
        const body = response // JSON.parse(response)
        console.log("22222222");        
        console.log(body)
        console.log("33333333");        
        const userId = `kakao:${body.id}`
        if (!userId) {
          return response.status(404)
          .send({message: 'There was no user with the given access token.'})
        }
        let nickname = null
        let profileImage = null
        if (body.properties) {
          nickname = body.properties.nickname
          profileImage = body.properties.profile_image
        }

        const updateParams = {
          uid :userId,
          email :body.kakao_account.email,
          provider: 'KAKAO',
          displayName: nickname,
        };
        if (nickname) {
          updateParams['displayName'] = nickname;
        } else {
          updateParams['displayName'] = body.kakao_account.email;
        }
        if (profileImage) {
          updateParams['photoURL'] = profileImage;
        }

        next(null,updateParams)
      });
    },
    (userRecord, next) => {
      console.log("4444444");
      console.log(userRecord.email);
      console.log("5555555555");
      admin.auth().getUserByEmail(userRecord.email).then((userRecord)=>{
        next(null,userRecord);
      }).catch((error) => {
        console.log("6666666666");
        console.log(error);
        console.log("77777777777");
        admin.auth().createUser(userRecord).then((user)=>{
          next(null,user)
        })
      })
    },
    (userRecord, next) => {
      console.log("88888888888");
      console.log(userRecord);
      console.log("999999999999");
      console.log("**************");
      console.log("1001010101010101010");
      const userId = userRecord.uid
      console.log(`creating a custom firebase token based on uid ${userId}`)
      admin.auth().createCustomToken(userId, { provider: 'KAKAO' }).then((result) => {
        console.log("111111-111111-11111");
        console.log(result);  
        console.log("2222222-22222222-2222222");
        next(null , result);
      });
    }
  ], (err, results) => {
    console.log("33333333333-33333333333-33333333");
      console.log(results)
      console.log("44444444-4444444444444-444444444444444");
      callback(results);
  });

}

module.exports={
  createFirebaseToken
}