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
   await queryInterface.bulkInsert('Courses', [
      // IT Courses (15 courses)
      { course_id: 1, course_code: 'IT101', course_name: 'Lập trình căn bản', department_id: 1, credits: 3, theory_hours: 30, practice_hours: 30, course_type: 'mandatory', level: 'beginner', description: 'Nhập môn lập trình', is_active: true, created_at: new Date(), updated_at: new Date() },
      { course_id: 2, course_code: 'IT102', course_name: 'Cấu trúc dữ liệu', department_id: 1, credits: 3, theory_hours: 30, practice_hours: 30, course_type: 'mandatory', level: 'intermediate', description: 'Data structures and algorithms', is_active: true, created_at: new Date(), updated_at: new Date() },
      { course_id: 3, course_code: 'IT103', course_name: 'Cơ sở dữ liệu', department_id: 1, credits: 3, theory_hours: 30, practice_hours: 30, course_type: 'mandatory', level: 'intermediate', description: 'Database fundamentals', is_active: true, created_at: new Date(), updated_at: new Date() },
      { course_id: 4, course_code: 'IT201', course_name: 'Lập trình hướng đối tượng', department_id: 1, credits: 3, theory_hours: 30, practice_hours: 30, course_type: 'mandatory', level: 'intermediate', description: 'OOP with Java', is_active: true, created_at: new Date(), updated_at: new Date() },
      { course_id: 5, course_code: 'IT202', course_name: 'Phát triển Web', department_id: 1, credits: 3, theory_hours: 30, practice_hours: 30, course_type: 'mandatory', level: 'intermediate', description: 'Web development', is_active: true, created_at: new Date(), updated_at: new Date() },
      { course_id: 6, course_code: 'IT203', course_name: 'Mạng máy tính', department_id: 1, credits: 3, theory_hours: 30, practice_hours: 30, course_type: 'mandatory', level: 'intermediate', description: 'Computer networks', is_active: true, created_at: new Date(), updated_at: new Date() },
      { course_id: 7, course_code: 'IT301', course_name: 'Trí tuệ nhân tạo', department_id: 1, credits: 3, theory_hours: 30, practice_hours: 30, course_type: 'elective', level: 'advanced', description: 'Artificial Intelligence', is_active: true, created_at: new Date(), updated_at: new Date() },
      { course_id: 8, course_code: 'IT302', course_name: 'Machine Learning', department_id: 1, credits: 3, theory_hours: 30, practice_hours: 30, course_type: 'elective', level: 'advanced', description: 'Machine Learning fundamentals', is_active: true, created_at: new Date(), updated_at: new Date() },
      { course_id: 9, course_code: 'IT303', course_name: 'Cloud Computing', department_id: 1, credits: 3, theory_hours: 30, practice_hours: 30, course_type: 'elective', level: 'advanced', description: 'Cloud technologies', is_active: true, created_at: new Date(), updated_at: new Date() },
      { course_id: 10, course_code: 'IT304', course_name: 'Blockchain', department_id: 1, credits: 3, theory_hours: 30, practice_hours: 30, course_type: 'elective', level: 'advanced', description: 'Blockchain technology', is_active: true, created_at: new Date(), updated_at: new Date() },
      
      // Math Courses (5 courses)
      { course_id: 11, course_code: 'MATH101', course_name: 'Toán cao cấp 1', department_id: 2, credits: 4, theory_hours: 45, practice_hours: 15, course_type: 'mandatory', level: 'beginner', description: 'Advanced Mathematics 1', is_active: true, created_at: new Date(), updated_at: new Date() },
      { course_id: 12, course_code: 'MATH102', course_name: 'Toán cao cấp 2', department_id: 2, credits: 4, theory_hours: 45, practice_hours: 15, course_type: 'mandatory', level: 'intermediate', description: 'Advanced Mathematics 2', is_active: true, created_at: new Date(), updated_at: new Date() },
      { course_id: 13, course_code: 'MATH201', course_name: 'Đại số tuyến tính', department_id: 2, credits: 3, theory_hours: 45, practice_hours: 0, course_type: 'mandatory', level: 'intermediate', description: 'Linear Algebra', is_active: true, created_at: new Date(), updated_at: new Date() },
      { course_id: 14, course_code: 'MATH202', course_name: 'Xác suất thống kê', department_id: 2, credits: 3, theory_hours: 45, practice_hours: 0, course_type: 'mandatory', level: 'intermediate', description: 'Probability and Statistics', is_active: true, created_at: new Date(), updated_at: new Date() },
      { course_id: 15, course_code: 'MATH301', course_name: 'Toán rời rạc', department_id: 2, credits: 3, theory_hours: 45, practice_hours: 0, course_type: 'elective', level: 'advanced', description: 'Discrete Mathematics', is_active: true, created_at: new Date(), updated_at: new Date() },
      
      // Physics Courses (3 courses)
      { course_id: 16, course_code: 'PHY101', course_name: 'Vật lý đại cương 1', department_id: 3, credits: 3, theory_hours: 30, practice_hours: 30, course_type: 'general', level: 'beginner', description: 'General Physics 1', is_active: true, created_at: new Date(), updated_at: new Date() },
      { course_id: 17, course_code: 'PHY102', course_name: 'Vật lý đại cương 2', department_id: 3, credits: 3, theory_hours: 30, practice_hours: 30, course_type: 'general', level: 'beginner', description: 'General Physics 2', is_active: true, created_at: new Date(), updated_at: new Date() },
      { course_id: 18, course_code: 'PHY201', course_name: 'Điện từ học', department_id: 3, credits: 3, theory_hours: 45, practice_hours: 15, course_type: 'mandatory', level: 'intermediate', description: 'Electromagnetism', is_active: true, created_at: new Date(), updated_at: new Date() },
      
      // Chemistry Courses (2 courses)
      { course_id: 19, course_code: 'CHEM101', course_name: 'Hóa học đại cương', department_id: 4, credits: 3, theory_hours: 30, practice_hours: 30, course_type: 'general', level: 'beginner', description: 'General Chemistry', is_active: true, created_at: new Date(), updated_at: new Date() },
      { course_id: 20, course_code: 'CHEM201', course_name: 'Hóa học hữu cơ', department_id: 4, credits: 3, theory_hours: 30, practice_hours: 30, course_type: 'mandatory', level: 'intermediate', description: 'Organic Chemistry', is_active: true, created_at: new Date(), updated_at: new Date() },
      
      // English Courses (3 courses)
      { course_id: 21, course_code: 'ENG101', course_name: 'Tiếng Anh 1', department_id: 5, credits: 3, theory_hours: 30, practice_hours: 30, course_type: 'general', level: 'beginner', description: 'English 1', is_active: true, created_at: new Date(), updated_at: new Date() },
      { course_id: 22, course_code: 'ENG102', course_name: 'Tiếng Anh 2', department_id: 5, credits: 3, theory_hours: 30, practice_hours: 30, course_type: 'general', level: 'beginner', description: 'English 2', is_active: true, created_at: new Date(), updated_at: new Date() },
      { course_id: 23, course_code: 'ENG201', course_name: 'Tiếng Anh chuyên ngành', department_id: 5, credits: 3, theory_hours: 30, practice_hours: 30, course_type: 'mandatory', level: 'intermediate', description: 'Technical English', is_active: true, created_at: new Date(), updated_at: new Date() }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('Courses', null, {});  
  }
};
