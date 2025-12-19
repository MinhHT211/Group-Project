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
    await queryInterface.createTable('Schedules', {
      schedule_id: {
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
      day_of_week: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      start_time: {
        type: Sequelize.TIME,
        allowNull: false
      },
      end_time: {
        type: Sequelize.TIME,
        allowNull: false
      },
      effective_from: {
        type: Sequelize.DATE,
        allowNull: false
      },
      effective_to: {
        type: Sequelize.DATE
      },
      room: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      building: {
        type: Sequelize.STRING(50)
      },
      campus: {
        type: Sequelize.STRING(50)
      },
      schedule_type: {
        type: Sequelize.STRING(20),
        defaultValue: 'lecture'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      is_online: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      online_meeting_url: {
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
      },
      cancelled_dates: {
        type: Sequelize.JSON,

        defaultValue: false,
        allowNull: true
      },
      deleted_dates: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null
      },
      deleted_dates: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null
      },
      lecturer_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Lecturers',
          key: 'user_id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
    });

    await queryInterface.addIndex('Schedules', ['class_id', 'day_of_week', 'is_active'], {
      name: 'idx_schedules_class_day',
    });

    await queryInterface.addIndex('Schedules', ['class_id', 'schedule_id'], {
      name: 'idx_schedules_class_schedule'
    });
    
    await queryInterface.addIndex('Schedules', ['class_id', 'effective_from', 'effective_to'], {
      name: 'idx_schedules_class_dates',
    });

    await queryInterface.addIndex('Schedules', ['room', 'day_of_week', 'start_time'], {
      name: 'idx_schedules_room_conflict',
    });

    await queryInterface.addIndex('Schedules', ['building', 'room'], {
      name: 'idx_schedules_location',
    });
    await queryInterface.addIndex('Schedules', ['lecturer_id'], {
      name: 'idx_schedules_lecturer'
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable('Schedules');
  }
};
