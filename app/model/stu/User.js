module.exports = app => {
    const { STRING, BLOB } = app.Sequelize

    const User = app.model.define('User', {
        id: {
            type: STRING(32),
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        info: BLOB
    }, {
        tableName: 'user', // oauth_users
        timestamps: true,
        underscored: true,
    })

    return User
}
