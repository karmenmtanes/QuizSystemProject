// services/ExamService.js

import { Exam } from "../models/Exam.js";
import { Question } from "../models/Question.js";

// Handles exam storage and retrieval
export class ExamService {
  // Initializes the storage key
  constructor() {
    this.storageKey = "exams";
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