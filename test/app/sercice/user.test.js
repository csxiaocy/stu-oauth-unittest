const { app, assert } = require('egg-mock/bootstrap')

describe('NewsaoService', () => {

    describe('#loginNewSao', () => {

        // TODO 写单元测试用例

        it('get lesson', async () => {
            const ctx = app.mockContext()
            const user = await ctx.service.user.getLessonFromDb('15cthuang')
            assert(!user)
        })
    })

})
