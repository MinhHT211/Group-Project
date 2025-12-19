'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.createTable('Courses', {
      course_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      course_code: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      course_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      department_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Departments',
          key: 'department_id'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      },
      credits: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      theory_hours: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      practice_hours: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      course_type: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      level: {
        type: Sequelize.STRING(20),
      },
      description: {
        type: Sequelize.TEXT
      },
      learning_outcomes: {
        type: Sequelize.TEXT
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    await queryInterface.addIndex('Courses', ['course_code'], {
      name: 'uq_courses_code',
      unique: true,
    });

    await queryInterface.addIndex('Courses', ['department_id', 'is_active'], {
      name: 'idx_courses_dept_active',
    });

    await queryInterface.addIndex('Courses', ['course_type'], {
      name: 'idx_courses_type'
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable('Courses');
  }
};
