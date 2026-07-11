// models/User.js

// Represents a system user
export class User {
  // Creates a new user
  constructor(username, password, role) {
    // Generate a unique ID for the user
    this.id = crypto.randomUUID();

    // Store the username
    this.username = username;

    // Store the user's password
    this.password = password;

    // Store the user's role (e.g., admin or student)
    this.role = role;
  }
}