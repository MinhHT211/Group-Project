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
    await queryInterface.createTable('Departments', {
      department_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      department_code: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      department_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT
      },
      head_lecturer_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      phone: {
        type: Sequelize.STRING(20)
      },
      email: {
        type: Sequelize.STRING(100)
      },
      location: {
        type: Sequelize.STRING(255)
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

    await queryInterface.addIndex('Departments', ['department_code'], {
      name: 'uq_departments_code',
      unique: true
    });

    await queryInterface.addIndex('Departments', ['is_active'], {
      name: 'idx_departments_active'
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable('Departments');
  }
};
