module.exports = app => {
    const { STRING, FLOAT, TINYINT, INTEGER } = app.Sequelize

    const Schedule = app.model.define('Schedule', {
        lesson_id: {
            type: STRING(32),
            allowNull: false,
            primaryKey: true
        },
        time: {
            type: STRING(32),
            primaryKey: true
        },
        begin_time: FLOAT,
        end_time: FLOAT,
        day: {
            type: TINYINT(1),
            primaryKey: true
        },
        room: {
            type: STRING,
            primaryKey: true
        },
        week: {
            type: INTEGER,
            primaryKey: true
        },
    }, {
        tableName: 'schedule',
        timestamps: true,
        underscored: true,
    })

    Schedule.associate = function associate() {
        Schedule.Lesson = Schedule.belongsTo(app.model.Stu.Lesson, {
            foreignKey: 'lesson_id',
            as: 'schedule'
        })
    }
    return Schedule
}
