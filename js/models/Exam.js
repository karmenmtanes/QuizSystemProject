// models/Exam.js

// Represents an exam with its details and questions
export class Exam {
  // Creates a new exam instance
  constructor(title, description, category, durationMinutes) {
    // Generate a unique ID for the exam
    this.id = crypto.randomUUID();

    // Generate a random 4-digit search code
    this.searchCode = Math.floor(1000 + Math.random() * 9000).toString();

    // Store the exam title
    this.title = title;

    // Store the exam description
    this.description = description;

    // Store the exam category
    this.category = category;

    // Store the exam duration in minutes
    this.durationMinutes = durationMinutes;

    // Initialize the questions array
    this.questions = [];

    // Store the creation date and time
    this.createdAt = new Date().toISOString();
  }

  // Adds a question to the exam
  addQuestion(question) {
    this.questions.push(question);
  }

  // Returns the total number of questions in the exam
  getQuestionCount() {
    return this.questions.length;
  }
}