const authService = require("../services/authService");

async function register(req, res) {
  try {
    const { username, password, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password are required"
      });
    }

    const user = await authService.registerUser(username, password, role);

    res.status(201).json({
      message: "User registered successfully",
      user
    });
  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
}

async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password are required"
      });
    }

    const result = await authService.loginUser(username, password);

    res.status(200).json(result);
  } catch (error) {
    res.status(401).json({
      message: error.message
    });
  }
}

module.exports = {
  register,
  login
};