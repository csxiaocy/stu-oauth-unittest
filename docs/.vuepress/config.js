module.exports = {
    title: 'stu-oauth',
    description: '课程表开放平台',
    head: [
        ['link', { rel: 'icon', href: '/favicon.jpg' }], // 增加一个自定义的 favicon(网页标签的图标)
        // ['script', { src: '/oauth.js' }], // Oauth 认证
    ],
    base: '/stu-oauth/', // 这是部署到github相关的配置
    dest: 'public',
    markdown: {
        lineNumbers: false // 代码块显示行号
    },
    themeConfig: {
        sidebarDepth: 2, // e'b将同时提取markdown中h2 和 h3 标题，显示在侧边栏上。
        lastUpdated: 'Last Updated', // 文档更新时间：每个文件git最后提交的时间
        sidebar: {
            '/guide/': [
                {
                    title: '指南',
                    collapsable: false,
                    children: [
                        ['/guide/介绍.md', '介绍'],
                        ['/guide/授权码模式.md', '授权码模式'],
                        ['/guide/刷新凭证.md', '刷新凭证'],
                        ['/guide/接口文档.md', '接口文档'],
                    ]
                },
            ],
            '/theory/': [
                {
                    title: '框架原理',
                    collapsable: false,
                    children: [
                        ['/theory/中间件.md', '中间件'],
                        ['/theory/扩展.md', '扩展'],
                        ['/theory/其他.md', '其他'],
                    ]
                },
            ],
        },
        nav: [
            { text: '首页', link: '/' },
            { text: '指南', link: '/guide/介绍' },
            { text: '框架原理', link: '/theory/中间件' },
            { text: 'Git', link: 'https://git.code.tencent.com/stu-syllabus/mini-pro-framework' },
        ],
    }
}
