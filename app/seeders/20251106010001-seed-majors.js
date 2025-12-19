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
   await queryInterface.bulkInsert('Majors', [
      // IT Majors
      { major_id: 1, major_code: 'SE', major_name: 'Công nghệ phần mềm', department_id: 1, degree_type: 'Bachelor', required_credits: 120, duration_years: 4, is_active: true, created_at: new Date(), updated_at: new Date() },
      { major_id: 2, major_code: 'AI', major_name: 'Trí tuệ nhân tạo', department_id: 1, degree_type: 'Bachelor', required_credits: 120, duration_years: 4, is_active: true, created_at: new Date(), updated_at: new Date() },
      { major_id: 3, major_code: 'IS', major_name: 'Hệ thống thông tin', department_id: 1, degree_type: 'Bachelor', required_credits: 120, duration_years: 4, is_active: true, created_at: new Date(), updated_at: new Date() },
      { major_id: 4, major_code: 'CS', major_name: 'Khoa học máy tính', department_id: 1, degree_type: 'Bachelor', required_credits: 120, duration_years: 4, is_active: true, created_at: new Date(), updated_at: new Date() },
      
      // Math Majors
      { major_id: 5, major_code: 'MATH', major_name: 'Toán học', department_id: 2, degree_type: 'Bachelor', required_credits: 120, duration_years: 4, is_active: true, created_at: new Date(), updated_at: new Date() },
      { major_id: 6, major_code: 'STAT', major_name: 'Thống kê', department_id: 2, degree_type: 'Bachelor', required_credits: 120, duration_years: 4, is_active: true, created_at: new Date(), updated_at: new Date() },
      
      // Other Majors
      { major_id: 7, major_code: 'PHY', major_name: 'Vật lý', department_id: 3, degree_type: 'Bachelor', required_credits: 120, duration_years: 4, is_active: true, created_at: new Date(), updated_at: new Date() },
      { major_id: 8, major_code: 'CHEM', major_name: 'Hóa học', department_id: 4, degree_type: 'Bachelor', required_credits: 120, duration_years: 4, is_active: true, created_at: new Date(), updated_at: new Date() },
      { major_id: 9, major_code: 'ENG', major_name: 'Ngôn ngữ Anh', department_id: 5, degree_type: 'Bachelor', required_credits: 120, duration_years: 4, is_active: true, created_at: new Date(), updated_at: new Date() }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
      await queryInterface.bulkDelete('Majors', null, {});
    
  }
};
