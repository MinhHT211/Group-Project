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
    await queryInterface.bulkInsert('Assistants', [
      { user_id: 2, assistant_code: 'AST001', department_id: 1, office_room: 'A101', office_hours: 'T2-T6: 8h-17h', is_active: true, created_at: new Date(), updated_at: new Date() },
      { user_id: 3, assistant_code: 'AST002', department_id: 2, office_room: 'B101', office_hours: 'T2-T6: 8h-17h', is_active: true, created_at: new Date(), updated_at: new Date() },
      { user_id: 4, assistant_code: 'AST003', department_id: 3, office_room: 'C101', office_hours: 'T2-T6: 8h-17h', is_active: true, created_at: new Date(), updated_at: new Date() },
      { user_id: 5, assistant_code: 'AST004', department_id: 4, office_room: 'D101', office_hours: 'T2-T6: 8h-17h', is_active: true, created_at: new Date(), updated_at: new Date() },
      { user_id: 6, assistant_code: 'AST005', department_id: 5, office_room: 'E101', office_hours: 'T2-T6: 8h-17h', is_active: true, created_at: new Date(), updated_at: new Date() }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('Assistants', null, {});
  }
};
