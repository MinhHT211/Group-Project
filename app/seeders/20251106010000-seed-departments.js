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
    await queryInterface.bulkInsert('Departments', [
      {
        department_id: 1,
        department_code: 'IT',
        department_name: 'Công nghệ thông tin',
        description: 'Khoa Công nghệ thông tin',
        phone: '024-1234-5601',
        email: 'it@university.edu.vn',
        location: 'Tòa A',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        department_id: 2,
        department_code: 'MATH',
        department_name: 'Toán học',
        description: 'Khoa Toán học',
        phone: '024-1234-5602',
        email: 'math@university.edu.vn',
        location: 'Tòa B',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        department_id: 3,
        department_code: 'PHY',
        department_name: 'Vật lý',
        description: 'Khoa Vật lý',
        phone: '024-1234-5603',
        email: 'phy@university.edu.vn',
        location: 'Tòa C',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        department_id: 4,
        department_code: 'CHEM',
        department_name: 'Hóa học',
        description: 'Khoa Hóa học',
        phone: '024-1234-5604',
        email: 'chem@university.edu.vn',
        location: 'Tòa D',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        department_id: 5,
        department_code: 'ENG',
        department_name: 'Ngoại ngữ',
        description: 'Khoa Ngoại ngữ',
        phone: '024-1234-5605',
        email: 'eng@university.edu.vn',
        location: 'Tòa E',
        is_active: true,
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
    await queryInterface.bulkDelete('Departments', null, {});
  }
};
