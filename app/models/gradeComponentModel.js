'use strict';
module.exports = (sequelize, DataTypes) => {
    const GradeComponents = sequelize.define('GradeComponents', {
        component_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        class_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        component_name: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        component_type: {
            type: DataTypes.STRING(20),
            allowNull: false
        },

        weight: {
            type: DataTypes.DECIMAL(4, 2),
            allowNull: false
        },
        max_score: {
            type: DataTypes.DECIMAL(4, 2),
            allowNull: false,
            defaultValue: 20
        },

        due_date: {
            type: DataTypes.DATE
        },
        exam_date: {
            type: DataTypes.DATE
        },
        order_index: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },

        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    }, {
        tableName: 'GradeComponents',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                fields: ['class_id', 'order_index'],
                name: 'idx_gc_class_order',
            },
            {
                fields: ['class_id', 'component_type'],
                name: 'idx_gc_class_type',
            }
        ]
    });
    GradeComponents.associate = (models) => {
        GradeComponents.belongsTo(models.Classes, {
            foreignKey: 'class_id',
            as: 'classe',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });
        GradeComponents.hasMany(models.Grades, {
            foreignKey: 'component_id',
            as: 'grades',
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE'
        });
    }
    return GradeComponents;
}