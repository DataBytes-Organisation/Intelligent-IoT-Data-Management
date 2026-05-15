const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userRepository = require("../repositories/userRepository");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_key";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "dev_refresh_secret_key";

function generateAccessToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role
    },
    REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );
}

async function registerUser(username, password, role = "user") {
  const existingUser = userRepository.findUserByUsername(username);

  if (existingUser) {
    throw new Error("Username already exists");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const newUser = {
    username,
    password_hash: passwordHash,
    role
  };

  const createdUser = userRepository.createUser(newUser);

  const { password_hash, refreshToken, ...safeUser } = createdUser;

  return safeUser;
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

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  userRepository.updateUserById(user.id, {
    refreshToken
  });

  return {
    message: "Login successful",
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      username: user.username,
      role: user.role
    }
  };
}

function refreshAccessToken(refreshToken) {
  if (!refreshToken) {
    throw new Error("Refresh token is required");
  }

  const storedUser = userRepository.findUserByRefreshToken(refreshToken);

  if (!storedUser) {
    throw new Error("Invalid refresh token");
  }

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);

    const accessToken = generateAccessToken({
      id: decoded.id,
      username: decoded.username,
      role: decoded.role
    });

    return {
      message: "Access token refreshed successfully",
      accessToken
    };
  } catch (error) {
    throw new Error("Invalid or expired refresh token");
  }
}

function logoutUser(refreshToken) {
  if (!refreshToken) {
    throw new Error("Refresh token is required");
  }

  const user = userRepository.findUserByRefreshToken(refreshToken);

  if (!user) {
    throw new Error("Invalid refresh token");
  }

  userRepository.updateUserById(user.id, {
    refreshToken: null
  });

  return {
    message: "Logout successful"
  };
}

function getAllUsers() {
  return userRepository.getSafeUsers();
}

module.exports = {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  getAllUsers
};