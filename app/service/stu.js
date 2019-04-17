// app/service/oauth.js

const jsdom = require('jsdom')
const request_promise = require('request-promise')
const { JSDOM } = jsdom
const iconv = require('iconv-lite')

// 汕头大学上课时间对照表
const stuLessonTimeTable = {
    '1': { begin: 8, end: 8.45 },
    '2': { begin: 8.55, end: 9.40 },
    '3': { begin: 10, end: 10.45 },
    '4': { begin: 10.55, end: 11.40 },
    '5': { begin: 11.50, end: 12.35 },
    '6': { begin: 14, end: 14.45 },
    '7': { begin: 14.55, end: 15.40 },
    '8': { begin: 16, end: 16.45 },
    '9': { begin: 16.55, end: 17.40 },
    '0': { begin: 17.50, end: 18.35 },
    'A': { begin: 19.20, end: 20.05 },
    'B': { begin: 20.15, end: 21 },
    'C': { begin: 21.10, end: 21.55 }
}
// 课程表格的列的含义
const LESSON_KEY = {
    id: 0,
    name: 1,
    credit: 2,
    teacher: 3,
    room: 4,
    beginAndEndWeek: 5,
    Sunday: 6
}
// 教室表的列含义
const ROOM_DETAIL_KEY = {
    room: 1,
    beginAndEndWeek: 3,
    Sunday: 4
}

const Service = require('egg').Service

// 私有方法Symbol
const LOGIN_CREDIT = Symbol('loginCredit')      // 登录学分制
const PARSE_LESSONS = Symbol('parseLessons')    // 解析课程
const PARSE_SINGLE_CLASSROOM_SCHEDULE = Symbol('parseSingleClassroomSchedule')  // 解析单个课程的安排
const PARSE_MULTI_CLASSROOM_SCHEDULE = Symbol('parseMultiClassroomSchedule')    // 解析多个课程的安排
const SAVE_LESSON = Symbol('saveLesson')        // 保存课程到数据库

class StuService extends Service {

    /**
     * 登录学分制，返回学分制登录态的cookieJar
     * @param account
     * @param password
     * @returns {Promise<void>}
     */
    async [LOGIN_CREDIT](account, password) {
        const { ctx } = this

        // TODO 查询是否存在cookie缓存
        let j = request_promise.jar()
        const request = request_promise.defaults({ jar: j, encoding: null })

        // __VIEWSTATE __EVENTVALIDATION 暂不知道是否会失效
        let data = {
            __EVENTTARGET: '',
            __EVENTARGUMENT: '',
            '__VIEWSTATE': '/wEPDwUKMTM1MzI1Njg5N2RkI1hN60S7vP7vNjr2ii38MZbz0nk=',
            '__VIEWSTATEGENERATOR': 'FBAF4793',
            '__EVENTVALIDATION': '/wEWBAKMmv3UCQLT8dy8BQLG8eCkDwKk07qFCUn/CVCGo9/c1vDFzCEtfi+/KtW5',
            txtUserID: account,
            txtUserPwd: password,
            btnLogon: '登录'
        }


        let options = {
            method: 'POST',
            url: 'http://credit2.stu.edu.cn/portal/stulogin.aspx',
            headers: {
                'content-type': 'application/x-www-form-urlencoded'
            },
            form: data
        }
        let res
        try {
            ctx.logger.debug('[登录学分制] 开始请求')
            res = await request(options)
            ctx.logger.info('[登录学分制] 请求完成')
        } catch (e) {
			// console.log(e.error.code)
            // TODO 增加未连接校园网的错误
            if (e.error.code === 'ENOTFOUND') {
                throw ctx.helper.createError('[登录学分制] 发生错误，未连接校园网')
            }
            throw ctx.helper.createError('[登录学分制] 发生错误，可能需要修改请求参数')
        }
        res = iconv.decode(res, 'GBK')
        ctx.logger.debug('[登录学分制] 解码')
        switch (true) {
            case res.includes('认证服务器密码错误'):
                throw ctx.helper.createError('[登录学分制] 用户密码错误')
            default:
                return j
        }
    }

    /**
     * 同步学分制课程
     * @param user_id
     * @param user_num
     * @param year
     * @param semester
     * @returns {Promise<void>}
     */
    async getUserLessonFromCredit({ user_id, student_num = this.ctx.user.student_num, year, semester }) {

        const { ctx } = this

        const user = await ctx.service.oauth.getUserPassword(user_id)
        const cookieJar = await ctx.service.stu[LOGIN_CREDIT](user.id, user.password)
        const request = request_promise.defaults({ jar: cookieJar, encoding: null })

        // __VIEWSTATE __EVENTVALIDATION 暂不知道是否会失效
        let options = {
            method: 'POST',
            url: 'http://credit2.stu.edu.cn/Student/StudentTimeTable.aspx',
            qs: { ObjID: student_num },
            headers: {
                'content-type': 'application/x-www-form-urlencoded'
            },
            form: {
                __EVENTTARGET: '',
                __EVENTARGUMENT: '',
                __VIEWSTATE: '/wEPDwUJMjI2Nzg1MDM1D2QWAgIBD2QWCAIBD2QWBGYPEA8WAh4EVGV4dAUPMjAxNi0yMDE35a2m5bm0ZBAVBw8yMDEzLTIwMTTlrablubQPMjAxNC0yMDE15a2m5bm0DzIwMTUtMjAxNuWtpuW5tA8yMDE2LTIwMTflrablubQPMjAxNy0yMDE45a2m5bm0DzIwMTgtMjAxOeWtpuW5tA8yMDE5LTIwMjDlrablubQVBw8yMDEzLTIwMTTlrablubQPMjAxNC0yMDE15a2m5bm0DzIwMTUtMjAxNuWtpuW5tA8yMDE2LTIwMTflrablubQPMjAxNy0yMDE45a2m5bm0DzIwMTgtMjAxOeWtpuW5tA8yMDE5LTIwMjDlrablubQUKwMHZ2dnZ2dnZxYAZAIBDxBkZBYBZmQCBQ8UKwALDxYIHghEYXRhS2V5cxYAHgtfIUl0ZW1Db3VudAIKHglQYWdlQ291bnQCAR4VXyFEYXRhU291cmNlSXRlbUNvdW50AgpkZBYEHghDc3NDbGFzcwUMREdQYWdlclN0eWxlHgRfIVNCAgIWBB8FBQ1ER0hlYWRlclN0eWxlHwYCAhYEHwUFDURHRm9vdGVyU3R5bGUfBgICFgQfBQULREdJdGVtU3R5bGUfBgICFgQfBQUWREdBbHRlcm5hdGluZ0l0ZW1TdHlsZR8GAgIWBB8FBRNER1NlbGVjdGVkSXRlbVN0eWxlHwYCAhYEHwUFD0RHRWRpdEl0ZW1TdHlsZR8GAgIWBB8FBQJERx8GAgJkFgJmD2QWFgIBDw9kFgQeC29ubW91c2VvdmVyBStqYXZhc2NyaXB0OnRoaXMuY2xhc3NOYW1lPSdER0l0ZW1Nb3VzZW92ZXInHgpvbm1vdXNlb3V0BSdqYXZhc2NyaXB0OnRoaXMuY2xhc3NOYW1lPSdER0l0ZW1TdHlsZScWHmYPDxYCHwAFBTkyOTAxZGQCAQ9kFgICAQ8PFgQeC05hdmlnYXRlVXJsBUp+L0luZm8vRGlzcGxheUtrYi5hc3B4P0NsYXNzSUQ9OTI5MDEmYXV0aD0zOUNDQjBCMjNCQTgwQTZFQkI5QTc4NDBFMTE1REYwQx8ABQU5MjkwMWRkAgIPDxYCHwAFBDYzMTVkZAIDD2QWAmYPDxYEHwAFKltDU1QyMTA0QV3orqHnrpfmnLrnu4Tnu4fkuI7kvZPns7vnu5PmnoRJSR8JBSUuLi9Db3Vyc2UvRGlzcENvdXJzZUluZm8uYXNweD9pZD02MzE1ZGQCBA8PFgIfAAUDMy4wZGQCBQ9kFgJmDw8WBB8ABVPolKHnjrLlpoIgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIB8JBS4uLi9UZWFjaGVyL0NsYXNzVGVhY2hlckluZm8uYXNweD9DbGFzc0lEPTkyOTAxZGQCBg9kFgJmDw8WBB8ABVBFMzAxICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIB8JBS4uLi9Db3Vyc2VQbGFuL3ZpZXdjbGFzc3Jvb20uYXNweD9DbGFzc0lEPTkyOTAxZGQCBw8PFgIfAAUKMSAtMTYgICAgIGRkAggPDxYCHwAFDyAgICAgICAgICAgICAgIGRkAgkPDxYCHwAFDzM0NSAgICAgICAgICAgIGRkAgoPDxYCHwAFDyAgICAgICAgICAgICAgIGRkAgsPDxYCHwAFDyAgICAgICAgICAgICAgIGRkAgwPDxYCHwAFDyAgICAgICAgICAgICAgIGRkAg0PDxYCHwAFDyAgICAgICAgICAgICAgIGRkAg4PDxYCHwAFDyAgICAgICAgICAgICAgIGRkAgIPD2QWBB8HBStqYXZhc2NyaXB0OnRoaXMuY2xhc3NOYW1lPSdER0l0ZW1Nb3VzZW92ZXInHwgFMmphdmFzY3JpcHQ6dGhpcy5jbGFzc05hbWU9J0RHQWx0ZXJuYXRpbmdJdGVtU3R5bGUnFh5mDw8WAh8ABQU5MjkwMGRkAgEPZBYCAgEPDxYEHwkFSn4vSW5mby9EaXNwbGF5S2tiLmFzcHg/Q2xhc3NJRD05MjkwMCZhdXRoPUU4MzBEMjFCRjQ4M0U1MTk3OUQ1MjQwQjI0RDc3RUVCHwAFBTkyOTAwZGQCAg8PFgIfAAUENjMzMGRkAgMPZBYCZg8PFgQfAAUfW0NTVDIzMDVCXeaVsOaNrue7k+aehOS4jueul+azlR8JBSUuLi9Db3Vyc2UvRGlzcENvdXJzZUluZm8uYXNweD9pZD02MzMwZGQCBA8PFgIfAAUDNC4wZGQCBQ9kFgJmDw8WBB8ABVLkuo7mtKUgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgHwkFLi4uL1RlYWNoZXIvQ2xhc3NUZWFjaGVySW5mby5hc3B4P0NsYXNzSUQ9OTI5MDBkZAIGD2QWAmYPDxYEHwAFVEXpmLbmoq/mlZnlrqQyMDEgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIB8JBS4uLi9Db3Vyc2VQbGFuL3ZpZXdjbGFzc3Jvb20uYXNweD9DbGFzc0lEPTkyOTAwZGQCBw8PFgIfAAUKMSAtMTYgICAgIGRkAggPDxYCHwAFDyAgICAgICAgICAgICAgIGRkAgkPDxYCHwAFDyAgICAgICAgICAgICAgIGRkAgoPDxYCHwAFDzg5ICAgICAgICAgICAgIGRkAgsPDxYCHwAFDyAgICAgICAgICAgICAgIGRkAgwPDxYCHwAFDzg5ICAgICAgICAgICAgIGRkAg0PDxYCHwAFDyAgICAgICAgICAgICAgIGRkAg4PDxYCHwAFDyAgICAgICAgICAgICAgIGRkAgMPD2QWBB8HBStqYXZhc2NyaXB0OnRoaXMuY2xhc3NOYW1lPSdER0l0ZW1Nb3VzZW92ZXInHwgFJ2phdmFzY3JpcHQ6dGhpcy5jbGFzc05hbWU9J0RHSXRlbVN0eWxlJxYeZg8PFgIfAAUFOTI5MDJkZAIBD2QWAgIBDw8WBB8JBUp+L0luZm8vRGlzcGxheUtrYi5hc3B4P0NsYXNzSUQ9OTI5MDImYXV0aD1FQTdDNDg2MjI1NzM5RTkxMUIwNjVCQjMyQjFFQzg4Nx8ABQU5MjkwMmRkAgIPDxYCHwAFBDYzOTRkZAIDD2QWAmYPDxYEHwAFGVtDU1QzMjU1QV1XRULlupTnlKjmioDmnK8fCQUlLi4vQ291cnNlL0Rpc3BDb3Vyc2VJbmZvLmFzcHg/aWQ9NjM5NGRkAgQPDxYCHwAFAzIuMGRkAgUPZBYCZg8PFgQfAAVT5aec5aSn5b+XICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAfCQUuLi4vVGVhY2hlci9DbGFzc1RlYWNoZXJJbmZvLmFzcHg/Q2xhc3NJRD05MjkwMmRkAgYPZBYCZg8PFgQfAAVRROW6pzMwMSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgHwkFLi4uL0NvdXJzZVBsYW4vdmlld2NsYXNzcm9vbS5hc3B4P0NsYXNzSUQ9OTI5MDJkZAIHDw8WAh8ABQoxIC0xNiAgICAgZGQCCA8PFgIfAAUPICAgICAgICAgICAgICAgZGQCCQ8PFgIfAAUPICAgICAgICAgICAgICAgZGQCCg8PFgIfAAUPMTIgICAgICAgICAgICAgZGQCCw8PFgIfAAUPICAgICAgICAgICAgICAgZGQCDA8PFgIfAAUPICAgICAgICAgICAgICAgZGQCDQ8PFgIfAAUPICAgICAgICAgICAgICAgZGQCDg8PFgIfAAUPICAgICAgICAgICAgICAgZGQCBA8PZBYEHwcFK2phdmFzY3JpcHQ6dGhpcy5jbGFzc05hbWU9J0RHSXRlbU1vdXNlb3ZlcicfCAUyamF2YXNjcmlwdDp0aGlzLmNsYXNzTmFtZT0nREdBbHRlcm5hdGluZ0l0ZW1TdHlsZScWHmYPDxYCHwAFBTkzMzQwZGQCAQ9kFgICAQ8PFgQfCQVKfi9JbmZvL0Rpc3BsYXlLa2IuYXNweD9DbGFzc0lEPTkzMzQwJmF1dGg9RENGRjE1MDFFRjRGQ0IxMjQwRTlERDIwQ0JCMTUyMTAfAAUFOTMzNDBkZAICDw8WAh8ABQQ1NDY4ZGQCAw9kFgJmDw8WBB8ABR9bQ1NUMzU1MUFd5a6e5pe25YiG5biD5byP57O757ufHwkFJS4uL0NvdXJzZS9EaXNwQ291cnNlSW5mby5hc3B4P2lkPTU0NjhkZAIEDw8WAh8ABQMyLjBkZAIFD2QWAmYPDxYEHwAFUuiUoea1qSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAfCQUuLi4vVGVhY2hlci9DbGFzc1RlYWNoZXJJbmZvLmFzcHg/Q2xhc3NJRD05MzM0MGRkAgYPZBYCZg8PFgQfAAVRROW6pzQwNiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgHwkFLi4uL0NvdXJzZVBsYW4vdmlld2NsYXNzcm9vbS5hc3B4P0NsYXNzSUQ9OTMzNDBkZAIHDw8WAh8ABQoxIC0xNiAgICAgZGQCCA8PFgIfAAUPICAgICAgICAgICAgICAgZGQCCQ8PFgIfAAUPICAgICAgICAgICAgICAgZGQCCg8PFgIfAAUPNjcgICAgICAgICAgICAgZGQCCw8PFgIfAAUPICAgICAgICAgICAgICAgZGQCDA8PFgIfAAUPICAgICAgICAgICAgICAgZGQCDQ8PFgIfAAUPICAgICAgICAgICAgICAgZGQCDg8PFgIfAAUPICAgICAgICAgICAgICAgZGQCBQ8PZBYEHwcFK2phdmFzY3JpcHQ6dGhpcy5jbGFzc05hbWU9J0RHSXRlbU1vdXNlb3ZlcicfCAUnamF2YXNjcmlwdDp0aGlzLmNsYXNzTmFtZT0nREdJdGVtU3R5bGUnFh5mDw8WAh8ABQU5MTEzOGRkAgEPZBYCAgEPDxYEHwkFSn4vSW5mby9EaXNwbGF5S2tiLmFzcHg/Q2xhc3NJRD05MTEzOCZhdXRoPTQzOEY1QUUyMjQ2RjkzQzVGMTdEQ0JDRTQ1QzMyNEE5HwAFBTkxMTM4ZGQCAg8PFgIfAAUENTY0NGRkAgMPZBYCZg8PFgQfAAUZW0hFRDYzMTBBXeenkeWtpuaKgOacr+WPsh8JBSUuLi9Db3Vyc2UvRGlzcENvdXJzZUluZm8uYXNweD9pZD01NjQ0ZGQCBA8PFgIfAAUDMi4wZGQCBQ9kFgJmDw8WBB8ABVXpmYjlro/llpwo5aSW6IGYKSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgHwkFLi4uL1RlYWNoZXIvQ2xhc3NUZWFjaGVySW5mby5hc3B4P0NsYXNzSUQ9OTExMzhkZAIGD2QWAmYPDxYEHwAFU+iusuWgguWbmyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgHwkFLi4uL0NvdXJzZVBsYW4vdmlld2NsYXNzcm9vbS5hc3B4P0NsYXNzSUQ9OTExMzhkZAIHDw8WAh8ABQoxIC0xNiAgICAgZGQCCA8PFgIfAAUPICAgICAgICAgICAgICAgZGQCCQ8PFgIfAAUPICAgICAgICAgICAgICAgZGQCCg8PFgIfAAUPICAgICAgICAgICAgICAgZGQCCw8PFgIfAAUPICAgICAgICAgICAgICAgZGQCDA8PFgIfAAUPICAgICAgICAgICAgICAgZGQCDQ8PFgIfAAUPODkgICAgICAgICAgICAgZGQCDg8PFgIfAAUPICAgICAgICAgICAgICAgZGQCBg8PZBYEHwcFK2phdmFzY3JpcHQ6dGhpcy5jbGFzc05hbWU9J0RHSXRlbU1vdXNlb3ZlcicfCAUyamF2YXNjcmlwdDp0aGlzLmNsYXNzTmFtZT0nREdBbHRlcm5hdGluZ0l0ZW1TdHlsZScWHmYPDxYCHwAFBTkxNTAxZGQCAQ9kFgICAQ8PFgQfCQVKfi9JbmZvL0Rpc3BsYXlLa2IuYXNweD9DbGFzc0lEPTkxNTAxJmF1dGg9MUNGNDgzRUYxNDM3QjI5MkRDOUZFM0RBQzg0M0Q0RjEfAAUFOTE1MDFkZAICDw8WAh8ABQMyMzRkZAIDD2QWAmYPDxYEHwAFLltNQVQyODAyQV3mpoLnjoforrrkuI7mlbDnkIbnu5/orqHvvIjlt6Xnp5HvvIkfCQUkLi4vQ291cnNlL0Rpc3BDb3Vyc2VJbmZvLmFzcHg/aWQ9MjM0ZGQCBA8PFgIfAAUDMy4wZGQCBQ9kFgJmDw8WBB8ABVPosLfmlY/lvLogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIB8JBS4uLi9UZWFjaGVyL0NsYXNzVGVhY2hlckluZm8uYXNweD9DbGFzc0lEPTkxNTAxZGQCBg9kFgJmDw8WBB8ABVPorrLloILkuIkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIB8JBS4uLi9Db3Vyc2VQbGFuL3ZpZXdjbGFzc3Jvb20uYXNweD9DbGFzc0lEPTkxNTAxZGQCBw8PFgIfAAUKMSAtMTYgICAgIGRkAggPDxYCHwAFDyAgICAgICAgICAgICAgIGRkAgkPDxYCHwAFEOWNlTEyICAgICAgICAgICBkZAIKDw8WAh8ABQ8gICAgICAgICAgICAgICBkZAILDw8WAh8ABQ8zNCAgICAgICAgICAgICBkZAIMDw8WAh8ABQ8gICAgICAgICAgICAgICBkZAINDw8WAh8ABQ8gICAgICAgICAgICAgICBkZAIODw8WAh8ABQ8gICAgICAgICAgICAgICBkZAIHDw9kFgQfBwUramF2YXNjcmlwdDp0aGlzLmNsYXNzTmFtZT0nREdJdGVtTW91c2VvdmVyJx8IBSdqYXZhc2NyaXB0OnRoaXMuY2xhc3NOYW1lPSdER0l0ZW1TdHlsZScWHmYPDxYCHwAFBTkzNzk0ZGQCAQ9kFgICAQ8PFgQfCQVKfi9JbmZvL0Rpc3BsYXlLa2IuYXNweD9DbGFzc0lEPTkzNzk0JmF1dGg9QjQxREVCQjFDNDI2NjRFRTlDODVGQzNBRjZFNEE4QzkfAAUFOTM3OTRkZAICDw8WAh8ABQQ3NTA1ZGQCAw9kFgJmDw8WBB8ABS5bT0xDMDAwMkFd5ZC+5Zu95pWZ6IKy55eF55CG77yI572R57uc6K++56iL77yJHwkFJS4uL0NvdXJzZS9EaXNwQ291cnNlSW5mby5hc3B4P2lkPTc1MDVkZAIEDw8WAh8ABQMyLjBkZAIFD2QWAmYPDxYEHwAFUCogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgHwkFLi4uL1RlYWNoZXIvQ2xhc3NUZWFjaGVySW5mby5hc3B4P0NsYXNzSUQ9OTM3OTRkZAIGD2QWAmYPDxYEHwAFUCogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg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',
                __VIEWSTATEGENERATOR: 'E672B8C6',
                __EVENTVALIDATION: '/wEWDgKIg/2bAQKA2K7WDwKs3faYCwKj3ZrWCALF5PiNDALE5IzLDQLD5MCbDwKv3YqZDQKg3YroAgL7tY9IAvi1j0gC+rWPSAL63YQMAqWf8+4K4DUMyfuhZsr7CFSVLe4sdkvo5Ms=',
                'ucsYS$XN$Text': `${year}-${year + 1}学年`,
                'ucsYS$XQ': semester,
                'btnSearch.x': '1',
                'btnSearch.y': '1'
            }
        }

        // 请求学分制课程页面
        let syllabusPage
        try {
            ctx.logger.debug('[查询课表] 开始请求')
            syllabusPage = await request(options)
            ctx.logger.info('[查询课表] 请求完成')
        } catch (e) {
            if (e.error.toString().includes('error')) {
                throw ctx.helper.createError('[查询课表] 请求课表页面，参数错误')
            }
            throw ctx.helper.createError('[查询课表] 请求课表页面，未知错误')
        }
        // 页面解码
        syllabusPage = iconv.decode(syllabusPage, 'GBK')

        // 页面错误处理
        switch (true) {
            case syllabusPage.includes('页面已超时'):
                throw ctx.helper.createError('[查询课表] Cookie过期')
        }

        // 解析课表HTML页面
        let lessons = await this[PARSE_LESSONS](syllabusPage)

        // TODO 通过事件解耦，使用agent处理
        // 缓存用户课表
        this[SAVE_LESSON](ctx.user.id, year, semester, lessons)
        return lessons
    }

    /**
     * 缓存课程到数据库
     * @private
     * @param user_id 用户
     * @param year 年份
     * @param semester 学期
     * @param lessons 课程
     * @returns {Promise<void>}
     */
    async [SAVE_LESSON](user_id, year, semester, lessons) {
        const { app, ctx } = this
        const { Lesson, UserLesson, Schedule } = app.model.Stu

        const Sequelize = app.Sequelize
        const Op = Sequelize.Op

        let transaction
        try {
            transaction = await ctx.model.transaction()
            await Promise.all([

                // 删除该用户选课，以防用户变更选课后，旧的选课信息仍存在数据库中
                UserLesson.destroy({
                    where: {
                        user_id,
                        year,
                        semester
                    }
                }, transaction),

                // 删除对应课程的时间安排表，以防课程时间变更后，旧的课程时间仍存在于数据库中
                Schedule.destroy({
                    where: {
                        lesson_id: {
                            [Op.in]: lessons.map(lesson => lesson.id)
                        }
                    }
                }, transaction)
            ])

            // 批量插入课程信息
            const lessonList = lessons.map(lesson => {
                const { id, name, teacher, credit } = lesson
                return {
                    id, name, teacher, credit, year, semester
                }
            })
            await Lesson.bulkCreate(lessonList, { updateOnDuplicate: [], transaction })


            // 批量插入课程时间表
            let ScheduleList = []
            lessons.forEach(lesson => {
                ScheduleList = ScheduleList.concat(lesson.schedule.map(val => {
                    return {
                        ...val,
                        lesson_id: lesson.id
                    }
                }))
            })
            await Schedule.bulkCreate(ScheduleList, { updateOnDuplicate: [], transaction })

            // 批量插入选课表
            const userLessonList = lessons.map(lesson => {
                return {
                    user_id,
                    year,
                    semester,
                    lesson_id: lesson.id
                }
            })
            await UserLesson.bulkCreate(userLessonList, { updateOnDuplicate: [], transaction })

            await transaction.commit()

        } catch (e) {
            await transaction.rollback()
            throw ctx.helper.createError(`[SAVE_LESSON] ${e.message}`)
        }
    }

    /**
     * 解析课程信息
     * @private
     * @param syllabusPage 课程信息DOM
     * @returns {Promise<[{schedule: *, teacher: string, name: string, id: string, credit: string}]>} 课程信息对象
     */
    async [PARSE_LESSONS](syllabusPage) {

        const dom = new JSDOM(syllabusPage)
        const document = dom.window.document

        // 取原始课程DOM对象
        const lessonDom = document.querySelectorAll('#DataGrid1 > tbody > tr:not(:first-child):not(:last-child)')

        // 遍历课程表格DOM的每一行，每一行代表一个课程
        const lessonsPromise = Array.from(lessonDom).map(async row => {
            const id = row.children[LESSON_KEY.id].firstElementChild.innerHTML.trim()
            const name = row.children[LESSON_KEY.name].firstElementChild.innerHTML.trim()
            const credit = row.children[LESSON_KEY.credit].innerHTML.trim()
            const teacher = row.children[LESSON_KEY.teacher].firstElementChild.innerHTML.trim()
            const beginAndEndWeek = row.children[LESSON_KEY.beginAndEndWeek].innerHTML.trim()
            const room = row.children[LESSON_KEY.room].firstElementChild.innerHTML.trim().replace(/座/, '')

            let schedule

            // 判断是否为多教室的课程，如整合思维
            if (room.includes('/')) {
                schedule = await this[PARSE_MULTI_CLASSROOM_SCHEDULE](id)
            } else {
                schedule = this[PARSE_SINGLE_CLASSROOM_SCHEDULE]({
                    dom: Array.from(row.children)
                        .slice(LESSON_KEY.Sunday),
                    beginAndEndWeek,
                    room
                })
            }

            return {
                id,
                name,
                teacher,
                credit,
                schedule
            }
        })
        const lessons = await Promise.all(lessonsPromise)
        return lessons
    }

    /**
     * 构建单个教室课程的时间表
     * @private
     * @param dom   单个课程的课程时间的DOM数组（周日-周六）
     * @param beginAndEndWeek   起始结束周
     * @param room  课程教室
     * @returns {Promise<Array>}    课程时间安排数组
     */
    [PARSE_SINGLE_CLASSROOM_SCHEDULE]({ dom, beginAndEndWeek, room }) {
        const schedule = []

        // 遍历周日到周六，生成一周的课程时间表
        dom.forEach((val, index) => {
            const time = val.innerHTML.trim()
            if (time) {
                let lessonTime = time
                const [beginWeek, endWeek] = beginAndEndWeek.split('-')
                let week = 0
                let weekType = 'all'    // 区分单双周
                if (/^单(.*)$/.test(time)) {
                    weekType = 'single'
                    lessonTime = RegExp.$1
                } else if (/^双(.*)$/.test(time)) {
                    weekType = 'double'
                    lessonTime = RegExp.$1
                }
                for (let i = beginWeek - 1; i < endWeek; i++) {
                    if (weekType === 'single' && i % 2 === 1) {
                        continue
                    } else if (weekType === 'double' && i % 2 === 0) {
                        continue
                    }
                    week = week | (1 << i)
                }
                schedule.push({
                    time,
                    begin_time: stuLessonTimeTable[lessonTime[0]].begin,
                    end_time: stuLessonTimeTable[lessonTime[lessonTime.length - 1]].end,
                    day: index,
                    room,
                    week
                })
            }
        })
        return schedule
    }

    /**
     * 构建多教室课程的时间表
     * @param id 课程id
     * @returns {Promise<Array>} 课程时间安排数组
     */
    async [PARSE_MULTI_CLASSROOM_SCHEDULE](id) {
        let request = require('request-promise')

        // 请求查看教室详情
        let options = {
            method: 'GET',
            url: 'http://credit2.stu.edu.cn/CoursePlan/viewclassroom.aspx',
            qs: { ClassID: id },
            encoding: null
        }
        let res = await request(options)
        res = iconv.decode(res, 'GBK')

        const dom = new JSDOM(res)
        const document = dom.window.document

        let classroomDom = document.querySelectorAll('#DataGrid1 > tbody > tr:not(:first-child)')
        let schedule = []
        // 遍历每行教室信息，并生成课程时间表
        Array.from(classroomDom).forEach(row => {
            const room = row.children[ROOM_DETAIL_KEY.room].innerHTML.trim().replace(/座/, '')
            const beginAndEndWeek = row.children[ROOM_DETAIL_KEY.beginAndEndWeek].innerHTML.split('周')[0].trim()
            schedule = schedule.concat(this[PARSE_SINGLE_CLASSROOM_SCHEDULE]({
                dom: Array.from(row.children)
                    .slice(ROOM_DETAIL_KEY.Sunday),
                beginAndEndWeek,
                room
            }))
        })
        return schedule
    }

}

module.exports = StuService
