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
    await queryInterface.createTable('Majors', {
      major_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      major_code: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      major_name: {
        type: Sequelize.STRING(100),
        allowNull: false
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
      degree_type: {
        type: Sequelize.STRING(50)
      },
      required_credits: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 120
      },
      duration_years: {
        type: Sequelize.INTEGER,
        defaultValue: 4
      },
      description: {
        type: Sequelize.TEXT
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
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

    await queryInterface.addIndex('Majors', ['major_code'], {
      name: 'uq_majors_code',
      unique: true
    });

    await queryInterface.addIndex('Majors', ['department_id', 'is_active'], {
      name: 'idx_majors_dept_active'
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable('Majors');
  }
};
