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
    const userRoles = [];
    
    // Admin (user_id: 1)
    userRoles.push({ user_id: 1, role_id: 1, assigned_by: null, is_active: true, created_at: new Date(), updated_at: new Date() });
    
    // Assistants (user_id: 2-6)
    for (let i = 2; i <= 6; i++) {
      userRoles.push({ user_id: i, role_id: 2, assigned_by: 1, is_active: true, created_at: new Date(), updated_at: new Date() });
    }
    
    // Lecturers (user_id: 7-26)
    for (let i = 7; i <= 26; i++) {
      userRoles.push({ user_id: i, role_id: 3, assigned_by: 1, is_active: true, created_at: new Date(), updated_at: new Date() });
    }
    
    // Students (user_id: 27-126)
    for (let i = 27; i <= 126; i++) {
      userRoles.push({ user_id: i, role_id: 4, assigned_by: 1, is_active: true, created_at: new Date(), updated_at: new Date() });
    }
    
    await queryInterface.bulkInsert('UserRoles', userRoles, {});
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('UserRoles', null, {});
  }
};
