'use strict';
module.exports = (sequelize, DataTypes) => {
    const Semesters = sequelize.define('Semesters', {
        semester_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        semester_code: {
            type: DataTypes.STRING(20),
            allowNull: false,
            unique: true,
        },
        semester_name: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        academic_year: {
            type: DataTypes.STRING(10),
            allowNull: false,
        },
        enrollment_date: {
            type: DataTypes.DATE,
            allowNull: false
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
    }, {
        tableName: 'Semesters',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                fields: ['semester_code'],
                name: 'uq_semesters_code',
                unique: true,
            },
            {
                fields: ['is_active'],
                name: 'idx_semesters_active'
            },   
        ]
    });
    Semesters.associate = (models) => {
        Semesters.hasMany(models.Classes, {
            foreignKey: 'semester_id',
            as: 'classes',
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE'
        })
    };
    return Semesters;
}