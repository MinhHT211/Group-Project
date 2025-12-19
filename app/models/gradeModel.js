'use strict';
module.exports = (sequelize, DataTypes) => {
    const Grades = sequelize.define('Grades', {
        grade_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        enrollment_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        component_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        score: {
            type: DataTypes.DECIMAL(4, 2)
        },
        graded_by: DataTypes.INTEGER,

        graded_at: {
            type: DataTypes.DATE
        },
        
        feedback: {
            type: DataTypes.TEXT,
        },
        attachment_url: {
            type: DataTypes.STRING(255),
        },

        is_excused: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
        tableName: 'Grades',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                fields: ['enrollment_id', 'component_id'],
                name: ['uq_grades_enrollment_component'],
                unique: true,
            },
            {
                fields: ['enrollment_id'],
                name: 'idx_grades_enrollment',
            },
            {
                fields: ['component_id'],
                name: 'idx_grades_component',
            },
            {
                fields: ['graded_by'],
                name: 'idx_grades_graded_by',
            }
        ]
    });
    Grades.associate = (models) => {
        Grades.belongsTo(models.Enrollment, {
            foreignKey: 'enrollment_id',
            as: 'enrollment',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });
        Grades.belongsTo(models.GradeComponents, {
            foreignKey: 'component_id',
            as: 'grade_component',
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE'
        });
        Grades.belongsTo(models.Users, {
            foreignKey: 'graded_by',
            as: 'user',
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE'
        });
    }
    return Grades;
}