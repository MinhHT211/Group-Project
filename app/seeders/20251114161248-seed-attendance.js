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
    const enrollments = await queryInterface.sequelize.query(
      `SELECT enrollment_id, student_id, class_id FROM Enrollment WHERE enrollment_status = 'enrolled'`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Gom nhóm Enrollments theo Class ID
    const enrollmentsByClass = {};
    enrollments.forEach(enrollment => {
      if (!enrollmentsByClass[enrollment.class_id]) {
        enrollmentsByClass[enrollment.class_id] = [];
      }
      enrollmentsByClass[enrollment.class_id].push(enrollment);
    });

    // 2. Lấy danh sách Lịch học (Schedules) THỰC TẾ từ DB
    // Để đảm bảo không bị lỗi Foreign Key
    const schedules = await queryInterface.sequelize.query(
      `SELECT schedule_id, class_id FROM Schedules`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Gom nhóm Schedules theo Class ID
    const schedulesByClass = {};
    schedules.forEach(schedule => {
      if (!schedulesByClass[schedule.class_id]) {
        schedulesByClass[schedule.class_id] = [];
      }
      schedulesByClass[schedule.class_id].push(schedule.schedule_id);
    });

    const attendances = [];

    // ==================================================
    // CẤU HÌNH SỐ LƯỢNG DỮ LIỆU MUỐN TẠO (CHỈNH Ở ĐÂY)
    // ==================================================
    const MAX_CLASSES_TO_SEED = 2; // Chỉ tạo dữ liệu cho 2 lớp thôi
    const NUM_SESSIONS = 2;        // Mỗi lớp chỉ tạo 2 buổi điểm danh
    // ==================================================

    let classesProcessedCount = 0;

    // Duyệt qua các lớp có sinh viên
    for (const classIdStr in enrollmentsByClass) {
      // Nếu đã tạo đủ số lượng lớp mong muốn thì dừng lại ngay
      if (classesProcessedCount >= MAX_CLASSES_TO_SEED) {
        break;
      }

      const classId = parseInt(classIdStr);
      const classEnrollments = enrollmentsByClass[classId];
      
      // Lấy lịch học thực tế của lớp này
      const classSchedules = schedulesByClass[classId] || [];

      // Nếu lớp này không có lịch học trong bảng Schedules -> Bỏ qua
      if (classSchedules.length === 0) {
        continue; 
      }

      // Đánh dấu là đã xử lý thành công 1 lớp
      classesProcessedCount++;

      // Tạo dữ liệu các buổi học
      for (let session = 0; session < NUM_SESSIONS; session++) {
        const attendanceDate = new Date('2024-09-01');
        attendanceDate.setDate(attendanceDate.getDate() + session * 7); // Mỗi buổi cách nhau 1 tuần

        // Lấy schedule_id hợp lệ từ mảng đã query (xoay vòng nếu ít lịch)
        const scheduleId = classSchedules[session % classSchedules.length];

        classEnrollments.forEach(enrollment => {
          // Logic random trạng thái
          let status = 'present';
          const rand = Math.random();
          
          // Giảm tỷ lệ vắng/trễ xuống để data nhìn "đẹp" hơn
          if (rand > 0.90) status = 'late';       // 10% đi muộn
          else if (rand > 0.85) status = 'absent'; // 5% vắng

          attendances.push({
            class_id: classId,
            student_id: enrollment.student_id,
            schedule_id: scheduleId,
            attendance_date: attendanceDate,
            session_number: session + 1,
            status: status,
            check_in_time: status !== 'absent' 
              ? new Date(attendanceDate.getTime() + Math.random() * 1800000) // Random trong vòng 30p
              : null,
            notes: status === 'absent' ? 'Vắng không phép' : null,
            recorded_by: 1, // Giả sử Admin ID 1 ghi nhận
            recorded_at: new Date(),
            updated_at: new Date(),
            created_at: new Date()
          });
        });
      }
    }

    console.log(`Created attendance records for ${classesProcessedCount} classes.`);

    if (attendances.length > 0) {
      await queryInterface.bulkInsert('Attendance', attendances, {});
    }
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('Attendance', null, {});
  }
};
