// models/Question.js

// Represents a single question in an exam
export class Question {
  // Creates a new question
  constructor(text, answers, correctAnswerIndex, difficulty = "medium") {
    // Generate a unique ID for the question
    this.id = crypto.randomUUID();

    // Store the question text
    this.text = text;

    // Store the list of answer options
    this.answers = answers;

    // Store the index of the correct answer
    this.correctAnswerIndex = correctAnswerIndex;

    // Store the difficulty level (default: medium)
    this.difficulty = difficulty;
  }

  // Checks whether the selected answer is correct
  isCorrect(userAnswerIndex) {
    return userAnswerIndex === this.correctAnswerIndex;
  }
}