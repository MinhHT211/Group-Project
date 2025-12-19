'use strict';
module.exports = (sequelize, DataTypes) => {
    const Courses = sequelize.define('Courses', {
        course_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        course_code: {
            type: DataTypes.STRING(20),
            allowNull: false,
            unique: true
        },
        course_name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        department_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        credits: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        theory_hours: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        practice_hours: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        course_type: {
            type: DataTypes.STRING(20),
            allowNull: false
        },
        level: {
            type: DataTypes.STRING(20),
        },
        description: DataTypes.TEXT,
        learning_outcomes: DataTypes.TEXT,
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        }
    }, {
        tableName: 'Courses',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                fields: ['course_code'],
                name: 'uq_courses_code',
                unique: true,
            },
            {
                fields: ['department_id', 'is_active'],
                name: 'idx_courses_dept_active',
            },
            {
                fields: ['course_type'],
                name: 'idx_courses_type'
            }
        ]
    });
    Courses.associate = (models) => {
        Courses.hasMany(models.Classes, {
            foreignKey: 'course_id',
            as: 'classes',
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE'
        });
        Courses.belongsTo(models.Departments, {
            foreignKey: 'department_id',
            as: 'department',
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE'
        })
    }
    return Courses;
}