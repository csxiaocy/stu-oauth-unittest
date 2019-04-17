// app/controller/post.js
const Controller = require('egg').Controller

class OauthController extends Controller {

    /**
     * 汕头大学校园网账号密码登录
     * @return {Promise<void>} 返回为空，相应头中会带上用户user_id的session
     */
    async login() {
        const ctx = this.ctx

        this.ctx.validate({
            account: { type: 'string' },
            password: { type: 'string' },
        })
        let account = ctx.request.body.account
        let password = ctx.request.body.password
        // 设置session，授权码的会用到
        ctx.session.user_id = await ctx.service.oauth.stuLogin(account, password)
        ctx.body = {}
    }

    /**
     * Oauth2.0 获取授权码接口，不同客户端返回授权码方式不同
     * @return {Promise<void>} ios，Android重定向到回调页面，该页面能够触发客户端回调，小程序直接返回授权码，其他直接重定向到redirect_url
     */
    async authorizationCode() {
        const { ctx } = this

        this.ctx.validate({
            response_type: { type: 'string' },
            client_id: { type: 'string' },
            redirect_uri: { type: 'string?' },
            state: { type: 'string', required: false },
            scope: { type: 'string', required: false },
            from: 'string?'
        }, ctx.query)
        if (!ctx.query.redirect_uri) {
            // APP 无需redirect_uri，仅用于用于绕过Oauth验证，该URL无意义
            ctx.request.query.redirect_uri = this.config.no_redirect_uri
        }
        let user_id = ctx.session.user_id
        if (!user_id) {
            ctx.redirect(`/view/login?${ctx.originalUrl.split('?')[1]}`)
            return
        }

        let { code, redirect_url } = await this.service.oauth.authorizationCode(user_id)

        // 根据客户端的不同，以不同形式返回code
        switch (true) {
            case redirect_url.includes(this.config.no_redirect_uri) && ctx.query.from === 'ios':
            case redirect_url.includes(this.config.no_redirect_uri) && ctx.query.from === 'android':
                await ctx.render('callback-app.nj', {
                    appType: ctx.query.from,
                    oauthData: {
                        authorization_code: code.authorizationCode,
                        expires_at: code.expiresAt
                    }
                })
                break
            case redirect_url.includes(this.config.no_redirect_uri) && ctx.query.from === 'mini':
                ctx.body = {
                    authorization_code: code.authorizationCode,
                    expires_at: code.expiresAt
                }
                break
            default:
                /**
                 * 使用unsafeRedirect，因为没办法将所有Oauth客户端的域名加入白名单
                 */
                ctx.unsafeRedirect(redirect_url)
        }

    }

    /**
     * 授权码认证 / 刷新Token
     * @return {Promise<void>} 返回token，其中包含用户信息，客户端信息
     */
    async authorization() {
        const ctx = this.ctx
        if (!ctx.request.body.redirect_uri) {
            // APP 无需redirect_uri，仅用于用于绕过Oauth验证，该URL无意义
            ctx.request.body.redirect_uri = this.config.no_redirect_uri
        }
        const token = await ctx.service.oauth.authorization()

        // TODO 通过实践解耦，放到agent处理
        // 异步更新并存储用户信息
        ctx.service.newsao.syncUserStuInfoFromNewsao(token.user.id).catch(err => {
            // TODO 错误上报
            ctx.logger.error(`[authorization异步存储数据] ${err}`)
        })

        ctx.body = token
    }

}

module.exports = OauthController
