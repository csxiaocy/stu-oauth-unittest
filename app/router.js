/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
    const { router, controller } = app
    /**
     * showdoc
     * @catalog oauth
     * @title 用户登录
     * @description 用户登录的接口
     * @method post
     * @url /oauth/login
     * @param username 必选 string 用户名
     * @param password 必选 string 密码
     * @return {"code":"0","errMsg":null,"data":{"user_id":"4b5cff28e2e635db9d675ba21403a3dd"}}
     * @return_param code string 错误码，0为请求正常
     * @return_param errMsg string 错误信息，正常为null
     * @remark 返回带有user_id的session
     */
    router.post('/oauth/login', controller.oauth.login)

    /**
     * showdoc
     * @catalog oauth
     * @title 用户授权
     * @description 用户授权的接口，授权成功后返回authorization_code
     * @method get
     * @url /oauth/authorize
     * @param response_type 必选 string 授权类型,固定为code
     * @param client_id 必选 string 客户端的ID
     * @param redirect_uri 可选 string 用户授权成功后重定向的uri
     * @param state 可选 string 客户端的当前状态，可以指定任意值，认证服务器会原封不动地返回这个值
     * @param scope 可选 string 申请的权限范围
     * @remark 重定向到redirect_uri，并带上authorization_code
     */
    router.get('/oauth/authorize', controller.oauth.authorizationCode)

    /**
     * showdoc
     * @catalog oauth
     * @title 换取凭证
     * @description 换取凭证，authorization_code 换取access_token和refresh_token
     * @method post
     * @url /oauth/token
     * @param grant_type 必选 string 授权模式，固定为authorization_code
     * @param code 必选 string authorization_code
     * @param redirect_uri 必选 string 用户授权成功后重定向的uri
     * @param client_id 必选 string 客户端ID
     * @param client_secret 必选 string 客户端秘钥
     * @return {"code":"0","errMsg":null,"data":{"client":{"id":"stu","redirectUris":["https://www.baidu.com"],"grants":["authorization_code","refresh_token"],"scope":["*"],"banScope":[]},"user":{"id":"4b5cff28e2e635db9d675ba21403a3dd"},"accessToken":"e66c0a38fa1e2d1dfa3bdc648bb5bba79cc4d3ac","accessTokenExpiresAt":"2018-11-22T12:02:22.665Z","refreshToken":"6c0948380d68738b552211bffea872e418b1fe35","refreshTokenExpiresAt":"2018-12-06T09:43:47.000Z","scope":"get_user_info"}}
     * @return_param code string 错误码，0为请求正常
     * @return_param errMsg string 错误信息，正常为null
     * @return_param client Object 客户端信息
     * @return_param user.id string 用户id
     * @return_param accessToken string accessToken
     * @return_param accessTokenExpiresAt string accessToken有效期
     * @return_param refreshToken string refreshToken
     * @return_param refreshTokenExpiresAt string refreshToken有效期
     * @return_param scope string 申请的权限范围
     * @remark 无
     */
    /**
     * showdoc
     * @catalog oauth
     * @title 刷屏凭证
     * @description 刷新凭证，使用refresh_token刷新access_token和refresh_token
     * @method post
     * @url /oauth/token
     * @param grant_type 必选 string 授权模式，refresh_token
     * @param refresh_token 必选 string refresh_token
     * @param access_token 必选 string access_token
     * @param client_id 必选 string 客户端ID
     * @param client_secret 必选 string 客户端秘钥
     * @return {"code":"0","errMsg":null,"data":{"client":{"id":"stu","redirectUris":["https://www.baidu.com"],"grants":["authorization_code","refresh_token"],"scope":["*"],"banScope":[]},"user":{"id":"4b5cff28e2e635db9d675ba21403a3dd"},"accessToken":"e66c0a38fa1e2d1dfa3bdc648bb5bba79cc4d3ac","accessTokenExpiresAt":"2018-11-22T12:02:22.665Z","refreshToken":"6c0948380d68738b552211bffea872e418b1fe35","refreshTokenExpiresAt":"2018-12-06T09:43:47.000Z","scope":"get_user_info"}}
     * @return_param code string 错误码，0为请求正常
     * @return_param errMsg string 错误信息，正常为null
     * @return_param client Object 客户端信息
     * @return_param user.id string 用户id
     * @return_param accessToken string accessToken
     * @return_param accessTokenExpiresAt string accessToken有效期
     * @return_param refreshToken string refreshToken
     * @return_param refreshTokenExpiresAt string refreshToken有效期
     * @return_param scope string 申请的权限范围
     * @remark 无
     */
    router.post('/oauth/token', controller.oauth.authorization)

    /* TODO 待补充API文档 */
    /**
     * showdoc
     * @catalog view
     * @title 静态页面
     * @description 访问指定的静态页面
     * @method get
     * @url /view/<view-name>
     * @param view-name 必选 string 页面名字，静态页面放在/app/view目录下
     * @return 静态页面
     * @remark 无
     */
    router.all('/view/:view', controller.view.render)


    router.get('/user/info', app.middleware.authenticate({
        scope: 'get_user_info',
    }), controller.user.getUserInfo)

    router.get('/user/lesson', app.middleware.authenticate({
        scope: 'get_user_lesson',
    }), controller.user.getUserLesson)


}
