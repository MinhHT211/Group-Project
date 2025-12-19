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
   const enrollments = [];
    
    // Enroll 100 students into random classes (each student enrolls in 4-6 classes)
    for (let studentId = 27; studentId <= 126; studentId++) {
      const numClasses = Math.floor(Math.random() * 3) + 4; // 4-6 classes
      const enrolledClasses = new Set();
      
      while (enrolledClasses.size < numClasses) {
        const classId = Math.floor(Math.random() * 30) + 1; // Classes 1-30
        
        if (!enrolledClasses.has(classId)) {
          enrolledClasses.add(classId);
          
          // Các điểm thành phần
          const miniTest = Math.random() < 0.9 ? (Math.random() * 4 + 6).toFixed(2) : null;
          const assignment = Math.random() < 0.9 ? (Math.random() * 4 + 6).toFixed(2) : null;
          const labWork = Math.random() < 0.85 ? (Math.random() * 4 + 6).toFixed(2) : null;
          const midtermGrade = Math.random() < 0.9 ? (Math.random() * 4 + 6).toFixed(2) : null;
          const finalGrade = Math.random() < 0.85 ? (Math.random() * 4 + 6).toFixed(2) : null;
          
          // Tính điểm tổng (nếu có đủ điểm)
          let totalGrade = null;
          if (midtermGrade && finalGrade) {
            totalGrade = ((parseFloat(midtermGrade) * 0.4 + parseFloat(finalGrade) * 0.6)).toFixed(2);
          }
          
          const isPassed = totalGrade ? parseFloat(totalGrade) >= 5.0 : null;
          
          // Letter grade conversion
          let letterGrade = null;
          let gpaValue = null;
          if (totalGrade) {
            const grade = parseFloat(totalGrade);
            if (grade >= 9.0) { letterGrade = 'A+'; gpaValue = 4.0; }
            else if (grade >= 8.5) { letterGrade = 'A'; gpaValue = 3.7; }
            else if (grade >= 8.0) { letterGrade = 'B+'; gpaValue = 3.3; }
            else if (grade >= 7.0) { letterGrade = 'B'; gpaValue = 3.0; }
            else if (grade >= 6.5) { letterGrade = 'C+'; gpaValue = 2.7; }
            else if (grade >= 5.5) { letterGrade = 'C'; gpaValue = 2.3; }
            else if (grade >= 5.0) { letterGrade = 'D+'; gpaValue = 2.0; }
            else if (grade >= 4.0) { letterGrade = 'D'; gpaValue = 1.5; }
            else { letterGrade = 'F'; gpaValue = 0.0; }
          }
          
          const totalSessions = 45;
          const attendedSessions = Math.floor(Math.random() * 10) + 35; // 35-45
          const attendanceRate = ((attendedSessions / totalSessions) * 100).toFixed(2);
          
          enrollments.push({
            student_id: studentId,
            class_id: classId,
            enrollment_status: 'enrolled',
            enrollment_type: 'regular',
            enrollment_date: new Date('2024-08-15'),
            
            // Các điểm thành phần mới theo schema
            mini_test_grade: miniTest,
            assignment_grade: assignment,
            lab_work_grade: labWork,
            midterm_grade: midtermGrade,
            final_grade: finalGrade,
            total_grade: totalGrade,
            letter_grade: letterGrade,
            gpa_value: gpaValue,
            is_passed: isPassed,
            
            // Attendance
            total_sessions: totalSessions,
            attended_sessions: attendedSessions,
            attendance_rate: attendanceRate,
            
            created_at: new Date(),
            updated_at: new Date()
          });
        }
      }
    }
    
    await queryInterface.bulkInsert('Enrollment', enrollments, {});
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('Enrollment', null, {});
  }
};
