module.exports = app => {
    const { STRING, DATE } = app.Sequelize

    const OAuthAuthorizationCode = app.model.define('OAuthAuthorizationCode', {
        authorization_code: {
            type: STRING(128),
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        expires: DATE,
        redirect_uri: STRING(2000),
        scope: STRING(200)
    }, {
        tableName: 'oauth_authorization_codes',
        timestamps: true,
        underscored: true,
    })
    OAuthAuthorizationCode.associate = function associate() {
        OAuthAuthorizationCode.OAuthClient = OAuthAuthorizationCode.belongsTo(app.model.Oauth.OAuthClient, {
            foreignKey: 'client_id',
        })

        OAuthAuthorizationCode.User = OAuthAuthorizationCode.belongsTo(app.model.Stu.User, {
            foreignKey: 'user_id',
        })
    }

    return OAuthAuthorizationCode
}

