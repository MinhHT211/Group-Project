'use strict';
module.exports = (sequelize, DataTypes) => {
    const UserRoles = sequelize.define('UserRoles', {
        user_role_id: { 
            type: DataTypes.INTEGER, 
            autoIncrement: true, 
            primaryKey: true
        },
        user_id: { 
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true
        },
        role_id: { 
            type: DataTypes.INTEGER,
            allowNull: false
        },
        assigned_by: {
            type: DataTypes.INTEGER,
        },
        expires_at: { 
            type: DataTypes.DATE,
            allowNull: true,
        },
        is_active: { 
            type: DataTypes.BOOLEAN, 
            defaultValue: true
        }
    }, {
        tableName: 'UserRoles',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                unique: true,
                fields: ['user_id'],
                name: 'uq_user_roles_user'
            },
            {
                fields: ['role_id'],
                name: 'idx_ur_role'
            }
        ]
    });
    UserRoles.associate = (models) => {
        UserRoles.belongsTo(models.Users, {
            foreignKey: 'user_id',
            as: 'user',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });
        UserRoles.belongsTo(models.Users, {
            foreignKey: 'assigned_by',
            as: 'assigner',
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE'
        });
        UserRoles.belongsTo(models.Roles, {
            foreignKey: 'role_id',
            as: 'role',
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE'
        })
    };
    return UserRoles;
};