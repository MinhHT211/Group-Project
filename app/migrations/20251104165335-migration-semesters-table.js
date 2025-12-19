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
    await queryInterface.createTable('Semesters', {
      semester_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      semester_code: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      semester_name: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      academic_year: {
        type: Sequelize.STRING(10),
        allowNull: false,
      },
      enrollment_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
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

    await queryInterface.addIndex('Semesters', ['semester_code'], {
      name: 'uq_semesters_code',
      unique: true
    });

    await queryInterface.addIndex('Semesters', ['is_active'], {
      name: 'idx_semesters_active'
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable('Semesters');
  }
};
