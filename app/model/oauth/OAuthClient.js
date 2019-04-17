module.exports = app => {
    const { STRING } = app.Sequelize

    return app.model.define('OAuthClient', {
        id: {
            type: STRING(80),
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        name: STRING(255),
        client_secret: STRING(80),
        redirect_uri: STRING(2000),
        grant_types: STRING(200),
        scope: STRING(200),
        ban_scope: STRING(200)
    }, {
        tableName: 'oauth_clients',
        timestamps: true,
        underscored: true,
    })
}
