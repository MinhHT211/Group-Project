const { UserTokens } = require('../models');
const { Op } = require('sequelize');

class AuthRepository {
  async CreateRefreshTokens(payload, transaction) {
    try {
      return await UserTokens.create(payload, { transaction });
    } catch (error) {
      throw new Error('Failed to create refresh token');
    }
  }

  async FindValidByHash(hash) {
    try {
      return await UserTokens.findOne({
        where: {
          refresh_token_hash: hash,
          is_revoked: false,
        },
        attributes: [
          'user_token_id',
          'user_id',
          'refresh_token_hash',
          'refresh_expires_at',
          'is_revoked',
          'user_agent',
          'ip',
          'last_used_at',
          'created_at'
        ]
      });
    } catch (error) {
      throw new Error('Failed to find token');
    }
  }
  //Logout
  async RevokeById(id, transaction = null) {
    try {
      const options = {
        where: { user_token_id: id }
      };
      if (transaction) {
        options.transaction = transaction;
      }
      return await UserTokens.update(
        {
          is_revoked: true,
          revoked_at: new Date(),
        },
        options
      );
    } catch (error) {
        throw new Error('Failed to revoke token');
    }
  }
  //For change password
  async RevokeAllOfUser(userId, transaction = null) {
    try {
      const options = {
        where: { 
          user_id: userId,
          is_revoked: false
        }
      };
      if (transaction) {
        options.transaction = transaction;
      }
      return await UserTokens.update(
        {
          is_revoked: true,
          revoked_at: new Date(),
        },
        options
      );
    } catch (error) {
      throw new Error('Failed to revoke user tokens');
    }
  }
  
  async touchLastUsed(userTokenId) {
    try {
      return await UserTokens.update(
        { last_used_at: new Date() },
        { where: { user_token_id: userTokenId } }
      );
    } catch (error) {
      throw new Error('Failed to update token usage');
    }
  }

  async deleteExpired() {
    try {
      return await UserTokens.destroy({
        where: {
          [Op.or]: [
            { is_revoked: true },
            { refresh_expires_at: { [Op.lt]: new Date() } }
          ]
        }
      });
    } catch (error) {
      throw new Error('Failed to delete expired tokens');
    }
  }

  async cleanupOldTokens() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return await UserTokens.destroy({
        where: {
          is_revoked: true,
          revoked_at: { [Op.lt]: thirtyDaysAgo }
        }
      });
    } catch (error) {
      throw new Error('Failed to cleanup old tokens');
    }
  }
}
module.exports = new AuthRepository();