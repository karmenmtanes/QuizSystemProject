import { User } from "../models/User.js";

export class AuthService {
  constructor() {
    this.usersKey = "users";
    this.currentUserKey = "currentUser";
  }
  

  getUsers() {
    const data = localStorage.getItem(this.usersKey);
    return data ? JSON.parse(data) : [];
  }

  register(username, password, role) {
    const users = this.getUsers();
    
    const exists = users.find(u => u.username === username);
    if (exists) {
      throw new Error("שם המשתמש כבר קיים במערכת.");
    }
    
    const newUser = new User(username, password, role);
    users.push(newUser);
    localStorage.setItem(this.usersKey, JSON.stringify(users));
    
    return newUser;
  }

  login(username, password) {
    const users = this.getUsers();
    const user = users.find(u => u.username === username && u.password === password);
    
    if (!user) {
      throw new Error("שם משתמש או סיסמה שגויים.");
    }
    
    sessionStorage.setItem(this.currentUserKey, JSON.stringify(user));
    return user;
  }

  logout() {
    sessionStorage.removeItem(this.currentUserKey);
  }

  getCurrentUser() {
    const data = sessionStorage.getItem(this.currentUserKey);
    return data ? JSON.parse(data) : null;
  }  
}
export const initUsers = () => {
    const defaultUsers = [
        { "username": "karmen_teacher", "password": "1234", "role": "teacher" },
        { "username": "malak_student", "password": "1234", "role": "student" }
    ];

    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify(defaultUsers));
    }
};
