module.exports = {
    up: async (queryInterface, Sequelize) => {
        /*
          Add altering commands here.
          Return a promise to correctly handle asynchronicity.

          Example:
          return queryInterface.createTable('users', { id: Sequelize.INTEGER });
        */
        const { INTEGER, DATE, STRING, BLOB } = Sequelize

        // 用户表
        await queryInterface.createTable('user', {
            id: {
                type: STRING(32),
                primaryKey: true,
                allowNull: false,
                unique: true,
            },
            info: BLOB,
            created_at: DATE,
            updated_at: DATE,
        })


        // 客户端配置表
        await queryInterface.createTable('oauth_clients', {
            id: {
                type: STRING(80),
                primaryKey: true,
                allowNull: false,
                unique: true,
            },
            name: STRING(255),
            client_secret: {
                allowNull: false,
                type: STRING(80),
            },
            redirect_uri: {
                allowNull: false, type: STRING(2000),
                defaultValue: 'http://no_redirect_uri.com'
            },
            grant_types: {
                allowNull: false, type: STRING(200),
            },
            scope: {
                allowNull: false, type: STRING(200),
            },
            ban_scope: STRING(200),
            created_at: DATE,
            updated_at: DATE,
        })


        await queryInterface.bulkInsert('oauth_clients', [{
            id: 'syllabus-app',
            name: 'stu-app',
            client_secret: 'stu',
            redirect_uri: 'http://no_redirect_uri.com',
            grant_types: 'refresh_token authorization_code',
            scope: '*',
            created_at: new Date(),
            updated_at: new Date()
        }])

        // oauth_access_tokens表
        await queryInterface.createTable('oauth_access_tokens', {
            // 凭证
            access_token: {
                type: STRING(128),
                primaryKey: true,
                allowNull: false,
                unique: true,
            },
            // 过期时间
            expires: {
                type: DATE,
                allowNull: false,
            },
            // 凭证的权限
            scope: {
                type: STRING(200),
                allowNull: false,
            },
            // 客户端id
            client_id: {
                type: STRING(80),
                references: {
                    model: 'oauth_clients',
                    key: 'id'
                },
                allowNull: false,
                onUpdate: 'cascade',
                onDelete: 'cascade'
            },
            // 用户id
            user_id: {
                type: STRING(80),
                references: {
                    model: 'user',
                    key: 'id'
                },
                allowNull: false,
                onUpdate: 'cascade',
                onDelete: 'cascade'
            },
            created_at: DATE,
            updated_at: DATE,
        })

        // 授权码表
        await queryInterface.createTable('oauth_authorization_codes', {
            authorization_code: {
                type: STRING(128),
                primaryKey: true,
                allowNull: false,
                unique: true,
            },
            expires: { allowNull: false, type: DATE },
            redirect_uri: { allowNull: false, type: STRING(2000) },
            scope: STRING(200),
            // 客户端id
            client_id: {
                type: STRING(80),
                references: {
                    model: 'oauth_clients',
                    key: 'id'
                },
                allowNull: false,
                onUpdate: 'cascade',
                onDelete: 'cascade'
            },
            // 用户id
            user_id: {
                type: STRING(80),
                references: {
                    model: 'user',
                    key: 'id'
                },
                allowNull: false,
                onUpdate: 'cascade',
                onDelete: 'cascade'
            },
            created_at: DATE,
            updated_at: DATE,
        })

        // oauth_refresh_tokens 表
        await queryInterface.createTable('oauth_refresh_tokens', {
            refresh_token: {
                type: STRING(128),
                primaryKey: true,
                allowNull: false,
                unique: true,
            },
            expires: {
                allowNull: false, type: DATE
            },
            scope: STRING(200),
            // 客户端id
            client_id: {
                type: STRING(80),
                references: {
                    model: 'oauth_clients',
                    key: 'id'
                },
                allowNull: false,
                onUpdate: 'cascade',
                onDelete: 'cascade'
            },
            // 用户id
            user_id: {
                type: STRING(80),
                references: {
                    model: 'user',
                    key: 'id'
                },
                allowNull: false,
                onUpdate: 'cascade',
                onDelete: 'cascade'
            },
            created_at: DATE,
            updated_at: DATE,
        })

        await queryInterface.createTable('oauth_scopes', {
            id: {
                type: INTEGER(11),
                autoIncrement: true,
                primaryKey: true,
                allowNull: false,
                unique: true,
            },
            scope: {
                allowNull: false, type: STRING(80)
            },
            created_at: DATE,
            updated_at: DATE,
        })

        await queryInterface.createTable('password', {
            id: {
                type: STRING(32),
                primaryKey: true,
                allowNull: false,
                references: {
                    model: 'user',
                    key: 'id'
                },
                onUpdate: 'cascade',
                onDelete: 'cascade'
            },
            password: {
                type: STRING(256),
                allowNull: false,
            },
            created_at: DATE,
            updated_at: DATE,
        })

    },

    down: async (queryInterface, Sequelize) => {
        /*
          Add reverting commands here.
          Return a promise to correctly handle asynchronicity.
        */

        // 顺序不能改变，因为有外键，要先删除有外键依赖的表
        await queryInterface.dropTable('password')
        await queryInterface.dropTable('oauth_access_tokens')
        await queryInterface.dropTable('oauth_authorization_codes')
        await queryInterface.dropTable('oauth_refresh_tokens')
        await queryInterface.dropTable('user')
        await queryInterface.dropTable('oauth_clients')
        await queryInterface.dropTable('oauth_scopes')
    }
}
