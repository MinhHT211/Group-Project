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
   await queryInterface.bulkInsert('Semesters', [
      {
        semester_id: 1,
        semester_code: '2023_FALL',
        semester_name: 'Fall 2023',
        academic_year: '2023-2024',
        enrollment_date: new Date('2023-08-15'),
        is_active: false,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        semester_id: 2,
        semester_code: '2024_SPRING',
        semester_name: 'Spring 2024',
        academic_year: '2023-2024',
        enrollment_date: new Date('2024-01-15'),
        is_active: false,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        semester_id: 3,
        semester_code: '2024_FALL',
        semester_name: 'Fall 2024',
        academic_year: '2024-2025',
        enrollment_date: new Date('2024-08-15'),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        semester_id: 4,
        semester_code: '2025_SPRING',
        semester_name: 'Spring 2025',
        academic_year: '2024-2025',
        enrollment_date: new Date('2025-01-15'),
        is_active: false,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('Semesters', null, {});
  }
};
