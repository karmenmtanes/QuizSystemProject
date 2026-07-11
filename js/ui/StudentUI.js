import { Exam } from "../models/Exam.js";
import { Question } from "../models/Question.js";

export class StudentUI {
  // Initializes the student interface
  constructor(examService, resultService, currentUser) {
    // Store the required services and current user
    this.examService = examService;
    this.resultService = resultService;
    this.currentUser = currentUser;

    // Get the main student container
    this.studentContainer = document.getElementById("student-view");

    // Store the current exam questions
    this.currentExamQuestions = [];

    // Store the timer interval reference
    this.timerInterval = null;

    // Build the initial page layout
    this.setupHTML();
  }

  // Builds the main page layout (the active exam panel is created dynamically)
  setupHTML() {
    this.studentContainer.innerHTML = `
      <h2>אזור סטודנט</h2>
      
      <div class="card mb-4">
        <div class="card-header bg-info text-white">היסטוריית הציונים שלי</div>
        <div class="card-body" id="historyArea"></div>
      </div>

      <div class="card mb-4">
        <div class="card-body">
          <h5 class="card-title">חיפוש וסינון מבחנים</h5>
          <input type="text" id="searchCodeInput" class="form-control" placeholder="חפש לפי שם או קוד מבחן...">
          <div id="searchResultsArea" class="mt-3"></div>
        </div>
      </div>
      
      <!-- The active exam and timer will be inserted here -->
      <div id="examExecutionArea"></div>
    `;

    // Listen for search input changes
    document.getElementById("searchCodeInput").addEventListener("input", (e) =>
      this.filterExams(e.target.value)
    );

    // Display the student's history
    this.renderHistory();
  }

  // Filters exams by title or search code
  filterExams(searchTerm) {
    const allExams = this.examService.getAllExams();

    const filtered = allExams.filter(ex =>
      ex.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ex.searchCode.toLowerCase().includes(searchTerm.toLowerCase())
    );

    this.renderExamList(filtered);
  }

  // Displays the filtered exam list
  renderExamList(exams) {
    const listArea = document.getElementById("searchResultsArea");

    // Show a message if no exams were found
    if (exams.length === 0) {
      listArea.innerHTML = "<p>לא נמצאו מבחנים.</p>";
      return;
    }

    let html = `<ul class="list-group">`;

    // Create a list item for each exam
    exams.forEach(exam => {
      html += `<li class="list-group-item d-flex justify-content-between align-items-center">
                ${exam.title} (קוד: ${exam.searchCode})
                <button class="btn btn-sm btn-primary start-btn" data-code="${exam.searchCode}">התחל</button>
               </li>`;
    });

    html += `</ul>`;
    listArea.innerHTML = html;

    // Attach click events to all start buttons
    document.querySelectorAll(".start-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const exam = this.examService.getExamByCode(e.target.dataset.code);
        this.renderExamRunner(exam);
      });
    });
  }

  // Starts the exam timer
  startExam(exam) {
    // Stop any existing timer
    if (this.timerInterval) clearInterval(this.timerInterval);

    let timeLeft = exam.durationMinutes * 60;
    const timerDisplay = document.getElementById("timer");

    this.timerInterval = setInterval(() => {
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;

      // Update the timer display
      if (timerDisplay) {
        timerDisplay.innerText = `זמן שנותר: ${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
      }

      // Submit the exam automatically when time expires
      if (timeLeft <= 0) {
        clearInterval(this.timerInterval);
        alert("נגמר הזמן!");
        this.checkExam(exam);
      }

      timeLeft--;
    }, 1000);
  }

  // Builds and displays the selected exam
  renderExamRunner(exam) {
    const executionArea = document.getElementById("examExecutionArea");

    // Randomize the exam before displaying it
    const questions = this.prepareExam(exam);

    // Create the active exam panel with the timer
    let html = `
      <div id="active-exam-panel" class="card mb-4 border-danger">
        <div class="card-header bg-danger text-white d-flex justify-content-between">
            <span>מבחן פעיל: ${exam.title}</span>
            <span id="timer" class="fw-bold">זמן שנותר: ${exam.durationMinutes}:00</span>
        </div>
      </div>
      <div class="card"><div class="card-body">
    `;

    // Display all questions and answers
    questions.forEach((q, qIndex) => {
      html += `<div class="border p-3 rounded mb-3"><h5>${qIndex + 1}: ${q.text}</h5>`;

      q.answers.forEach((ans, aIndex) => {
        html += `<label class="d-block"><input type="radio" name="q_${qIndex}" value="${aIndex}"> ${ans}</label>`;
      });

      html += `</div>`;
    });

    // Add the submit button
    html += `<button id="submitExamBtn" class="btn btn-success">הגש מבחן</button></div></div>`;

    executionArea.innerHTML = html;

    // Start the countdown timer
    this.startExam(exam);

    // Submit the exam when the button is clicked
    document.getElementById("submitExamBtn").addEventListener("click", () => {
      if (this.timerInterval) clearInterval(this.timerInterval);
      this.checkExam(exam);
    });
  }

  // Checks the submitted answers and calculates the score
  checkExam(exam) {
    let score = 0;
    let resultsHTML = "<h4>תוצאות המבחן:</h4><ul>";

    // Check every question
    this.currentExamQuestions.forEach((q, qIndex) => {
      const selected = document.querySelector(`input[name="q_${qIndex}"]:checked`);
      const selectedIndex = selected ? Number(selected.value) : -1;

      const isCorrect = selectedIndex === q.correctAnswerIndex;

      if (isCorrect) score++;

      resultsHTML += `<li><strong>שאלה:</strong> ${q.text} <br>
        <strong>התשובה שלך:</strong> ${selectedIndex !== -1 ? q.answers[selectedIndex] : "לא ענית"} <br>
        ${!isCorrect ? `<strong>התשובה הנכונה הייתה:</strong> ${q.answers[q.correctAnswerIndex]}` : "נכון!"}
        </li><hr>`;
    });

    // Calculate the final percentage
    const percent = Math.round((score / this.currentExamQuestions.length) * 100);

    // Save the student's result
    this.resultService.saveResult(
      this.currentUser.username,
      exam.title,
      score,
      this.currentExamQuestions.length
    );

    // Replace the exam with the final results
    document.getElementById("examExecutionArea").innerHTML =
      `<h3>ציון סופי: ${percent}%</h3>${resultsHTML}`;

    // Refresh the history section
    this.renderHistory();
  }

  // Randomizes questions and answer order
  prepareExam(exam) {
    this.currentExamQuestions = exam.questions.map(q => {
      const newQ = { ...q, answers: [...q.answers] };

      // Preserve the correct answer before shuffling
      const correctAnsText = newQ.answers[newQ.correctAnswerIndex];

      // Shuffle the answer options
      this.shuffleArray(newQ.answers);

      // Update the correct answer index
      newQ.correctAnswerIndex = newQ.answers.indexOf(correctAnsText);

      return newQ;
    });

    // Shuffle the question order
    this.shuffleArray(this.currentExamQuestions);

    return this.currentExamQuestions;
  }

  // Randomly shuffles an array
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }

    return array;
  }

  // Displays the student's exam history and average score
  renderHistory() {
    const historyArea = document.getElementById("historyArea");

    // Retrieve the student's previous results
    const myResults = this.resultService.getResultsByStudent(this.currentUser.username);

    // Calculate the average score
    let average = 0;

    if (myResults.length > 0) {
      const sum = myResults.reduce((acc, r) => acc + r.percent, 0);
      average = Math.round(sum / myResults.length);
    }

    // Display the average and exam history
    historyArea.innerHTML = `
        <div class="alert alert-primary">הממוצע הכללי שלך: <strong>${average}%</strong></div>
        ${myResults.length === 0
          ? "<p class='text-muted'>טרם ביצעת מבחנים.</p>"
          : `<ul class="list-group">${myResults.map(r => `<li class="list-group-item">מבחן: ${r.examTitle} | ציון: ${r.percent}%</li>`).join("")}</ul>`}
    `;
  }
}