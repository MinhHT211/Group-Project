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
    await queryInterface.createTable('Assistants', {
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
      assistant_code: {
        type: Sequelize.STRING(50),
        allowNull: false,
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
      academic_rank: {
        type: Sequelize.STRING(50)
      },
      degree: {
        type: Sequelize.STRING(50)
      },
      office_room: {
        type: Sequelize.STRING(50)
      },
      office_hours: {
        type: Sequelize.STRING(255)
      },
      bio: {
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

    await queryInterface.addIndex('Assistants', ['assistant_code'], {
      unique: true,
      name: 'uq_assistants_code'
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable('Assistants');
  }
};
