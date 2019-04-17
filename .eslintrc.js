module.exports = {
    extends: [
        "eslint-config-egg",
        'eslint-config-alloy'
    ],
    globals: {
        // 这里填入你的项目需要的全局变量
        // 这里值为 false 表示这个全局变量不允许被重新赋值，比如：
    },
    rules: {
        // 这里填入你的项目需要的个性化配置，比如：
        "quotes": [
            "error",
            "single"
        ],
        "semi": [
            "error",
            "never"
        ],
        "handle-callback-err":0
    }
};