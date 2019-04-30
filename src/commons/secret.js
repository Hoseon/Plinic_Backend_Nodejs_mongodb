module.exports = {
  'secret' :  '',
  'db_info': {
    local: { // localhost
    },
    real: { // real
    },
    dev: { // dev
    }
  },
  'federation' : {
    'naver' : {
      'client_id' : 'cacc224856d361b3a131bf96f98ccfb8',
      'secret_id' : 'cXmRKZV5NRmyf0spHYRdRdGlFMTimtO9',
      'callback_url' : '/auth/login/naver/callback'
    },
    'kakao' : {
      'client_id' : 'cacc224856d361b3a131bf96f98ccfb8',
      'secret_id' : 'cXmRKZV5NRmyf0spHYRdRdGlFMTimtO9',
      'callback_url' : '/auth/login/kakao/callback'
    }
  }
};
