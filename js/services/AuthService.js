// services/AuthService.js

import { User } from "../models/User.js";

// Handles user authentication and session management
export class AuthService {
  // Initializes storage keys
  constructor() {
    // Key used to store all registered users
    this.usersKey = "users";

    // Key used to store the currently logged-in user
    this.currentUserKey = "currentUser";
  }

  // Retrieves all users from local storage
  getUsers() {
    const data = localStorage.getItem(this.usersKey);
    return data ? JSON.parse(data) : [];
  }

  // Registers a new user
  register(username, password, role) {
    const users = this.getUsers();

    // Check if the username already exists
    const exists = users.find(u => u.username === username);
    if (exists) {
      throw new Error("שם המשתמש כבר קיים במערכת.");
    }

    // Create and save the new user
    const newUser = new User(username, password, role);
    users.push(newUser);
    localStorage.setItem(this.usersKey, JSON.stringify(users));

    return newUser;
  }

  // Authenticates a user using username and password
  login(username, password) {
    const users = this.getUsers();

    // Search for a matching user
    const user = users.find(
      u => u.username === username && u.password === password
    );

    // Throw an error if authentication fails
    if (!user) {
      throw new Error("שם משתמש או סיסמה שגויים.");
    }

    // Save the logged-in user in session storage
    sessionStorage.setItem(this.currentUserKey, JSON.stringify(user));
    return user;
  }

  // Logs out the current user
  logout() {
    sessionStorage.removeItem(this.currentUserKey);
  }

  // Returns the currently logged-in user
  getCurrentUser() {
    const data = sessionStorage.getItem(this.currentUserKey);
    return data ? JSON.parse(data) : null;
  }
}

// Initializes default users if none exist
export const initUsers = () => {
  // Default teacher and student accounts
  const defaultUsers = [
    { "username": "karmen_teacher", "password": "1234", "role": "teacher" },
    { "username": "malak_student", "password": "1234", "role": "student" }
  ];

  // Store the default users only on the first run
  if (!localStorage.getItem("users")) {
    localStorage.setItem("users", JSON.stringify(defaultUsers));
  }
};