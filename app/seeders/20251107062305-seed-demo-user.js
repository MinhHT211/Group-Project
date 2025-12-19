'use strict';
const bcrypt = require('bcryptjs');
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
    const password = await bcrypt.hash('password123', 10);
    const users = [];
    let userId = 1;

    const generateFullName = (firstName, lastName) => {
      return `${lastName} ${firstName}`.trim();
    };

    // --- 1. Admin ---
    users.push({
      user_id: userId++,
      username: 'admin',
      email: 'admin@university.edu.vn',
      password_hash: password,
      first_name: 'Admin',
      last_name: 'System',
      full_name: 'System Admin',
      date_of_birth: '1980-01-01',
      gender: 'male',
      phone: '0912345601',
      is_active: true,
      is_deleted: false,
      created_at: new Date(),
      updated_at: new Date()
    });

    // --- 2. Assistants (1 per department) ---
    const assistants = [
      { username: 'assistant_it', email: 'assistant.it@university.edu.vn', first_name: 'Lan', last_name: 'Nguyen Thi', gender: 'female', phone: '0912345602' },
      { username: 'assistant_math', email: 'assistant.math@university.edu.vn', first_name: 'Hoa', last_name: 'Tran Thi', gender: 'female', phone: '0912345603' },
      { username: 'assistant_phy', email: 'assistant.phy@university.edu.vn', first_name: 'Mai', last_name: 'Le Thi', gender: 'female', phone: '0912345604' },
      { username: 'assistant_chem', email: 'assistant.chem@university.edu.vn', first_name: 'Huong', last_name: 'Pham Thi', gender: 'female', phone: '0912345605' },
      { username: 'assistant_eng', email: 'assistant.eng@university.edu.vn', first_name: 'Linh', last_name: 'Hoang Thi', gender: 'female', phone: '0912345606' }
    ];

    assistants.forEach(a => {
      users.push({
        user_id: userId++,
        ...a,
        password_hash: password,
        full_name: generateFullName(a.first_name, a.last_name),
        date_of_birth: '1985-05-15',
        is_active: true,
        is_deleted: false,
        created_at: new Date(),
        updated_at: new Date()
      });
    });

    // --- 3. Lecturers ---
    const lecturerNames = [
      // IT (10)
      { first: 'A', last: 'Nguyen Van', dept: 'IT' },
      { first: 'B', last: 'Tran Thi', dept: 'IT' },
      { first: 'C', last: 'Le Van', dept: 'IT' },
      { first: 'D', last: 'Pham Thi', dept: 'IT' },
      { first: 'E', last: 'Hoang Van', dept: 'IT' },
      { first: 'F', last: 'Vu Thi', dept: 'IT' },
      { first: 'G', last: 'Do Van', dept: 'IT' },
      { first: 'H', last: 'Bui Thi', dept: 'IT' },
      { first: 'I', last: 'Dang Van', dept: 'IT' },
      { first: 'J', last: 'Ngo Thi', dept: 'IT' },
      
      // MATH (4)
      { first: 'K', last: 'Nguyen Van', dept: 'MATH' },
      { first: 'L', last: 'Tran Thi', dept: 'MATH' },
      { first: 'M', last: 'Le Van', dept: 'MATH' },
      { first: 'N', last: 'Pham Thi', dept: 'MATH' },
      
      // PHY (2)
      { first: 'O', last: 'Hoang Van', dept: 'PHY' },
      { first: 'P', last: 'Vu Thi', dept: 'PHY' },
      
      // CHEM (2)
      { first: 'Q', last: 'Do Van', dept: 'CHEM' },
      { first: 'R', last: 'Bui Thi', dept: 'CHEM' },
      
      // ENG (2)
      { first: 'S', last: 'Dang Van', dept: 'ENG' },
      { first: 'T', last: 'Ngo Thi', dept: 'ENG' }
    ];

    lecturerNames.forEach((l, idx) => {
      const safeEmailLast = l.last.toLowerCase().replace(/\s+/g, '.');
      
      users.push({
        user_id: userId++,
        username: `lecturer_${l.dept.toLowerCase()}${String(idx + 1).padStart(2, '0')}`,
        email: `${l.first.toLowerCase()}.${safeEmailLast}@university.edu.vn`,
        password_hash: password,
        first_name: l.first,
        last_name: l.last,
        full_name: generateFullName(l.first, l.last),
        date_of_birth: `197${idx % 10}-${String((idx % 12) + 1).padStart(2, '0')}-15`,
        gender: idx % 2 === 0 ? 'male' : 'female',
        phone: `091234${5610 + idx}`,
        is_active: true,
        is_deleted: false,
        created_at: new Date(),
        updated_at: new Date()
      });
    });

    // --- 4. Students ---
    for (let i = 0; i < 100; i++) {
      const year = 2021 + (i % 4);
      const firstName = `Student${i + 1}`;
      const lastName = `Nguyen`;

      users.push({
        user_id: userId++,
        username: `student${year}${String(i + 1).padStart(4, '0')}`,
        email: `student${year}${String(i + 1).padStart(4, '0')}@student.university.edu.vn`,
        password_hash: password,
        first_name: firstName,
        last_name: lastName,
        full_name: generateFullName(firstName, lastName),
        date_of_birth: `200${i % 5}-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
        gender: i % 2 === 0 ? 'male' : 'female',
        phone: `098${String(1000000 + i).substring(0, 7)}`,
        is_active: true,
        is_deleted: false,
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    await queryInterface.bulkInsert('Users', users, {});
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('Users', null, {});
  }
};
