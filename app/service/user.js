// app/service/oauth.js


const Service = require('egg').Service


class UserService extends Service {

    /**
     * 从数据库获取课程信息
     * @param user_id
     * @param year
     * @param semester
     * @returns {Promise<*>}
     */
    async getLessonFromDb({ user_id, year, semester }) {
        const { app } = this
        const { Schedule, Lesson, UserLesson } = app.model.Stu
        let lessons = await Lesson.findAll({
            attributes: ['id', 'name', 'teacher', 'credit'],
            include: [{
                attributes: ['time', 'begin_time', 'end_time', 'day', 'room', 'week'],
                model: Schedule,
                as: 'schedule'
            }, {
                model: UserLesson,
                as: 'userLesson',
                where: {
                    user_id,
                    year,
                    semester
                }
            }]
        })
        if (!lessons || lessons.length === 0) {
            return []
        } else {
            return lessons.map(lesson => {
                let course = lesson.toJSON()
                delete course.userLesson
                return course
            })
        }
    }

}

module.exports = UserService
