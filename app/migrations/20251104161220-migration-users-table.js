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
    await queryInterface.createTable('Users', {
      user_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      username: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(100)
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      first_name: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      last_name: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      full_name: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      date_of_birth: {
        type: Sequelize.DATEONLY
      },
      gender: {
        type: Sequelize.STRING(20) 
      },
      phone: {
        type: Sequelize.STRING(20)
      },
      address: {
        type: Sequelize.STRING(255)
      },
      avatar_url: {
        type: Sequelize.STRING(255)
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      is_deleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      last_login_at: {
        type: Sequelize.DATE
      },
      password_changed_at: {
        type: Sequelize.DATE
      },
      deleted_at: {
        type: Sequelize.DATE
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

    await queryInterface.addIndex('Users', ['username'], {
      name: 'uq_users_username',
      unique: true
    });

    await queryInterface.addIndex('Users', ['email'], {
      name: 'uq_users_email',
      unique: true
    });

    await queryInterface.addIndex('Users', ['is_active', 'is_deleted'], {
      name: 'idx_users_status'
    });

    await queryInterface.addIndex('Users', ['last_name', 'first_name'], {
      name: 'idx_users_name'
    });
    },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable('Users');
  }
};
