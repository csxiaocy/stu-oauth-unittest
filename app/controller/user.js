// app/controller/post.js
const Controller = require('egg').Controller


class UserController extends Controller {

    /**
     * 汕头大学校园网账号密码登录
     * @return {Promise<void>}
     */
    async getUserInfo() {
        const ctx = this.ctx
        ctx.body = {
            user: {
                id: ctx.user.id,
                info: ctx.user.info
            }
        }
    }

    /**
     * 获取用户课程
     * @return {Promise<void>}
     */
    async getUserLesson() {
        const { ctx } = this
        ctx.validate({
            year: 'string',
            semester: ['1', '2', '3']
        }, ctx.query)

        const user_id = ctx.user.id
        // TODO 暂不支持老师，待支持
        const min_year = parseInt(`20${user_id.substr(0, 2)}`, 10)
        const year = parseInt(ctx.query.year, 10)
        if (year < min_year || year >= min_year + 6) {
            throw ctx.helper.createError('[查询用户课程] 年份不符合要求，不能低于入学年份且不高于入学后年')
        }
        const semester = parseInt(ctx.query.semester, 10)

        // TODO 限流
        let lessons
        // eslint-disable-next-line no-constant-condition
        if (false) {
            lessons = await ctx.service.user.getLessonFromDb({ user_id, year, semester })
        } else {
            const student_num = ctx.user.info.student_num
            lessons = await ctx.service.stu.getUserLessonFromCredit({ user_id, student_num, year, semester })
        }

        ctx.body = {
            year,
            semester,
            lessons
        }


    }

}

module.exports = UserController
