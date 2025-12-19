'use strict';
module.exports = (sequelize, DataTypes) => {
    const Classes = sequelize.define('Classes', {
        class_id: { 
            type: DataTypes.INTEGER, 
            autoIncrement: true, 
            primaryKey: true
        },
        course_id: { 
            type: DataTypes.INTEGER,
            allowNull: false
        },
        semester_id: { 
            type: DataTypes.INTEGER,
            allowNull: false
        },
        lecturer_id: { 
            type: DataTypes.INTEGER,
            allowNull: false
        },
        class_code: { 
            type: DataTypes.STRING(20),
            allowNull: false,
            unique: true,
        },
        class_name: { 
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        max_capacity: { 
            type: DataTypes.INTEGER,
            defaultValue: 50,
        },
        current_enrollment: { 
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        class_type: { 
            type: DataTypes.STRING(20),
            defaultValue: 'regular'
        },
        class_status: { 
            type: DataTypes.STRING(20),
            defaultValue: 'planning'
        },
        start_date: { 
            type: DataTypes.DATE,
            allowNull: false
        },
        end_date: { 
            type: DataTypes.DATE,
            allowNull: false
        },
        syllabus_url: {
            type: DataTypes.STRING(255)
        },
        notes: DataTypes.TEXT,
    }, {
        tableName: 'Classes',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                fields: ['class_code'],
                name: 'uq_classes_code',
                unique: true,
            },
            {
                fields: ['course_id', 'semester_id'],
                name: 'idx_classes_course_sem'
            },
            {
                fields: ['lecturer_id', 'semester_id'],
                name: 'idx_classes_lecturer_sem'
            },
            {
                fields: ['semester_id', 'class_status'],
                name: 'idx_classes_sem_status'
            }
        ]
    });
    Classes.associate = (models) => {
        Classes.belongsTo(models.Lecturers, {
            foreignKey: 'lecturer_id',
            as: 'lecturer',
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE'
        });
        Classes.belongsTo(models.Semesters, {
            foreignKey: 'semester_id',
            as: 'semester',
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE'
        });
        Classes.belongsTo(models.Courses, {
            foreignKey: 'course_id',
            as: 'course',
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE'
        });
        Classes.hasMany(models.Enrollment, {
            foreignKey: 'class_id',
            as: 'enrollment',
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE'
        });
        Classes.hasMany(models.Attendance, {
            foreignKey: 'class_id',
            as: 'attendance',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });
        Classes.hasMany(models.GradeComponents, {
            foreignKey: 'class_id',
            as: 'components',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });
        Classes.hasMany(models.Schedules, {
            foreignKey: 'class_id',
            as: 'schedules',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });     
    };
    return Classes;
};