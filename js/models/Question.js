export class Question {
  constructor(text, answers, correctAnswerIndex, difficulty = "medium") {
    this.id = crypto.randomUUID();
    this.text = text;
    this.answers = answers;
    this.correctAnswerIndex = correctAnswerIndex;
    this.difficulty = difficulty; // הוספת רמת הקושי
  }

  isCorrect(userAnswerIndex) {
    return userAnswerIndex === this.correctAnswerIndex;
  }
}