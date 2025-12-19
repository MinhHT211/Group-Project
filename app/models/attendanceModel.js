'use strict';
module.exports = (sequelize, DataTypes) => {
    const Attendance = sequelize.define('Attendance', {
        attendance_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        class_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        student_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        schedule_id: {
            type: DataTypes.INTEGER,
        },

        attendance_date: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        session_number: DataTypes.INTEGER,

        status: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: 'present'
        },
        check_in_time: DataTypes.DATE,

        notes: DataTypes.TEXT,
        recorded_by: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        recorded_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'Attendance',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                fields: ['class_id', 'student_id', 'schedule_id', 'attendance_date', 'session_number'],
                name: 'uq_attendance',
                unique: true,
            },
            {
                fields: ['student_id', 'attendance_date'],
                name: 'idx_attendance_student_date',
            },
            {
                fields: ['class_id', 'attendance_date', 'status'],
                name: 'idx_attendance_class_date_status',
            },
            {
                fields: ['schedule_id'],
                name: 'idx_attendance_schedule',
            }
        ]
    });
    Attendance.associate = (models) => {
        Attendance.belongsTo(models.Classes, {
            foreignKey: 'class_id',
            as: 'class',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });
        Attendance.belongsTo(models.Users, {
            foreignKey: 'recorded_by',
            as: 'user',
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE'
        });
        Attendance.belongsTo(models.Students, {
            foreignKey: 'student_id',
            as: 'student',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });
        Attendance.belongsTo(models.Schedules, {
            foreignKey: 'schedule_id',
            as: 'schedule',
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE'
        });
    }
    return Attendance;
}