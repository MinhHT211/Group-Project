'use strict';
module.exports = (sequelize, DataTypes) => {
    const Schedules = sequelize.define('Schedules', {
        schedule_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        class_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        day_of_week: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        start_time: {
            type: DataTypes.TIME,
            allowNull: false
        },
        end_time: {
            type: DataTypes.TIME,
            allowNull: false
        },

        effective_from: {
            type: DataTypes.DATE,
            allowNull: false
        },
        effective_to: {
            type: DataTypes.DATE
        },

        room: {
            type: DataTypes.STRING(20),
            allowNull: false
        },
        building: DataTypes.STRING(50),
        campus: DataTypes.STRING(50),

        schedule_type: {
            type: DataTypes.STRING(20),
            defaultValue: 'lecture'
        },

        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        is_online: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        online_meeting_url: DataTypes.STRING(255),

        notes: DataTypes.TEXT,
        cancelled_dates: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: null,
            comment: "Array of canceled dates in YYYY-MM-DD format for recurring schedules"
        },
        deleted_dates: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: null,
            comment: 'Array of deleted dates in YYYY-MM-DD format for recurring schedules'
        },
        lecturer_id: {
            type: DataTypes.INTEGER,
            allowNull: true, 
        },

    }, {
        tableName: 'Schedules',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                fields: ['class_id', 'day_of_week', 'is_active'],
                name: 'idx_schedules_class_day',
            },
            {
                fields: ['class_id', 'schedule_id'],
                name: 'idx_schedules_class_schedule'
            },
            {
                fields: ['class_id', 'effective_from', 'effective_to'],
                name: 'idx_schedules_class_dates',
            },
            {
                fields: ['room', 'day_of_week', 'start_time'],
                name: 'idx_schedules_room_conflict',
            },
            {
                fields: ['building', 'room'],
                name: 'idx_schedules_location',
            }
        ]
    });
    Schedules.associate = (models) => {
        Schedules.belongsTo(models.Classes, {
            foreignKey: 'class_id',
            as: 'class',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });
        Schedules.hasMany(models.Attendance, {
            foreignKey: 'schedule_id',
            as: 'attendance',
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE'
        });
        Schedules.belongsTo(models.Lecturers, {
            foreignKey: 'lecturer_id',
            as: 'schedule_lecturer',
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE'
        });
    }
    return Schedules;
}