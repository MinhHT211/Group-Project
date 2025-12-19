'use strict';
module.exports = (sequelize, DataTypes) => {
    const Roles = sequelize.define('Roles', {
        role_id: { 
            type: DataTypes.INTEGER, 
            autoIncrement: true, 
            primaryKey: true
        },
        role_name: { 
            type: DataTypes.STRING(50), 
            allowNull: false, 
            unique: true
        },
        role_description: DataTypes.TEXT,
        is_active: { 
            type: DataTypes.BOOLEAN, 
            defaultValue: true
        }
    }, {
        tableName: 'Roles',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                unique: true,
                fields: ['role_name'],
                name: 'uq_roles_name'
            }
        ]
    });
    Roles.associate = (models) => {
        Roles.hasMany(models.UserRoles, {
            foreignKey: 'role_id',
            as: 'user_roles',
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE'
        });
    }
    return Roles;
}