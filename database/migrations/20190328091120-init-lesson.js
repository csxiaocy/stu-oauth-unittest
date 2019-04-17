module.exports = {
    up: async (queryInterface, Sequelize) => {
        /*
          Add altering commands here.
          Return a promise to correctly handle asynchronicity.

          Example:
          return queryInterface.createTable('users', { id: Sequelize.INTEGER });
        */
        const { TINYINT, DATE, STRING, INTEGER, FLOAT } = Sequelize


        // 课程数据表
        await queryInterface.createTable('lesson', {
            id: {
                type: STRING(32),
                primaryKey: true,
                allowNull: false,
                unique: true,
            },
            name: STRING(64),
            teacher: STRING(32),
            credit: STRING(8),
            year: INTEGER,
            semester: TINYINT(1),
            created_at: DATE,
            updated_at: DATE,
        })

        // 课程安排
        await queryInterface.createTable('schedule', {
            lesson_id: {
                type: STRING(32),
                primaryKey: true,
                references: {
                    model: 'lesson',
                    key: 'id'
                },
                onUpdate: 'cascade',
                onDelete: 'cascade'
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
            created_at: DATE,
            updated_at: DATE,
        })


        // 选课数据表
        await queryInterface.createTable('user-lesson', {
            user_id: {
                type: STRING(32),
                unique: 'user-lesson',
                references: {
                    model: 'user',
                    key: 'id'
                },
                onUpdate: 'cascade',
                onDelete: 'cascade'
            },
            lesson_id: {
                type: STRING(32),
                unique: 'user-lesson',
                references: {
                    model: 'lesson',
                    key: 'id'
                },
                onUpdate: 'cascade',
                onDelete: 'cascade'
            },
            year: INTEGER,
            semester: TINYINT(1),
            created_at: DATE,
            updated_at: DATE,
        })

    },

    down: async (queryInterface, Sequelize) => {
        // 顺序不能改变，因为有外键，要先删除有外键依赖的表
        await queryInterface.dropTable('user-lesson')
        await queryInterface.dropTable('schedule')
        await queryInterface.dropTable('lesson')
    }
}
