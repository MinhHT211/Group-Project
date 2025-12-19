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
    await queryInterface.createTable('Classes', {
      class_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      course_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Courses',
          key: 'course_id'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      },
      semester_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Semesters',
          key: 'semester_id'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      },
      lecturer_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Lecturers',
          key: 'user_id'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      },
      class_code: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      class_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      max_capacity: {
        type: Sequelize.INTEGER,
        defaultValue: 50,
      },
      current_enrollment: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      class_type: {
        type: Sequelize.STRING(20),
        defaultValue: 'regular'
      },
      class_status: {
        type: Sequelize.STRING(20),
        defaultValue: 'planning'
      },
      start_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      end_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      syllabus_url: {
        type: Sequelize.STRING(255)
      },
      notes: {
        type: Sequelize.TEXT
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

    await queryInterface.addIndex('Classes', ['class_code'], {
      name: 'uq_classes_code',
      unique: true,
    });

    await queryInterface.addIndex('Classes', ['course_id', 'semester_id'], {
      name: 'idx_classes_course_sem'
    });

    await queryInterface.addIndex('Classes', ['lecturer_id', 'semester_id'], {
      name: 'idx_classes_lecturer_sem'
    });

    await queryInterface.addIndex('Classes', ['semester_id', 'class_status'], {
      name: 'idx_classes_sem_status'
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable('Classes');
  }
};
