// models/Exam.js
export class Exam {
  constructor(title, description, category, durationMinutes) {
    this.id = crypto.randomUUID();
    this.searchCode = Math.floor(1000 + Math.random() * 9000).toString();
    this.title = title;
    this.description = description; // إضافة الوصف
    this.category = category;       // إضافة التصنيف
    this.durationMinutes = durationMinutes; // إضافة المدة
    this.questions = [];
    this.createdAt = new Date().toISOString();
  }

  addQuestion(question) {
    this.questions.push(question);
  }

  getQuestionCount() {
    return this.questions.length;
  }
}