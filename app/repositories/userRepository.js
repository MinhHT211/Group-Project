const {Users, Students, Roles, UserRoles, sequelize} = require("../models");

class UserRepository {
  async findById(id) {
    return await Users.findByPk(id);
  }

  async findByEmail(identifier) {
    if (!identifier || typeof identifier !== 'string') {
        return null;
    }
    return await Users.findOne({
      where: sequelize.where(
        sequelize.fn("LOWER", sequelize.col("email")),
        identifier.toLowerCase()
      ),
      include: [{ model: Students, as: "Student", attributes: ["student_code"] }],

    });
  }

  async findByStudentCode(identifier) {
    const student = await Students.findOne({
      where: sequelize.where(
        sequelize.fn("LOWER", sequelize.col("student_code")),
        identifier.toLowerCase()
      ),
      include: [
        {
          model: Users,
          as: "user",
          required: true,
        },
      ],
    });
    return student?.user || null;
  }

  async findByUsername(identifier) {
    if (!identifier || typeof identifier !== 'string') return null;
    return await Users.findOne({
      where: sequelize.where(
        sequelize.fn("LOWER", sequelize.col("username")),
        identifier.toLowerCase()
      ),
    });
  }
  async updatePasswordHash(userId, newPasswordHash, transaction = null) {
    return await Users.update(
      { password_hash: newPasswordHash, updated_at: new Date() },
      { where: { user_id: userId }, transaction }
    );
  }

  async getUserRoles(userId) {
    const rows = await Roles.findAll({
      include: [
        {
          model: UserRoles,
          as: "user_roles",
          required: true,
          where: { user_id: userId },
          attributes: [],
        },
      ],
      attributes: ["role_name"],
    });
    return rows.map((r) => r.role_name);
  }

  splitName(fullName) {
    if (!fullName) return { first_name: "Unknown", last_name: "" };
    const parts = fullName.trim().split(/\s+/);
    const lastName = parts.pop();
    const firstName = parts.join(" ") || "Unknown";
    return { first_name: firstName, last_name: lastName };
  }

  async createUserWithDefaultRole({
    email,
    username,
    passwordHash,
    fullName,
    studentCode,
  }) {
    const t = await sequelize.transaction();

    try {
      const user = await this.createUser(
        {
          email,
          username,
          passwordHash,
          fullName,
        },
        t
      );

      await this.createStudent(user.user_id, studentCode, t);
      await this.assignDefaultRole(user.user_id, t);

      await t.commit();
      return user.user_id;
    } catch (error) { 
      await t.rollback();
      throw error;
    }
  }

  async createUser({ email, username, passwordHash, fullName }, transaction) {
    const { first_name, last_name } = this.splitName(fullName);

    return await Users.create(
      {
        email,
        username,
        password_hash: passwordHash,
        first_name,
        last_name,
        full_name: fullName || null,
        is_active: 1,
        is_deleted: 0,
        email_verified_at: new Date(),
        created_at: new Date(),
      },
      { transaction }
    );
  }

  async createStudent(userId, studentCode, transaction) {
    return await Students.create(
      {
        user_id: userId,
        student_code: studentCode,
        major_id: 1,
        admission_year: 2022,
        expected_graduation_year: 2026,
        student_status: "active",
        created_at: new Date(),
        updated_at: new Date(),
      },
      { transaction }
    );
  }

  async assignDefaultRole(userId,transaction) {
    const role = await Roles.findOne({
      where: { role_name: "student" },
      transaction,
    });
    
    if (role) {
      await UserRoles.create(
        {
          user_id: userId,
          role_id: role.role_id,
          assigned_date: new Date(),
        },
        { transaction }
      );
    }
  }
}



module.exports = new UserRepository();
