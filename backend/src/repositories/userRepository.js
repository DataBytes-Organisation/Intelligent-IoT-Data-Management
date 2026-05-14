const fs = require("fs");
const path = require("path");

const usersFilePath = path.join(__dirname, "../mock_data/users.json");

function ensureUsersFileExists() {
  const directoryPath = path.dirname(usersFilePath);

  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }

  if (!fs.existsSync(usersFilePath)) {
    fs.writeFileSync(usersFilePath, JSON.stringify([], null, 2));
  }
}

function readUsers() {
  ensureUsersFileExists();

  const data = fs.readFileSync(usersFilePath, "utf-8");

  if (!data.trim()) {
    return [];
  }

  return JSON.parse(data);
}

function writeUsers(users) {
  ensureUsersFileExists();
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
}

function findUserByUsername(username) {
  const users = readUsers();
  return users.find((user) => user.username === username);
}

function findUserById(id) {
  const users = readUsers();
  return users.find((user) => user.id === id);
}

function findUserByRefreshToken(refreshToken) {
  const users = readUsers();
  return users.find((user) => user.refreshToken === refreshToken);
}

function createUser(newUser) {
  const users = readUsers();

  const existingUser = users.find((user) => user.username === newUser.username);

  if (existingUser) {
    throw new Error("Username already exists");
  }

  const userWithDefaults = {
    id: Date.now().toString(),
    username: newUser.username,
    password_hash: newUser.password_hash,
    role: newUser.role || "user",
    refreshToken: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  users.push(userWithDefaults);
  writeUsers(users);

  return userWithDefaults;
}

function updateUser(username, updatedData) {
  const users = readUsers();

  const userIndex = users.findIndex((user) => user.username === username);

  if (userIndex === -1) {
    throw new Error("User not found");
  }

  users[userIndex] = {
    ...users[userIndex],
    ...updatedData,
    updatedAt: new Date().toISOString()
  };

  writeUsers(users);

  return users[userIndex];
}

function updateUserById(id, updatedData) {
  const users = readUsers();

  const userIndex = users.findIndex((user) => user.id === id);

  if (userIndex === -1) {
    throw new Error("User not found");
  }

  users[userIndex] = {
    ...users[userIndex],
    ...updatedData,
    updatedAt: new Date().toISOString()
  };

  writeUsers(users);

  return users[userIndex];
}

function getSafeUsers() {
  const users = readUsers();

  return users.map(({ password_hash, refreshToken, ...safeUser }) => safeUser);
}

module.exports = {
  readUsers,
  writeUsers,
  findUserByUsername,
  findUserById,
  findUserByRefreshToken,
  createUser,
  updateUser,
  updateUserById,
  getSafeUsers
};