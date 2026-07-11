// services/ExamService.js

import { Exam } from "../models/Exam.js";
import { Question } from "../models/Question.js";

// Handles exam storage and retrieval
export class ExamService {
  // Initializes the storage key
  constructor() {
    this.storageKey = "exams";
    this.initDefaultExams(); // قمنا بإضافة هذا السطر لتشغيل دالة الامتحانات الثابتة
  }

  // هذه الدالة تفحص إذا كانت الذاكرة فارغة، وتضيف امتحاناً ثابتاً
  initDefaultExams() {
    const data = localStorage.getItem(this.storageKey);
    const exams = data ? JSON.parse(data) : [];

    // إذا لم يكن هناك أي امتحانات في الذاكرة، سنقوم بإضافة الامتحان الافتراضي
    if (exams.length === 0) {
      const defaultExam = {
        id: "default-exam-001",
        searchCode: "1111", // كود البحث الثابت للامتحان
        title: "JavaScript Basics",
        description: "מבחן בסיסי בג'אווה סקריפט (מבחן קבוע שמור במערכת)",
        category: "Computer Science",
        durationMinutes: 15,
        createdAt: new Date().toISOString(),
        questions: [
          {
            id: "default-q-1",
            text: "מה תפקידו של LocalStorage?",
            answers: ["שמירת נתונים בשרת", "שמירת נתונים בדפדפן הלקוח", "עיצוב דפי אינטרנט", "כתיבת שאילתות למסד נתונים"],
            correctAnswerIndex: 1
          },
          {
            id: "default-q-2",
            text: "איזו מילת מפתח משמשת להגדרת משתנה ב-JavaScript?",
            answers: ["let", "int", "string", "define"],
            correctAnswerIndex: 0
          }
        ]
      };

      // حفظ الامتحان الافتراضي في الذاكرة
      exams.push(defaultExam);
      localStorage.setItem(this.storageKey, JSON.stringify(exams));
    }
  }

  // Retrieves all exams from LocalStorage
  getAllExams() {
    const data = localStorage.getItem(this.storageKey);

    // Return an empty array if no exams are stored
    if (!data) {
      return [];
    }

    const plainExams = JSON.parse(data);

    // Rebuild Exam objects with all their properties
    return plainExams.map(examData => {
      // Create a new Exam instance
      const exam = new Exam(
        examData.title,
        examData.description,
        examData.category,
        examData.durationMinutes
      );

      // Restore the original exam properties
      exam.id = examData.id;
      exam.searchCode = examData.searchCode;
      exam.createdAt = examData.createdAt;

      // Rebuild the questions array
      exam.questions = examData.questions.map(questionData => {
        const question = new Question(
          questionData.text,
          questionData.answers,
          questionData.correctAnswerIndex
        );

        // Restore the original question ID
        question.id = questionData.id;

        return question;
      });

      return exam;
    });
  }

  // Saves a new exam or updates an existing one
  saveExam(exam) {
    const exams = this.getAllExams();
    const index = exams.findIndex(ex => ex.id === exam.id);

    if (index !== -1) {
      // Update the existing exam
      exams[index] = exam;
    } else {
      // Add the new exam
      exams.push(exam);
    }

    localStorage.setItem(this.storageKey, JSON.stringify(exams));
  }

  // Deletes an exam by its ID
  deleteExam(examId) {
    const exams = this.getAllExams();
    const filteredExams = exams.filter(exam => exam.id !== examId);

    localStorage.setItem(this.storageKey, JSON.stringify(filteredExams));
  }

  // Finds an exam using its search code
  getExamByCode(code) {
    const exams = this.getAllExams();
    return exams.find(exam => exam.searchCode === code);
  }

  // Finds an exam by its unique ID
  getExamById(examId) {
    const exams = this.getAllExams();
    return exams.find(exam => exam.id === examId);
  }

  // Updates an existing exam
  updateExam(updatedExam) {
    const exams = this.getAllExams();
    const index = exams.findIndex(exam => exam.id === updatedExam.id);

    if (index !== -1) {
      exams[index] = updatedExam;
      localStorage.setItem(this.storageKey, JSON.stringify(exams));
    }
  }
}