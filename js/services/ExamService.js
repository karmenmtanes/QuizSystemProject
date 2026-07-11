import { Exam } from "../models/Exam.js";
import { Question } from "../models/Question.js";

export class ExamService {
  constructor() {
    this.storageKey = "exams";
  }

  // פונקציה להבאת כל המבחנים מה-LocalStorage
  getAllExams() {
    const data = localStorage.getItem(this.storageKey);

    if (!data) {
      return [];
    }

    const plainExams = JSON.parse(data);

    // יצירה מחדש של אובייקטי Exam עם כל המאפיינים שלהם כולל ה-searchCode
    return plainExams.map(examData => {
      // יצירת מופע חדש של Exam עם הנתונים המלאים
      const exam = new Exam(
        examData.title, 
        examData.description, 
        examData.category, 
        examData.durationMinutes
      );

      // שחזור מאפייני המבחן המקוריים
      exam.id = examData.id;
      exam.searchCode = examData.searchCode; // חשוב: שחזור הקוד לחיפוש
      exam.createdAt = examData.createdAt;

      // שחזור מערך השאלות
      exam.questions = examData.questions.map(questionData => {
        const question = new Question(
          questionData.text,
          questionData.answers,
          questionData.correctAnswerIndex
        );
        question.id = questionData.id;
        return question;
      });

      return exam;
    });
  }

  // שדרוג הפונקציה כך שתטפל גם בעדכון וגם בהוספה
  saveExam(exam) {
    const exams = this.getAllExams();
    const index = exams.findIndex(ex => ex.id === exam.id);
    
    if (index !== -1) {
      // אם המבחן קיים, נעדכן אותו
      exams[index] = exam;
    } else {
      // אם הוא חדש, נוסיף אותו
      exams.push(exam);
    }
    localStorage.setItem(this.storageKey, JSON.stringify(exams));
  }

  // פונקציה למחיקת מבחן לפי ID
  deleteExam(examId) {
    const exams = this.getAllExams();
    const filteredExams = exams.filter(exam => exam.id !== examId);
    localStorage.setItem(this.storageKey, JSON.stringify(filteredExams));
  }

  // פונקציה לחיפוש מבחן לפי הקוד שלו (searchCode)
  getExamByCode(code) {
    const exams = this.getAllExams();
    return exams.find(exam => exam.searchCode === code);
  }

  // פונקציה למציאת מבחן לפי ID
  getExamById(examId) {
    const exams = this.getAllExams();
    return exams.find(exam => exam.id === examId);
  }

  // פונקציה לעדכון מבחן קיים
  updateExam(updatedExam) {
    const exams = this.getAllExams();
    const index = exams.findIndex(exam => exam.id === updatedExam.id);
    if (index !== -1) {
      exams[index] = updatedExam;
      localStorage.setItem(this.storageKey, JSON.stringify(exams));
    }
  }
}
