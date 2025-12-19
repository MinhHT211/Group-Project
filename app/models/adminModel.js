'use strict';
module.exports = (sequelize, DataTypes) => {
    const Admins = sequelize.define('Admins', {
        user_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false
        },
        admin_code: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true
        },
    }, {
        tableName: 'Admins',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                fields: ['admin_code'],
                name: ['uq_admins_code'],
                unique: true,
            }
        ]
    });
    Admins.associate = (models) => {
        Admins.belongsTo(models.Users, {
            foreignKey: 'user_id',
            as: 'user',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        })
    }
    return Admins;
}