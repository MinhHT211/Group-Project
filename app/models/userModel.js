'use strict';
module.exports = (sequelize, DataTypes) => {
    const Users = sequelize.define('Users', {
        user_id: { 
            type: DataTypes.INTEGER, 
            primaryKey: true, 
            autoIncrement: true
        },
        username: { 
            type: DataTypes.STRING(100), 
            allowNull: false, 
            unique: true
        },
        email: { 
            type: DataTypes.STRING(100), 
            unique: true
        },
        password_hash: { 
            type: DataTypes.STRING(255), 
            allowNull: false
        },
        first_name: { 
            type: DataTypes.STRING(50), 
            allowNull: true
        },
        last_name: { 
            type: DataTypes.STRING(50), 
            allowNull: true
        },
        full_name: { 
            type: DataTypes.STRING(50), 
            allowNull: true
        },
        date_of_birth: { 
            type: DataTypes.DATEONLY
        },
        gender: DataTypes.STRING(20),
        phone: DataTypes.STRING(20),
        address: DataTypes.STRING(255),
        avatar_url: DataTypes.STRING(255),
        is_active: {
            type: DataTypes.BOOLEAN, 
            defaultValue: true
        },
        is_deleted: {
            type: DataTypes.BOOLEAN, 
            defaultValue: false
        },
        last_login_at: DataTypes.DATE,
        password_changed_at: DataTypes.DATE,
        deleted_at: DataTypes.DATE
    }, {
        tableName: 'Users',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                unique: true,
                fields: ['username'],
                name: 'uq_users_username'
            },
            {
                unique: true,
                fields: ['email'],
                name: 'uq_users_email'
            },
            {
                fields: ['is_active', 'is_deleted'],
                name: 'idx_users_status'
            },
            {
                fields: ['last_name', 'first_name'],
                name: 'idx_users_name'
            }
        ]
    });
    Users.associate = (models) => {
        Users.hasOne(models.UserRoles, {
            foreignKey: 'user_id',
            as: 'user_role',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });
        Users.hasMany(models.UserRoles, {
            foreignKey: 'assigned_by',
            as: 'assigned_roles',
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE'
        });
        Users.hasOne(models.Admins, {
            foreignKey: 'user_id',
            as: 'Admin',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });
        Users.hasOne(models.Assistants, {
            foreignKey: 'user_id',
            as: 'Assistant',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });
        Users.hasOne(models.Lecturers, {
            foreignKey: 'user_id',
            as: 'Lecturer',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });
        Users.hasOne(models.Students, {
            foreignKey: 'user_id',
            as: 'Student',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });
        Users.hasMany(models.UserTokens, {
            foreignKey: 'user_id',
            as: 'tokens',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });
        Users.hasMany(models.Attendance, {
            foreignKey: 'recorded_by',
            as: 'attendance',
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE'
        });
        Users.hasMany(models.Grades, {
            foreignKey: 'graded_by',
            as: 'grades',
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE'
        });
    };
    return Users;
};