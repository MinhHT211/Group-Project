'use strict';
module.exports = (sequelize, DataTypes) => {
    const Students = sequelize.define('Students', {
        user_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
        },
        student_code: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
        },
        major_id: {
            type: DataTypes.INTEGER,
            allowNull:false,
        },
        admission_year: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        expected_graduation_year: {
            type: DataTypes.INTEGER,
        },
        student_status: {
            type: DataTypes.STRING(20),
            defaultValue: 'active'
        },
        academic_advisor_id: { 
            type: DataTypes.INTEGER
        },
    }, {
        tableName: 'Students',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                unique: true,
                fields: ['student_code'],
                name: 'uq_students_code'
            },{
                fields: ['major_id'],
                name: 'idx_students_major',
            },{
                fields: ['admission_year'],
                name: 'idx_students_admission',
            },{
                fields: ['student_status'],
                name: 'idx_students_status',
            },{
                fields: ['academic_advisor_id'],
                name: 'idx_students_advisor',
            }
        ]
    });
    Students.associate = (models) => {
        Students.belongsTo(models.Users, {
            foreignKey: 'user_id',
            as: 'user',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });
        Students.belongsTo(models.Lecturers, {
            foreignKey: 'academic_advisor_id',
            as: 'lecturer',
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE'
        });
        Students.belongsTo(models.Majors, {
            foreignKey: 'major_id',
            as: 'major',
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE'
        });
        Students.hasMany(models.Enrollment, {
            foreignKey: 'student_id',
            as: 'enrollment',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });
        Students.hasMany(models.Attendance, {
            foreignKey: 'student_id',
            as: 'attendance',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        })
    };
    return Students;
}