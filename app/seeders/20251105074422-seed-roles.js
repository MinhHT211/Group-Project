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
    await queryInterface.bulkInsert('Roles', [
      {
        role_id: 1,
        role_name: 'admin',
        role_description: 'System Administrator - Full access to all features',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        role_id: 2,
        role_name: 'assistant',
        role_description: 'Department Assistant - Manage department-specific data',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        role_id: 3,
        role_name: 'lecturer',
        role_description: 'Lecturer - Teach classes and grade students',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        role_id: 4,
        role_name: 'student',
        role_description: 'Student - Attend classes and view personal information',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ])
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('Roles', null, {});
  }
};
