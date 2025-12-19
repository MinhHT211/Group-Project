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
    await queryInterface.createTable('Enrollment', {
      enrollment_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      student_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Students',
          key: 'user_id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      class_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Classes',
          key: 'class_id'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      },
      enrollment_status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'enrolled'
      },
      enrollment_type: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'regular'
      },
      enrollment_date: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      drop_date: {
        type: Sequelize.DATE,
      },
      completion_date: {
        type: Sequelize.DATE,
      },
      mini_test_grade: {
        type: Sequelize.DECIMAL(4, 2)
      },
      assignment_grade: {
        type: Sequelize.DECIMAL(4, 2)
      },
      lab_work_grade: {
        type: Sequelize.DECIMAL(4, 2)
      },
      midterm_grade: {
        type: Sequelize.DECIMAL(4, 2)
      },
      final_grade: {
        type: Sequelize.DECIMAL(4, 2)
      },
      total_grade: {
        type: Sequelize.DECIMAL(4, 2)
      },
      letter_grade: {
        type: Sequelize.STRING(2)
      },
      gpa_value: {
        type: Sequelize.DECIMAL(4, 2)
      },
      is_passed: {
        type: Sequelize.BOOLEAN
      },
      total_sessions: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      attended_sessions: {
        type: Sequelize.DECIMAL(3,1),
        defaultValue: 0
      },
      attendance_rate: {
        type: Sequelize.DECIMAL(5, 2)
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

    await queryInterface.addIndex('Enrollment', ['student_id', 'class_id'], {
      name: 'uq_enrollment_student_class',
      unique: true,
    });

    await queryInterface.addIndex('Enrollment', ['student_id', 'enrollment_status'], {
      name: 'idx_enrollment_student_status',
    });

    await queryInterface.addIndex('Enrollment', ['class_id', 'enrollment_status'], {
      name: 'idx_enrollment_class_status',
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable('Enrollment');
  }
};
