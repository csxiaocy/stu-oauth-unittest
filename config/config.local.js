module.exports = {
    // Mysql 配置
    sequelize: {
        dialect: 'mysql',
        host: 'cdb-7g2jy6qr.gz.tencentcdb.com',
        port: 10053,
        database: 'stu-oauth_dev',
        username: 'candy',
        password: 'Candy666a',
        timezone: '+08:00',
        exclude: 'OauthServerModel.js',
        operatorsAliases: false
    },
}
