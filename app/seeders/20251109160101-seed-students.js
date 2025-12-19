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
    const students = [];
    
    for (let i = 0; i < 100; i++) {
      const year = 2021 + (i % 4);
      const majorId = (i % 9) + 1;
      const advisorId = 7 + (i % 20);
      
      students.push({
        user_id: 27 + i,
        student_code: `${year}${String(i + 1).padStart(4, '0')}`,
        major_id: majorId,
        admission_year: year,
        expected_graduation_year: year + 4,
        student_status: i < 90 ? 'active' : (i < 95 ? 'suspended' : 'graduated'),
        academic_advisor_id: advisorId,
        created_at: new Date(),
        updated_at: new Date()
      });
    }
    
    await queryInterface.bulkInsert('Students', students, {});
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('Students', null, {});
  }
};
