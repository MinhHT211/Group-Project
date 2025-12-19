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
    const lecturers = [];
    const deptMapping = [1,1,1,1,1,1,1,1,1,1, 2,2,2,2, 3,3, 4,4, 5,5];
    const ranks = ['Lecturer', 'Senior Lecturer', 'Associate Professor', 'Professor'];
    const degrees = ['Master', 'PhD', 'PhD'];
    
    for (let i = 0; i < 20; i++) {
      lecturers.push({
        user_id: 7 + i,
        lecturer_code: `LEC${String(i + 1).padStart(3, '0')}`,
        department_id: deptMapping[i],
        academic_rank: ranks[i % ranks.length],
        degree: degrees[i % degrees.length],
        office_room: `${String.fromCharCode(65 + deptMapping[i] - 1)}${201 + i}`,
        office_hours: 'T2,T4: 14h-16h',
        bio: `Experienced ${ranks[i % ranks.length]} with ${degrees[i % degrees.length]} degree`,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      });
    }
    
    await queryInterface.bulkInsert('Lecturers', lecturers, {});
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('Lecturers', null, {});
  }
};
