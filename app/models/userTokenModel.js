'use strict';
module.exports = (sequelize, DataTypes) => {
    const UserTokens = sequelize.define('UserTokens', {
        user_token_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        refresh_token_hash: {
            type: DataTypes.STRING(500),
            allowNull: false,
            unique: true
        },
        refresh_expires_at: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        user_agent: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        ip: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        is_revoked: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        revoked_at: {
            type: DataTypes.DATE,
        },
        last_used_at: DataTypes.DATE,
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'UserTokens',
        timestamps: true,
        underscored: true,
        updatedAt: false,
        indexes: [
            {
                fields: ['user_id', 'is_revoked'],
                name: 'idx_tokens_user_active'
            },{
                fields: ['refresh_token_hash'],
                unique: true,
                name: 'uq_tokens_refresh'
            },{
                fields: ['refresh_expires_at', 'is_revoked'],
                name: 'idx_tokens_valid'
            }
        ]
    });
    UserTokens.associate = (models) => {
        UserTokens.belongsTo(models.Users, {
            foreignKey: 'user_id',
            as: 'user',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        })
    };
    return UserTokens;
}