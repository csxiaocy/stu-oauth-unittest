// app/service/oauth.js
const Service = require('egg').Service
const OauthServer = require('oauth2-server')
const Request = OauthServer.Request
const Response = OauthServer.Response
const OauthServerModel = require('../model/OauthServerModel')
let oauth   // Oauth2-server 对象，单例

class OauthService extends Service {
    constructor(ctx) {
        super(ctx)
        // 单例模式创建Oauth2-server 对象
        if (!oauth) {
            oauth = new OauthServer({
                model: new OauthServerModel(this.app)
            })
        }
    }

    /**
     * stu账号密码登录接口
     * @param user_id
     * @param password
     * @returns {Promise<user_id>}
     */
    async stuLogin(user_id, password) {
        const ctx = this.ctx
        const app = this.app

        const login_url = 'http://wechat.stu.edu.cn/wechat/login/login_verify'
        const options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            dataType: 'text',
            data: {
                ldap_account: user_id,
                ldap_password: password,
                btn_ok: '登录',
                source_type: 'dorm_information',
                openid: user_id
            }
        }
        // 发送请求验证账号密码
        let result
        try {
            result = await ctx.curl(login_url, options)
        } catch (err) {
            throw ctx.helper.createError(new Error('network errors'), app.errCode.OauthService.network_error)
        }
        if (result.status === 302) {
            throw ctx.helper.createError(new Error('password error'), app.errCode.OauthService.password_error)
        }

        // 插入数据库
        await ctx.service.oauth.updateUserPassword(user_id, password)
        return user_id
    }

    /**
     * Oauth2.0生成授权码
     * @param user_id
     * @returns {Promise<{code, redirect_url: string}>}
     */
    async authorizationCode(user_id) {
        const { ctx, app } = this
        const request = new Request(ctx.request)
        const response = new Response(ctx.response)
        const options = {
            authenticateHandler: {
                handle: () => ({ id: user_id })
            }
        }
        // 默认scope 为get_user_info
        request.query.scope = request.query.scope ? request.query.scope : 'get_user_info'

        // 返回授权码
        try {
            const code = await oauth.authorize(request, response, options)
            return { code, redirect_url: response.headers.location }
        } catch (err) {
            throw ctx.helper.createError(err, app.errCode.OauthService.authorize_error)
        }
    }

    /**
     * Oauth2.0 获取授权码
     * @returns {Bluebird<R>}
     */
    async authorization() {
        const { ctx, app, config } = this
        const request = new Request(ctx.request)
        const response = new Response(ctx.response)
        try {
            return await oauth.token(request, response, {
                accessTokenLifetime: config.accessTokenLifetime,
                refreshTokenLifetime: config.refreshTokenLifetime
            })
        } catch (err) {
            throw ctx.helper.createError(err, app.errCode.OauthService.token_error)
        }
    }

    /**
     * 更新账号密码
     * @param account
     * @param password
     */
    async updateUserPassword(account, password) {
        let { ctx, app, config } = this
        try {
            let t = app.Sequelize.transaction
            await ctx.model.Stu.User.findOrCreate({
                where: { id: account },
                defaults: { id: account },
                transaction: t
            })
            await ctx.model.Stu.Password.upsert({
                id: account,
                password: ctx.helper.aesEncrypt({
                    data: password,
                    key: config.pwKey,
                    iv: config.pwIv
                })
            }, { transaction: t })
        } catch (err) {
            throw this.ctx.helper.createError(err, app.errCode.StuService.update_user_error)
        }
    }

    async getUserPassword(user_id) {
        const { ctx, config } = this
        const user = await ctx.model.Stu.Password.findOne({
            where: { id: user_id }
        })
        return {
            id: user.id,
            password: ctx.helper.aesDecrypt({
                data: user.password,
                key: config.pwKey,
                iv: config.pwIv
            })
        }
    }
}

module.exports = OauthService
