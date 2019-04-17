module.exports = app => {
    const { STRING, TINYINT, INTEGER } = app.Sequelize

    const Lesson =  app.model.define('Lesson', {
        id: {
            type: STRING(32),
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        name: STRING(64),
        teacher: STRING(32),
        credit: TINYINT(1),
        year: INTEGER,
        semester: TINYINT(1),
    }, {
        tableName: 'lesson',
        timestamps: true,
        underscored: true,
    })

    Lesson.associate = function associate() {
        Lesson.Schedule = Lesson.hasMany(app.model.Stu.Schedule, {
            foreignKey: 'lesson_id',
            as: 'schedule'
        })
        Lesson.UserLesson = Lesson.hasMany(app.model.Stu.UserLesson, {
            foreignKey: 'lesson_id',
            as: 'userLesson'
        })
    }
    return Lesson
}
