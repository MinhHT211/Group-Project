'use strict';
module.exports = (sequelize, DataTypes) => {
    const Majors = sequelize.define('Majors', {
        major_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        major_code: {
            type: DataTypes.STRING(20),
            allowNull: false,
            unique: true,
        },
        major_name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        department_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        degree_type: {
            type: DataTypes.STRING(50),
        },
        required_credits: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 120
        },
        duration_years: {
            type: DataTypes.INTEGER,
            defaultValue: 4,
        },
        description: {
            type: DataTypes.TEXT
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        }
    }, {
        tableName: 'Majors',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                fields: ['major_code'],
                unique: true,
                name: 'uq_majors_code'
            },{
                fields: ['department_id', 'is_active'],
                name: 'idx_majors_dept_active'
            }
        ]
    });
    Majors.associate = (models) => {
        Majors.hasMany(models.Students, {
            foreignKey: 'major_id',
            as: 'students',
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE'
        });
        Majors.belongsTo(models.Departments, {
            foreignKey: 'department_id',
            as: 'department',
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE'
        })
    }
    return Majors;
}