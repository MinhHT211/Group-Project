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
    await queryInterface.createTable('GradeComponents', {
      component_id: {
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
      component_name: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      component_type: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      weight: {
        type: Sequelize.DECIMAL(4, 2),
        allowNull: false
      },
      max_score: {
        type: Sequelize.DECIMAL(4, 2),
        allowNull: false,
        defaultValue: 20
      },
      due_date: {
        type: Sequelize.DATE
      },
      exam_date: {
        type: Sequelize.DATE
      },
      order_index: {
        type: Sequelize.INTEGER,
        defaultValue: 0
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

    await queryInterface.addIndex('GradeComponents', ['class_id', 'order_index'], {
      name: 'idx_gc_class_order',
    });

    await queryInterface.addIndex('GradeComponents', ['class_id', 'component_type'], {
      name: 'idx_gc_class_type',
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable('GradeComponents');
  }
};
