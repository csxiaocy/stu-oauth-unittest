/* eslint valid-jsdoc: "off" */


/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
    /**
     * built-in config
     * @type {Egg.EggAppConfig}
     **/
    const config = {
        // 配置静态视图页面使用的模板引擎
        view: {
            mapping: {
                '.nj': 'nunjucks',
            },
            defaultViewEngine: 'nunjucks',  // 默认模板引擎
            defaultExtension: '.nj',    // 默认模板后缀
        },

        session: {
            key: 'CANDY_SESSION',   // Session在Cookie中的键名
            maxAge: 5 * 60 * 1000, // 5分钟
            httpOnly: true,
            encrypt: true,
        },
        accessTokenLifetime: 60 * 60, // 单位秒，accessToken 过期时间为1小时
        refreshTokenLifetime: 30 * 24 * 60 * 60, // 单位秒，refreshTokenLifetime 过期时间为30团

        // Mysql 配置
        sequelize: {
            dialect: 'mysql',
            host: 'cdb-7g2jy6qr.gz.tencentcdb.com',
            port: 10053,
            database: 'stu-oauth',
            username: 'candy',
            password: 'Candy666a',
            timezone: '+08:00',
            exclude: 'OauthServerModel.js',
            operatorsAliases: false
        },

        redis: {
            client: {
                port: 6379,          // Redis port
                host: '139.199.224.230',   // Redis host
                password: 'auth',
                db: 0,
            },
        }
    }

    // use for cookie sign key, should change to your own and keep security
    config.keys = appInfo.name + '_1551701758501_9836'

    // add your middleware config here
    config.middleware = []

    // add your user config here
    const userConfig = {
        // 校园网账号的密码加密秘钥,32位
        pwKey: 'Candy666Candy666Candy666Candy666',
        pwIv: 'Candy666666Candy',

        // 用户信息加密密钥
        userInfoKey: '小糖666a',

        // 由于APP 无需redirect_uri，仅用于用于绕过Oauth验证，该URL无意义
        no_redirect_uri: 'http://no_redirect_uri.com',

        errCatch: {
            responseErrorMsg: true
        }

    }

    const frameworkConfig = {
        errCode: {
            APP_ERROR_CODE: '01',   // 应用错误码，错误码1-2位，其他为3-6位
            NOT_REGISTER_ERROR: '0000', // 未登记默认错误码
        },
        response: {
            ignore: [
                '/favicon.ico',
                '/view'
            ]
        }
    }

    return {
        ...config,
        ...userConfig,
        ...frameworkConfig
    }
}
