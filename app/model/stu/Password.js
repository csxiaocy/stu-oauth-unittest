module.exports = app => {
    const { STRING } = app.Sequelize

    const Password = app.model.define('Password', {
        id: {
            type: STRING(32),
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        password: {
            type: STRING(256),
            allowNull: false,
        },
    }, {
        tableName: 'password',
        timestamps: true,
        underscored: true,
    })

    Password.associate = function associate() {
        Password.User = app.model.Stu.Password.belongsTo(app.model.Stu.User, {
            foreignKey: 'id',
            as: 'user'
        })
    }
    return Password
}
