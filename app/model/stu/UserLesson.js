module.exports = app => {
    const { TINYINT, INTEGER } = app.Sequelize

    const UesrLesson = app.model.define('UserLesson', {
        year: INTEGER,
        semester: TINYINT(1),
    }, {
        tableName: 'user-lesson',
        timestamps: true,
        underscored: true,
    })

    UesrLesson.associate = function associate() {
        const { User, Lesson } = app.model.Stu

        User.belongsToMany(Lesson, { through: UesrLesson })
        Lesson.belongsToMany(User, { through: UesrLesson })

        UesrLesson.Lesson = User.belongsTo(app.model.Stu.Lesson, {
            foreignKey: 'id',
            as: 'userLesson'
        })
    }

    return UesrLesson
}
