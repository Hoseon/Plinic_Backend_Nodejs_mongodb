const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20');

passport.use(
  new GoogleStrategy({
    callbak_URL: 'http://localhost:5000/auth/google/redirect',
    clientID: '182510992437-ri45f5fdo8be7h193uvfohcugf9jh5fl.apps.googleusercontent.com',
    clientSecret: 'RsAmattHXCaNXID1JlnluzJi'
  }, () => {
    //passport callback function
  })
)
