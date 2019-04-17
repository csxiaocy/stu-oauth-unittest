module.exports = app => {
    const { STRING, INTEGER } = app.Sequelize


    return app.model.define('OAuthScope', {
        id: {
            type: INTEGER(11),
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        scope: STRING(80)
    }, {
        tableName: 'oauth_scopes',
        timestamps: true,
        underscored: true
    })
}