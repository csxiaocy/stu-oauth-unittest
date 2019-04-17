module.exports = app => {
    const { STRING, DATE } = app.Sequelize

    const RefreshToken = app.model.define('RefreshToken', {
        refresh_token: {
            type: STRING(128),
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        expires: DATE,
        scope: STRING(200)
    }, {
        tableName: 'oauth_refresh_tokens',
        timestamps: true,
        underscored: true,
    })

    RefreshToken.associate = function associate() {
        RefreshToken.OAuthClient = RefreshToken.belongsTo(app.model.Oauth.OAuthClient, {
            foreignKey: 'client_id',
        })

        RefreshToken.User = RefreshToken.belongsTo(app.model.Stu.User, {
            foreignKey: 'user_id',
        })
    }
    return RefreshToken
}
