'use strict';
module.exports = (sequelize, DataTypes) => {
    const Departments = sequelize.define('Departments', {
        department_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        department_code: {
            type: DataTypes.STRING(20),
            allowNull: false,
            unique: true,
        },
        department_name: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT
        },
        head_lecturer_id: {
            type: DataTypes.INTEGER
        },
        phone: DataTypes.STRING(20),
        email: DataTypes.STRING(100),
        location: DataTypes.STRING(255),
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        }
    }, {
        tableName: 'Departments',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                fields: ['department_code'],
                unique: true,
                name: 'uq_departments_code'
            }, {
                fields: ['is_active'],
                name: 'idx_departments_active'
            }
        ]
    });
    Departments.associate = (models) => {
        Departments.hasMany(models.Majors, {
            foreignKey: 'department_id',
            as: 'majors',
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE'
        });
        Departments.hasMany(models.Assistants, {
            foreignKey: 'department_id',
            as: 'assistants',
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE'
        });
        Departments.hasMany(models.Lecturers, {
            foreignKey: 'department_id',
            as: 'lecturers',
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE'
        });
        Departments.belongsTo(models.Lecturers, {
            foreignKey: 'head_lecturer_id',
            as: 'head_lecturer',
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE'
        });
        Departments.hasMany(models.Courses, {
            foreignKey: 'department_id',
            as: 'courses',
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE'
        });
    }
    return Departments
}