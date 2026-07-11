// js/services/ResultService.js

// Handles saving and retrieving exam results
export class ResultService {
  // Initializes the storage key for exam results
  constructor() {
    this.resultsKey = "exam_results";
  }

  // Retrieves all valid exam results from LocalStorage
  getResults() {
    const results = JSON.parse(localStorage.getItem("exam_results") || "[]");

    // Retrieve all existing exams
    const allExams = JSON.parse(localStorage.getItem("exams") || "[]");

    // Return only results that belong to existing exams
    return results.filter(result => {
      return allExams.some(exam => exam.title === result.examTitle);
    });
  }

  // Saves a new result for a specific student
  saveResult(studentUsername, examTitle, score, totalQuestions) {
    const results = this.getResults();

    // Create the result object
    const resultObj = {
      studentUsername: studentUsername,
      examTitle: examTitle,
      score: score,
      total: totalQuestions,
      // Calculate the percentage score
      percent: Math.round((score / totalQuestions) * 100),
      // Store the exact date and time
      date: new Date().toLocaleString()
    };

    // Add the new result and save it
    results.push(resultObj);
    localStorage.setItem(this.resultsKey, JSON.stringify(results));
  }

  // Retrieves all results for a specific student
  getResultsByStudent(username) {
    const results = this.getResults();

    // Filter results by the student's username
    return results.filter(r => r.studentUsername === username);
  }
}