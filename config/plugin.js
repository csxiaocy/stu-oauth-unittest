/** @type Egg.EggPlugin */
module.exports = {
    // had enabled by egg
    // static: {
    //   enable: true,
    // }
    sequelize: {
        enable: true,
        package: 'egg-sequelize',
    },

    // 开启模板引擎
    nunjucks: {
        enable: true,
        package: 'egg-view-nunjucks'
    },

    // redis: {
    //     enable: true,
    //     package: 'egg-redis',
    // }
}
