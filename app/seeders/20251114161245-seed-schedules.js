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
   const schedules = [];
    
    const rooms = ['A101', 'A102', 'A103', 'A201', 'A202', 'B101', 'B102', 'B201', 'C101', 'C102'];
    const buildings = ['Building A', 'Building B', 'Building C'];
    const timeSlots = [
      { start: '07:00:00', end: '08:50:00' },
      { start: '09:00:00', end: '10:50:00' },
      { start: '13:00:00', end: '14:50:00' },
      { start: '15:00:00', end: '16:50:00' }
    ];
    
    // Lấy thông tin lecturer_id từ Classes
    const classes = await queryInterface.sequelize.query(
      `SELECT class_id, lecturer_id FROM Classes LIMIT 30;`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    
    // Create schedules for each class (30 classes)
    for (let i = 0; i < classes.length; i++) {
      const classData = classes[i];
      const classId = classData.class_id;
      const lecturerId = classData.lecturer_id;
      
      // Each class has 2 sessions per week
      const days = [
        [1, 4], // Monday + Thursday
        [2, 5], // Tuesday + Friday
        [3, 6]  // Wednesday + Saturday
      ];
      
      const dayPair = days[i % 3];
      const timeSlot = timeSlots[i % 4];
      const room = rooms[i % 10];
      const building = buildings[Math.floor((i % 10) / 4)];
      
      dayPair.forEach(day => {
        schedules.push({
          class_id: classId,
          lecturer_id: lecturerId, // THÊM MỚI theo schema
          day_of_week: day,
          start_time: timeSlot.start,
          end_time: timeSlot.end,
          effective_from: new Date('2024-09-01'),
          effective_to: new Date('2024-12-20'),
          room: room,
          building: building,
          campus: 'Main Campus',
          schedule_type: 'lecture',
          is_active: true,
          is_online: i % 5 === 0,
          online_meeting_url: i % 5 === 0 ? `https://meet.university.edu/class-${classId}` : null,
          created_at: new Date(),
          updated_at: new Date()
        });
      });
    }
    
    await queryInterface.bulkInsert('Schedules', schedules, {});
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('Schedules', null, {});
  }
};
