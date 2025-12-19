'use strict';
module.exports = (sequelize, DataTypes) => {
    const Assistants = sequelize.define('Assistants', {
        user_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false
        },
        assistant_code: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true
        },
        department_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        academic_rank: {
            type: DataTypes.STRING(50)
        },
        degree: DataTypes.STRING(50),
        office_room: DataTypes.STRING(50),
        office_hours: DataTypes.STRING(255),

        bio: DataTypes.TEXT,
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        }
    }, {
        tableName: 'Assistants',
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
    Assistants.associate = (models) => {
        Assistants.belongsTo(models.Users, {
            foreignKey: 'user_id',
            as: 'user',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        }),
        Assistants.belongsTo(models.Departments, {
            foreignKey: 'department_id',
            as: 'department',
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE'
        })
    }
    return Assistants;
}