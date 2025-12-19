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
    await queryInterface.createTable('UserTokens', {
      user_token_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'user_id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      refresh_token_hash: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      refresh_expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      user_agent: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      ip: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      is_revoked: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      revoked_at: {
        type: Sequelize.DATE,
      },
      last_used_at: {
        type: Sequelize.DATE
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    await queryInterface.addIndex('UserTokens', ['user_id', 'is_revoked'], {
      name: 'idx_tokens_user_active'
    });

    await queryInterface.addIndex('UserTokens', ['refresh_token_hash'], {
      name: 'uq_tokens_refresh',
      unique: true
    });

    await queryInterface.addIndex('UserTokens', ['refresh_expires_at', 'is_revoked'], {
      name: 'idx_tokens_valid'
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable('UserTokens');
  }
};
