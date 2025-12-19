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
   const classes = [];
    const semestersData = [
        { 
            id: 1,
            semCode: 'F23',
            startDate: '2023-09-01',
            endDate: '2023-12-20',
            status: 'completed',
            courses: [
                { id: 1, code: 'IT101' }, { id: 2, code: 'IT102' }, 
                { id: 11, code: 'MATH101' }, { id: 16, code: 'PHY101' }, 
                { id: 19, code: 'CHEM101' }, { id: 21, code: 'ENG101' }
            ],
            numClasses: 2
        },
        { 
            id: 2,
            semCode: 'S24',
            startDate: '2024-01-15',
            endDate: '2024-05-20',
            status: 'completed',
            courses: [
                { id: 3, code: 'IT103' }, { id: 4, code: 'IT201' }, 
                { id: 12, code: 'MATH102' }, { id: 17, code: 'PHY102' }, 
                { id: 22, code: 'ENG102' }
            ],
            numClasses: 2
        },
        { 
            id: 3,
            semCode: 'F24',
            startDate: '2024-08-15',
            endDate: '2024-12-20',
            status: 'in_progress', 
            courses: [
                { id: 5, code: 'IT202' }, { id: 6, code: 'IT203' }, 
                { id: 13, code: 'MATH201' }, { id: 18, code: 'PHY201' }, 
                { id: 20, code: 'CHEM201' }, { id: 23, code: 'ENG201' }
            ],
            numClasses: 2
        },
        {
            id: 4,
            semCode: 'S25',
            startDate: '2025-01-15',
            endDate: '2025-05-20',
            status: 'planned', 
            courses: [
                { id: 7, code: 'IT301' }, { id: 8, code: 'IT302' }, 
                { id: 9, code: 'IT303' }, { id: 10, code: 'IT304' },
                { id: 14, code: 'MATH202' }, { id: 15, code: 'MATH301' }
            ],
            numClasses: 1
        }
    ];

    semestersData.forEach(semester => {
        const { id: semesterId, semCode, startDate, endDate, status, courses, numClasses } = semester;
        
        courses.forEach((course, idx) => {
            const courseId = course.id;
            const courseCode = course.code;

            let lecturerId;
            if (courseId <= 10) lecturerId = 7 + (idx % 5); 
            else if (courseId <= 15) lecturerId = 17 + (idx % 3); 
            else if (courseId <= 18) lecturerId = 21 + (idx % 2); 
            else if (courseId <= 20) lecturerId = 23 + (idx % 2); 
            else lecturerId = 25 + (idx % 2); 
            
            for (let i = 1; i <= numClasses; i++) {
                const classType = i === 1 ? 'regular' : 'online';
                const sectionNumber = String(i).padStart(2, '0');
                const uniqueClassCode = `${courseCode}-${sectionNumber}-${semCode}`;

                classes.push({
                    course_id: courseId,
                    semester_id: semesterId,
                    lecturer_id: lecturerId,
                    
                    class_code: uniqueClassCode, 
                    class_name: `Lớp ${courseCode} - ${sectionNumber}`, 
                    
                    max_capacity: 60,
                    current_enrollment: (status === 'planned') ? 0 : (Math.floor(Math.random() * 40) + 10),
                    
                    class_type: classType,
                    class_status: status,
                    start_date: new Date(startDate),
                    end_date: new Date(endDate),
                    
                    created_at: new Date(),
                    updated_at: new Date()
                });
            }
        });
    });
    
    await queryInterface.bulkInsert('Classes', classes, {});
  },
  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('Classes', null, {});
  }
};
