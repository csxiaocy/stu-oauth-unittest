let errCode = {
    OauthController: {
        code: '1001'
    },
    OauthService: {
        code: '2001',
        network_error: '01',
        password_error: '02',
        authorize_error: '03',
        token_error: '04',
        refreshLoginState_invalid_refresh_key: '05',
    },
    StuService: {
        code: '2002',
        update_user_error: '01',
    },
}

module.exports = errCode

