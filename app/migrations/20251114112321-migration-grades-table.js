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
    await queryInterface.createTable('Grades', {
      grade_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      enrollment_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Enrollment',
          key: 'enrollment_id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      component_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'GradeComponents',
          key: 'component_id'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      },
      score: {
        type: Sequelize.DECIMAL(4, 2)
      },
      graded_by: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Users',
          key: 'user_id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      graded_at: {
        type: Sequelize.DATE
      },
      feedback: {
        type: Sequelize.TEXT,
      },
      attachment_url: {
        type: Sequelize.STRING(255),
      },
      is_excused: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
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

    await queryInterface.addIndex('Grades', ['enrollment_id', 'component_id'], {
      name: 'uq_grades_enrollment_component',
      unique: true,
    });

    await queryInterface.addIndex('Grades', ['enrollment_id'], {
      name: 'idx_grades_enrollment',
    });

    await queryInterface.addIndex('Grades', ['component_id'], {
      name: 'idx_grades_component',
    });

    await queryInterface.addIndex('Grades', ['graded_by'], {
      name: 'idx_grades_graded_by',
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable('Grades');
  }
};
