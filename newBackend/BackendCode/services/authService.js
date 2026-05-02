const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userRepository = require("../repositories/userRepository");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_key";

async function registerUser(username, password, role = "user") {
  const existingUser = userRepository.findUserByUsername(username);

  if (existingUser) {
    throw new Error("Username already exists");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const newUser = {
    username: username,
    password_hash: passwordHash,
    role: role
  };

  return userRepository.createUser(newUser);
}

async function loginUser(username, password) {
  const user = userRepository.findUserByUsername(username);

  if (!user) {
    throw new Error("Invalid username or password");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    throw new Error("Invalid username or password");
  }

  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  return {
    message: "Login successful",
    token: token
  };
}

module.exports = {
  registerUser,
  loginUser
};