const Sequelize = require('sequelize')

let User
let OAuthClient
let OAuthAccessToken
let OAuthAuthorizationCode
let OAuthRefreshToken
const Op = Sequelize.Op

// 改成单例模式，或者改为类成员变量
class OauthServerModel {
    constructor(app) {
        User = app.model.Stu.User
        OAuthClient = app.model.Oauth.OAuthClient
        OAuthAccessToken = app.model.Oauth.OAuthAccessToken
        OAuthAuthorizationCode = app.model.Oauth.OAuthAuthorizationCode
        OAuthRefreshToken = app.model.Oauth.OAuthRefreshToken
        this.app = app
    }

    getAccessToken(bearerToken) {
        return OAuthAccessToken
            .findOne({
                where: { access_token: bearerToken },
                attributes: [['access_token', 'accessToken'], ['expires', 'accessTokenExpiresAt'], 'scope', 'client_id', 'user_id'],
                include: [{
                    model: User,
                    // 解密用户数据
                    attributes: ['id',
                        [Sequelize.literal(`CONVERT(aes_decrypt(info, '${this.app.config.userInfoKey}'), char)`), 'info']
                    ]
                }]
            })
            .then(function (accessTokenStr) {
                if (!accessTokenStr) return false
                let user = accessTokenStr.User.toJSON()
                user.info = JSON.parse(user.info)
                let accessToken = accessTokenStr.toJSON()

                return {
                    accessToken: accessToken.accessToken,
                    accessTokenExpiresAt: accessToken.accessTokenExpiresAt,
                    client: { id: accessToken.client_id },
                    scope: accessToken.scope,
                    user: user
                }
            })
            .catch(function (err) {
                console.log('getAccessToken - Err: ', err)
            })
    }

    getClient(clientId, clientSecret) {
        const options = {
            where: { id: clientId },
            attributes: ['id', ['redirect_uri', 'redirectUris'], ['grant_types', 'grants'], 'scope', ['ban_scope', 'banScope']],
        }
        if (clientSecret) options.where.client_secret = clientSecret

        return OAuthClient
            .findOne(options)
            .then(function (client) {
                if (!client) {
                    throw new Error('client not found')
                }
                let clientWithGrants = client.toJSON()
                clientWithGrants.redirectUris = clientWithGrants.redirectUris ? clientWithGrants.redirectUris.split(' ') : ['null']
                clientWithGrants.grants = clientWithGrants.grants ? clientWithGrants.grants.split(' ') : []
                clientWithGrants.scope = clientWithGrants.scope ? clientWithGrants.scope.split(' ') : []
                clientWithGrants.banScope = clientWithGrants.banScope ? clientWithGrants.banScope.split(' ') : []
                return clientWithGrants
            }).catch(function (err) {
                console.log('getClient - Err: ', err)
                throw err
            })
    }

    getAuthorizationCode(code) {
        return OAuthAuthorizationCode
            .findOne({
                attributes: ['client_id', 'expires', 'user_id', 'scope', 'redirect_uri'],
                where: { authorization_code: code },
                include: [User, OAuthClient]
            })
            .then(function (authCodeModel) {
                if (!authCodeModel) return false
                let authCode = authCodeModel.toJSON()
                let client = authCode.OAuthClient
                let user = authCode.User
                return {
                    code: code,
                    client: { id: client.id },
                    user: { id: user.id, info: user.info },
                    expiresAt: new Date(authCodeModel.expires),
                    redirectUri: authCodeModel.redirect_uri,
                    scope: authCodeModel.scope,
                }
            }).catch(function (err) {
                console.log('getAuthorizationCode - Err: ', err)
                throw err
            })
    }

    getRefreshToken(refreshToken) {
        if (!refreshToken || refreshToken === 'undefined') return false

        return OAuthRefreshToken
            .findOne({
                attributes: ['client_id', 'user_id', 'expires', 'scope'],
                where: { refresh_token: refreshToken },
                include: [OAuthClient, User]
            })
            .then(function (savedRT) {
                if (!savedRT) {
                    throw new Error(`can not find refresh token, refreshToken: ${JSON.stringify(refreshToken)}`)
                }
                if (!savedRT.OAuthClient) {
                    throw new Error(`can not find client, client_id: ${refreshToken.client_id}`)
                }
                let user = savedRT ? savedRT.User.toJSON() : {}
                user.grant_type = 'refresh_token'
                return {
                    user: user,
                    client: { id: savedRT.OAuthClient.toJSON().id },
                    refreshTokenExpiresAt: savedRT ? new Date(savedRT.expires) : null,
                    refreshToken: refreshToken,
                    scope: savedRT.scope
                }

            }).catch(function (err) {
                console.log('getRefreshToken - Err: ', err)
                throw err
            })
    }

    saveAuthorizationCode(code, client, user) {
        return OAuthAuthorizationCode
            .create({
                expires: code.expiresAt,
                client_id: client.id,
                authorization_code: code.authorizationCode,
                redirect_uri: code.redirectUri,
                user_id: user.id,
                scope: code.scope
            })
            .then(function () {
                code.code = code.authorizationCode
                return {
                    authorizationCode: code.authorizationCode,
                    expiresAt: code.expiresAt,
                    redirectUri: code.redirectUri,
                    scope: code.scope,
                    client: client,
                    user: user
                }
            }).catch(function (err) {
                console.log('saveAuthorizationCode - Err: ', err)
                throw err
            })
    }

    /**
     * 对请求的权限进行过滤，请求的权限只能为客户端拥有的，并且没被禁止的权限
     * @param user
     * @param client 客户端，client.scope 为客户端能够拥有的权限
     * @param scope 请求授权的权限
     * @returns {string}
     */
    validateScope(user, client, scope) {
        // list of valid scopes
        const VALID_SCOPES = client.scope
        const BAN_SCOPES = client.banScope
        if (scope.includes('*')) {
            return VALID_SCOPES.join(' ')
        } else {
            return VALID_SCOPES.includes('*') ? scope : scope
                .split(' ')
                .filter(s => VALID_SCOPES.indexOf(s) >= 0 && BAN_SCOPES.indexOf(s) < 0)
                .join(' ')
        }
    }

    verifyScope(token, scope) {
        if (!token.scope) {
            return false
        }
        if (token.scope.indexOf('*') >= 0) {
            return true
        }
        let requestedScopes = scope ? scope.split(' ') : []
        let authorizedScopes = token.scope ? token.scope.split(' ') : []
        return requestedScopes.every(s => authorizedScopes.indexOf(s) >= 0)
    }

    revokeAuthorizationCode(code) {
        return OAuthAuthorizationCode.findOne({
            where: {
                authorization_code: code.code
            }
        }).then(function (rCode) {
            if (rCode) rCode.destroy()
            return !!rCode
        }).catch(function (err) {
            console.log('getUser - Err: ', err)
            throw err
        })
    }

    revokeToken(token) {
        return OAuthRefreshToken.findOne({
            where: {
                refresh_token: token.refreshToken
            }
        }).then(function (rT) {
            if (rT) rT.destroy()
            return !!rT
        }).catch(function (err) {
            console.log('revokeToken - Err: ', err)
            throw err
        })
    }

    /**
     * 生成token时，如果已存在相应的access_token、refresh_token，则不会保存到数据库，改用已存在的token
     * 在grant_type为refresh_token时，即使存在相应token，也会更新token
     * @param token
     * @param client
     * @param user
     * @returns {Promise<T>}
     */
    saveToken(token, client, user) {
        return Promise.all([
            OAuthAccessToken.findOne({
                attributes: ['client_id', 'user_id', 'expires', 'scope', 'access_token'],
                where: {
                    client_id: client.id,
                    user_id: user.id,
                    scope: token.scope,
                    expires: {
                        [Op.gt]: new Date()
                    }
                },
                include: [OAuthClient, User]
            }).then((accessToken) => {
                if (accessToken && user.grant_type !== 'refresh_token') {
                    return accessToken
                } else {
                    return OAuthAccessToken.create({
                        access_token: token.accessToken,
                        expires: token.accessTokenExpiresAt,
                        client_id: client.id,
                        user_id: user.id,
                        scope: token.scope
                    })
                }
            }),
            token.refreshToken ? OAuthRefreshToken.findOne({
                attributes: ['client_id', 'user_id', 'expires', 'scope', 'refresh_token'],
                where: {
                    client_id: client.id,
                    user_id: user.id,
                    scope: token.scope,
                    expires: {
                        [Op.gt]: new Date()
                    }
                },
                include: [OAuthClient, User]
            }).then((refreshToken) => {
                if (refreshToken && user.grant_type !== 'refresh_token') {
                    return refreshToken
                } else {
                    return OAuthRefreshToken.create({ // no refresh token for client_credentials
                        refresh_token: token.refreshToken,
                        expires: token.refreshTokenExpiresAt,
                        client_id: client.id,
                        user_id: user.id,
                        scope: token.scope
                    })
                }
            }) : []

        ])
            .then(function (resultsArray) {
                let accessToken = resultsArray[0].toJSON()
                let refreshToken = resultsArray[1].toJSON()
                return {
                    client: client,
                    user: { id: user.id },
                    accessToken: accessToken.access_token,
                    accessTokenExpiresAt: accessToken.expires,
                    refreshToken: refreshToken.refresh_token,
                    refreshTokenExpiresAt: refreshToken.expires,
                    scope: token.scope
                }
            })
            .catch(function (err) {
                console.log('revokeToken - Err: ', err)
                throw err
            })
    }
}

module.exports = OauthServerModel

