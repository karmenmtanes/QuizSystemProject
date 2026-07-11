// js/services/ResultService.js

export class ResultService {
  constructor() {
    this.resultsKey = "exam_results";
  }

  // שליפת כל תוצאות המבחנים מ-localStorage
  getResults() {
    const results = JSON.parse(localStorage.getItem("exam_results") || "[]");
    
    const allExams = JSON.parse(localStorage.getItem("exams") || "[]");

    return results.filter(result => {


      return allExams.some(exam => exam.title === result.examTitle);
    });
  }

  // שמירת תוצאה חדשה עבור סטודנט ספציפי
  saveResult(studentUsername, examTitle, score, totalQuestions) {
    const results = this.getResults();
    const resultObj = {
      studentUsername: studentUsername,
      examTitle: examTitle,
      score: score,
      total: totalQuestions,
      percent: Math.round((score / totalQuestions) * 100),
      date: new Date().toLocaleString() // שמירת תאריך ושעה מדויקים
    };
    
    results.push(resultObj);
    localStorage.setItem(this.resultsKey, JSON.stringify(results));
  }

  // סינון תוצאות לפי שם משתמש של סטודנט לצורך הצגת היסטוריה אישית
  getResultsByStudent(username) {
    const results = this.getResults();
    return results.filter(r => r.studentUsername === username);
  }
}