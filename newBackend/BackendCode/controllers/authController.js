const authService = require("../services/authService");

async function register(req, res) {
  try {
    const { username, password, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required"
      });
    }

    const user = await authService.registerUser(username, password, role);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required"
      });
    }

    const result = await authService.loginUser(username, password);

    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message
    });
  }
}

function refreshToken(req, res) {
  try {
    const { refreshToken } = req.body;

    const result = authService.refreshAccessToken(refreshToken);

    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: error.message
    });
  }
}

function logout(req, res) {
  try {
    const { refreshToken } = req.body;

    const result = authService.logoutUser(refreshToken);

    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

function getUsers(req, res) {
  try {
    const users = authService.getAllUsers();

    return res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      users
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getUsers
};