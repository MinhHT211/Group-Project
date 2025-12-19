exports.validateRegister = (req, res, next) => {
  const { email = "", password = "", username = "",  studentCode = ""  } = req.body || {};
  if (!email.trim() || !password.trim() || !username.trim() )
    return res.status(422).json({ error: "Missing fields" });
  if (!/^[a-zA-Z0-9._-]+@usth\.edu\.vn$/.test(email))
    return res.status(422).json({ error: "Invalid email" });
  if (!/^[A-Za-z0-9]{6,12}$/.test(studentCode)){
    return  res.status(422).json({ error: "Invalid student code" });
  }
  if (password.length < 8)
    return res
      .status(422)
      .json({ error: "Password too short, at least 8 characters" });
  next();
};
exports.validateLogin = (req, res, next) => {
  const { identifier = "", password = "" } = req.body || {};
  if (!identifier.trim() || !password.trim())
    return res.status(422).json({ error: "Missing identifier or password" });
  next();
};

exports.validateChangePasswordByUser = (req, res, next) => {
  const { oldPassword = '', newPassword = '', nowEmail = '' } = req.body || {};

  if (!nowEmail || !nowEmail.trim()) {
    return res.status(422).json({ error: 'Missing email for verification' });
  }

  if (!oldPassword.trim() || !newPassword.trim()) {
    return res.status(422).json({ error: 'Missing oldPassword or newPassword' });
  }

  if (newPassword.length < 8) {
    return res.status(422).json({ error: 'Password too short, at least 8 characters' });
  }

  next();
};
exports.validateChangePasswordAdmin = (req, res, next) => {
  const { newPassword = '' } = req.body || {};
  if (!newPassword.trim()) return res.status(422).json({ error: 'Missing newPassword' });
  if (newPassword.length < 8)
    return res.status(422).json({ error: 'Password too short, at least 8 characters' });
  next();
};