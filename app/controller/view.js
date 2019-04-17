// app/controller/post.js
const Controller = require('egg').Controller

class ViewController extends Controller {

    async render() {
        const ctx = this.ctx
        ctx.logger.info(`render page: ${ctx.params.view}`)
        await ctx.render(ctx.params.view)
    }

}

module.exports = ViewController
