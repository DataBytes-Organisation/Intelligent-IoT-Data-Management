const fs = require("fs");
const path = require("path");

const usersFilePath = path.join(__dirname, "../mock_data/users.json");

function readUsers() {
  const data = fs.readFileSync(usersFilePath, "utf-8");
  return JSON.parse(data);
}

function writeUsers(users) {
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
}

function findUserByUsername(username) {
  const users = readUsers();
  return users.find((user) => user.username === username);
}

function createUser(newUser) {
  const users = readUsers();

  const existingUser = users.find((user) => user.username === newUser.username);

  if (existingUser) {
    throw new Error("Username already exists");
  }

  users.push(newUser);
  writeUsers(users);

  return newUser;
}

function updateUser(username, updatedData) {
  const users = readUsers();

  const userIndex = users.findIndex((user) => user.username === username);

  if (userIndex === -1) {
    throw new Error("User not found");
  }

  users[userIndex] = {
    ...users[userIndex],
    ...updatedData
  };

  writeUsers(users);

  return users[userIndex];
}

module.exports = {
  readUsers,
  writeUsers,
  findUserByUsername,
  createUser,
  updateUser
};