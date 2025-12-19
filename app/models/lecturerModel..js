'use strict';
module.exports = (sequelize, DataTypes) => {
    const Lecturers = sequelize.define('Lecturers', {
        user_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false
        },
        lecturer_code: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true
        },
        department_id: {
            type: DataTypes.INTEGER,
            allowNull: false
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
        tableName: 'Lecturers',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                unique: true,
                fields: ['lecturer_code'],
                name: 'uq_lecturers_code'
            },{
                fields: ['department_id'],
                name: 'idx_lecturers_dept'
            },{
                fields: ['is_active'],
                name: 'idx_lecturers_activate'
            }
        ]
    });
    Lecturers.associate = (models) => {
        Lecturers.belongsTo(models.Users, {
            foreignKey: 'user_id',
            as: 'user',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });
        Lecturers.hasMany(models.Students, {
            foreignKey: 'academic_advisor_id',
            as: 'students',
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE'
        });
        Lecturers.belongsTo(models.Departments, {
            foreignKey: 'department_id',
            as: 'department',
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE'
        });
        Lecturers.hasMany(models.Departments, {
            foreignKey: 'head_lecturer_id',
            as: 'head_lecturer',
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE'
        });
        Lecturers.hasMany(models.Classes, {
            foreignKey: 'lecturer_id',
            as: 'classes',
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE'
        });
        Lecturers.hasMany(models.Schedules, {
            foreignKey: 'lecturer_id',
            as: 'schedules',
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE'
        })
    };
    return Lecturers;
}