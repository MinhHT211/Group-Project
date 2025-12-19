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
    await queryInterface.createTable('Attendance', {
      attendance_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      class_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Classes',
          key: 'class_id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
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
      schedule_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Schedules',
          key: 'schedule_id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      attendance_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      session_number: {
        type: Sequelize.INTEGER
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'present'
      },
      check_in_time: {
        type: Sequelize.DATE
      },
      notes: {
        type: Sequelize.TEXT
      },
      recorded_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'user_id'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      },
      recorded_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
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

    await queryInterface.addIndex('Attendance', ['class_id', 'student_id', 'schedule_id', 'attendance_date', 'session_number'], {
      name: 'uq_attendance',
      unique: true,
    });

    await queryInterface.addIndex('Attendance', ['student_id', 'attendance_date'], {
      name: 'idx_attendance_student_date',
    });

    await queryInterface.addIndex('Attendance', ['class_id', 'attendance_date', 'status'], {
      name: 'idx_attendance_class_date_status',
    });

    await queryInterface.addIndex('Attendance', ['schedule_id'], {
      name: 'idx_attendance_schedule',
    });

    await queryInterface.addConstraint('Attendance', {
      fields: ['class_id', 'schedule_id'],
      type: 'foreign key',
      name: 'fk_attendance_class_schedule',
      references: {
        table: 'Schedules',
        fields: ['class_id', 'schedule_id']
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    try {
      await queryInterface.removeConstraint('Attendance', 'fk_attendance_class_schedule');
    } catch (err) {
    }
    await queryInterface.dropTable('Attendance');
  }
};
