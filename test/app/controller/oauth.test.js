const { app, assert } = require('egg-mock/bootstrap')

describe('test/controller/oauth.test.js', () => {
    let cookie
    let code
    let accessToken
    let refreshToken

    describe('POST /oauth/login', () => {
        // 登陆-成功测试
        it('should login success', async () => {
            app.mockCsrf()
            const login = await app.httpRequest()
                .post('/oauth/login')
                .type('form')
                .send({
                    account: '15cthuang',
                    password: 'Candy123'
                })
                .expect(200)
                .expect({
                    'code': '0'
                })
            cookie = login.headers['set-cookie']
        })
        // 登陆-密码错误测试
        it('should password error', async () => {
            app.mockCsrf()
            const login = await app.httpRequest()
                .post('/oauth/login')
                .type('form')
                .send({
                    account: '15cthuang',
                    password: '123456'
                })
            assert(login.body.code === '01200102')
        })
    })

    describe('GET /oauth/authorize', () => {
        // 用户授权-成功测试
        it('should return 授权码', async () => {
            const result = await app.httpRequest()
                .get('/oauth/authorize?response_type=code&client_id=syllabus-app&redirect_uri=http://no_redirect_uri.com&state=teststate&scope=*')
                .set('cookie', cookie)
                .expect(302)
            assert(result.headers.location.includes('http://no_redirect_uri.com') === true)
            code = (result.header.location).match(/code=(\S*)&/)[1]
            assert(code)
        })
        it('should 授权码 错误', async () => {
            const result = await app.httpRequest()
                .get('/oauth/authorize?response_type=code&client_id=syllabus&redirect_uri=http://no_redirect_uri.com&state=teststate&scope=*')
                .set('cookie', cookie)
                .expect(200)
            assert(result.body.code === '01200103')
        })
        // 用户授权-安卓成功测试
        it('安卓授权码', async () => {
            const result = await app.httpRequest()
                .get('/oauth/authorize?response_type=code&client_id=syllabus-app&redirect_uri=http://no_redirect_uri.com&state=teststate&scope=*&from=android')
                .set('cookie', cookie)
                .expect(200)
            assert((result.text).match(/code":"(\S*)",/)[1])
        })
    })
    describe('POST /oauth/token', () => {
        // 换取凭证-正确测试
        it('should return accessToken and refreshToken', async () => {
            app.mockCsrf()
            const token = await app.httpRequest()
                .post('/oauth/token')
                .type('form')
                .send({
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: 'http://no_redirect_uri.com',
                    client_id: 'syllabus-app',
                    client_secret: 'stu'
                })
                .expect(200)
            const body = token.body;
            [accessToken, refreshToken] = [body.accessToken, body.refreshToken]
            assert(body.code === '0')
        })
        // 换取凭证-授权码过期测试
        it('should return code error', async () => {
            app.mockCsrf()
            const token = await app.httpRequest()
                .post('/oauth/token')
                .type('form')
                .send({
                    grant_type: 'authorization_code',
                    code: '0c82252d15046b25f0ce2ae8f3bb91fcd875469c',
                    redirect_uri: 'http://no_redirect_uri.com',
                    client_id: 'syllabus-app',
                    client_secret: 'stu'
                })
                .expect(200)
            assert(token.body.code === '01200104')
        })
        // 刷新凭证-成功测试
        it('should refresh the token', async () => {
            app.mockCsrf()
            const token = await app.httpRequest()
                .post('/oauth/token')
                .type('form')
                .send({
                    grant_type: 'refresh_token',
                    client_id: 'syllabus-app',
                    client_secret: 'stu',
                    access_token: accessToken,
                    refresh_token: refreshToken
                })
                .expect(200)
            const body = token.body;
            [accessToken, refreshToken] = [body.accessToken, body.refreshToken]
            assert(body.code === '0')
        })
        // 刷新凭证-refreshtoken过期测试
        it('should return refreshtoken error', async () => {
            app.mockCsrf()
            const token = await app.httpRequest()
                .post('/oauth/token')
                .type('form')
                .send({
                    grant_type: 'refresh_token',
                    client_id: 'syllabus-app',
                    client_secret: 'stu',
                    access_token: accessToken,
                    refresh_token: 'c4c1edc2e730689ec81dbc5d523ba78058f4eb25'
                })
                .expect(200)
            console.log(token.body.code)
            assert(token.body.code === '01200104')
        })
    })

    describe('GET /user/info', () => {
        // 获取用户信息-成功测试
        it('should return user info', async () => {
            const user = await app.httpRequest()
                .get('/user/info')
                .set('Authorization', 'Bearer ' + accessToken)
                .expect(200)
            assert(user.body.code === '0')
        })
        // 获取用户信息-token过期测试
        it('should return token error', async () => {
            const user = await app.httpRequest()
                .get('/user/info')
                .set('Authorization', 'Bearer 6ff80ecacb80aa69ffc5fb94c487d986e13e3a90')
                .expect(200)
            assert(user.body.code === '01200104')
        })
    })

    describe('GET /user/lesson', () => {
        // 获取课程信息-成功测试
        it('should return user lesson', async () => {
            const lesson = await app.httpRequest()
                .get('/user/lesson?year=2018&semester=1')
                .set('Authorization', 'Bearer ' + accessToken)
                .expect(200)
            assert(lesson.body.code === '0')
        })
        // 获取课程信息-token过期测试
        it('should return user lesson', async () => {
            const lesson = await app.httpRequest()
                .get('/user/lesson?year=2018&semester=1')
                .set('Authorization', 'Bearer 6ff80ecacb80aa69ffc5fb94c487d986e13e3a90')
                .expect(200)
            assert(lesson.body.code === '01200104')
        })
    })
})
