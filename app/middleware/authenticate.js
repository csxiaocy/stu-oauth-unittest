const OauthServer = require('oauth2-server')
const Request = OauthServer.Request
const Response = OauthServer.Response
const OauthServerModel = require('../model/OauthServerModel')
let oauth
module.exports = options => {
    return async function authenticate(ctx, next) {
        if (!oauth) {
            oauth = new OauthServer({
                model: new OauthServerModel(ctx.app)
            })
        }
        const request = new Request({
            headers: { authorization: ctx.headers.authorization },
            method: ctx.request.method,
            query: ctx.request.query,
            body: ctx.request.body
        })
        const response = new Response(ctx.response)

        try {
            ctx.user = (await oauth.authenticate(request, response, options)).user
        } catch (e) {
            throw e
        }
        await next()
    }
}
