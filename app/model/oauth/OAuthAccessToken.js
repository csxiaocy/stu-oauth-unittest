module.exports = app => {
    const { STRING, DATE } = app.Sequelize

    const OAuthAccessToken = app.model.define('OAuthAccessToken', {
        access_token: {
            type: STRING(128),
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        expires: DATE,
        scope: STRING(200)
    }, {
        tableName: 'oauth_access_tokens',
        timestamps: true,
        underscored: true,
    })

    OAuthAccessToken.associate = function () {
        OAuthAccessToken.OAuthClient = OAuthAccessToken.belongsTo(app.model.Oauth.OAuthClient, {
            foreignKey: 'client_id',
        })

        OAuthAccessToken.User = OAuthAccessToken.belongsTo(app.model.Stu.User, {
            foreignKey: 'user_id',
        })
    }
    return OAuthAccessToken
}

