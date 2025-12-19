'use strict';
module.exports = (sequelize, DataTypes) => {
    const Enrollment = sequelize.define('Enrollment', {
        enrollment_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true

        },
        student_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        class_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        enrollment_status: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: 'enrolled'
        },
        enrollment_type: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: 'regular'
        },
        enrollment_date: { 
            type: DataTypes.DATE, 
            defaultValue: DataTypes.NOW
        },

        drop_date: { 
            type: DataTypes.DATE, 
        },
        completion_date: { 
            type: DataTypes.DATE, 
        },

        //grade
        mini_test_grade: DataTypes.DECIMAL(4, 2),
        assignment_grade: DataTypes.DECIMAL(4, 2),
        lab_work_grade: DataTypes.DECIMAL(4, 2),
        midterm_grade: DataTypes.DECIMAL(4, 2),
        final_grade: DataTypes.DECIMAL(4, 2),
        total_grade: DataTypes.DECIMAL(4, 2),
        letter_grade: DataTypes.STRING(2),
        gpa_value: DataTypes.DECIMAL(4, 2),
        is_passed: DataTypes.BOOLEAN,

        //attendance
        total_sessions: { 
            type: DataTypes.INTEGER, 
            defaultValue: 0
        },
        attended_sessions: { 
            type: DataTypes.DECIMAL(3,1), 
            defaultValue: 0
        },
        attendance_rate: DataTypes.DECIMAL(5, 2),

        notes: DataTypes.TEXT,
    }, {
        tableName: 'Enrollment',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                fields: ['student_id', 'class_id'],
                name: 'uq_enrollment_student_class',
                unique: true,
            },
            {
                fields: ['student_id', 'enrollment_status'],
                name: 'idx_enrollment_student_status',
            },
            {
                fields: ['class_id', 'enrollment_status'],
                name: 'idx_enrollment_class_status',
            }
        ]
    });
    Enrollment.associate = (models) => {
        Enrollment.belongsTo(models.Students, {
            foreignKey: 'student_id',
            as: 'student',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });
        Enrollment.belongsTo(models.Classes, {
            foreignKey: 'class_id',
            as: 'class',
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE'
        });
        Enrollment.hasMany(models.Grades, {
            foreignKey: 'enrollment_id',
            as: 'grades',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });
    }
    return Enrollment;
}