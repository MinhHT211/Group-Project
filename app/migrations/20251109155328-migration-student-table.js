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
    await queryInterface.createTable('Students', {
      user_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'user_id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      student_code: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      major_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Majors',
          key: 'major_id'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      },
      admission_year: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      expected_graduation_year: {
        type: Sequelize.INTEGER,
      },
      student_status: {
        type: Sequelize.STRING(20),
        defaultValue: 'active'
      },
      academic_advisor_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Lecturers',
          key: 'user_id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
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

    await queryInterface.addIndex('Students', ['student_code'], {
      name: 'uq_students_code',
      unique: true
    });

    await queryInterface.addIndex('Students', ['major_id'], {
      name: 'idx_students_major',
    });

    await queryInterface.addIndex('Students', ['admission_year'], {
      name: 'idx_students_admission',
    });

    await queryInterface.addIndex('Students', ['student_status'], {
      name: 'idx_students_status',
    });

    await queryInterface.addIndex('Students', ['academic_advisor_id'], {
      name: 'idx_students_advisor',
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable('Students');
  }
};
