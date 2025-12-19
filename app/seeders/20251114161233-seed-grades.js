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
      `SELECT e.enrollment_id, e.class_id, c.lecturer_id 
       FROM Enrollment e
       JOIN Classes c ON e.class_id = c.class_id;`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const components = await queryInterface.sequelize.query(
      `SELECT component_id, class_id FROM GradeComponents;`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (enrollments.length === 0 || components.length === 0) {
      console.log('⚠️ Không có dữ liệu Enrollment hoặc GradeComponents. Bỏ qua seed Grades.');
      return;
    }

    const grades = [];
    
    for (const enrollment of enrollments) {
      const classComponents = components.filter(comp => comp.class_id === enrollment.class_id);

      let targetComponents = classComponents;
      
      if (targetComponents.length === 0) {
        const baseComponentId = (enrollment.class_id - 1) * 4 + 1;
        targetComponents = [
            { component_id: baseComponentId },
            { component_id: baseComponentId + 1 },
            { component_id: baseComponentId + 2 },
            { component_id: baseComponentId + 3 }
        ];
      }

      for (const comp of targetComponents) {
        const hasScore = Math.random() < 0.9;
        const scoreVal = hasScore ? (Math.random() * 4 + 6).toFixed(2) : null;
        
        let feedback = null;
        if (scoreVal) {
            const numScore = parseFloat(scoreVal);
            if (numScore >= 8.5) feedback = 'Excellent!';
            else if (numScore >= 7.0) feedback = 'Good job.';
            else if (numScore < 5.0) feedback = 'Need to try harder.';
        }

        grades.push({
          enrollment_id: enrollment.enrollment_id,
          component_id: comp.component_id,
          score: scoreVal,
          graded_by: enrollment.lecturer_id,
          graded_at: scoreVal ? new Date() : null,
          feedback: feedback,
          attachment_url: null, // Thêm trường mới từ schema
          created_at: new Date(),
          updated_at: new Date()
        });
      }
    }
    
    if (grades.length > 0) {
        await queryInterface.bulkInsert('Grades', grades, {});
    }
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('Grades', null, {});
  }
};
