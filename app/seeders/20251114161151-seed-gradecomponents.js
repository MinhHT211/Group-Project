'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */
   const gradeComponents = [];
    let componentId = 1;
    
    // Create grade components for each class (classes 1-30)
    for (let classId = 1; classId <= 30; classId++) {
      // Standard grade structure: Attendance (10%), Assignments (20%), Midterm (30%), Final (40%)
      gradeComponents.push(
        {
          component_id: componentId++,
          class_id: classId,
          component_name: 'Chuyên cần',
          component_type: 'attendance',
          weight: 0.10,
          max_score: 20,
          order_index: 1,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          component_id: componentId++,
          class_id: classId,
          component_name: 'Assignment',
          component_type: 'assignment',
          weight: 0.20,
          max_score: 20,
          due_date: new Date('2024-11-15'),
          order_index: 2,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          component_id: componentId++,
          class_id: classId,
          component_name: 'Mini test',
          component_type: 'mini_test',
          weight: 0.0,
          max_score: 20,
          due_date: new Date('2024-11-15'),
          order_index: 2,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          component_id: componentId++,
          class_id: classId,
          component_name: 'Lab work',
          component_type: 'lab_work',
          weight: 0.0,
          max_score: 20,
          due_date: new Date('2024-11-15'),
          order_index: 2,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          component_id: componentId++,
          class_id: classId,
          component_name: 'Giữa kỳ',
          component_type: 'exam_midterm',
          weight: 0.30,
          max_score: 20,
          exam_date: new Date('2024-11-01'),
          order_index: 3,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          component_id: componentId++,
          class_id: classId,
          component_name: 'Cuối kỳ',
          component_type: 'exam_final',
          weight: 0.40,
          max_score: 20,
          exam_date: new Date('2024-12-20'),
          order_index: 4,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      );
    }
    
    await queryInterface.bulkInsert('GradeComponents', gradeComponents, {});
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('GradeComponents', null, {});
  }
};
