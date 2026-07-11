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
          <h5 class="card-title">מבחנים זמינים (חיפוש וסינון)</h5>
          <input type="text" id="searchCodeInput" class="form-control" placeholder="חפש לפי שם או קוד מבחן...">
          <div id="searchResultsArea" class="mt-4"></div>
        </div>
      </div>
      
      <!-- The active exam and timer will be inserted here -->
      <div id="examExecutionArea"></div>
    `;

    // Listen for search input changes to filter the list live
    document.getElementById("searchCodeInput").addEventListener("input", (e) =>
      this.filterExams(e.target.value)
    );

    // Display the student's history
    this.renderHistory();

    // Immediately display all available exams on load
    this.filterExams("");
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

  // Displays the filtered exam list as formatted cards
  renderExamList(exams) {
    const listArea = document.getElementById("searchResultsArea");

    // Show a message if no exams were found
    if (exams.length === 0) {
      listArea.innerHTML = "<p class='text-muted'>לא נמצאו מבחנים זמינים כרגע.</p>";
      return;
    }

    let html = ``;

    // Create a beautifully formatted card for each exam
    exams.forEach(exam => {
      html += `
        <div class="card mb-3 p-3 shadow-sm border-left-primary">
          <h4>${exam.title} <span class="badge bg-secondary fs-6">קוד: ${exam.searchCode}</span></h4>
          <p class="mb-2 text-muted">${exam.description}</p>
          <p class="mb-3">
             <strong>זמן:</strong> ${exam.durationMinutes} דקות | 
             <strong>קטגוריה:</strong> ${exam.category}
          </p>
          <div>
            <button class="btn btn-primary start-btn" data-code="${exam.searchCode}">התחל מבחן</button>
          </div>
        </div>
      `;
    });

    listArea.innerHTML = html;

    // Attach click events to all start buttons
    document.querySelectorAll(".start-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        // Hide the exam list and search box when an exam starts
        document.getElementById("searchCodeInput").parentElement.parentElement.classList.add("d-none");
        
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
        alert("נגמר הזמן! המבחן יוגש אוטומטית.");
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
      <div id="active-exam-panel" class="card mb-4 border-danger shadow">
        <div class="card-header bg-danger text-white d-flex justify-content-between align-items-center">
            <span class="fs-5">מבחן פעיל: ${exam.title}</span>
            <span id="timer" class="fw-bold fs-5">זמן שנותר: ${exam.durationMinutes}:00</span>
        </div>
      </div>
      <div class="card shadow-sm"><div class="card-body">
    `;

    // Display all questions and answers
    questions.forEach((q, qIndex) => {
      html += `<div class="border p-4 rounded mb-4 bg-light"><h5 class="mb-3">${qIndex + 1}. ${q.text}</h5>`;

      q.answers.forEach((ans, aIndex) => {
        html += `<label class="d-block mb-2 p-2 border rounded bg-white" style="cursor:pointer;">
                   <input type="radio" name="q_${qIndex}" value="${aIndex}" class="me-2"> ${ans}
                 </label>`;
      });

      html += `</div>`;
    });

    // Add the submit button
    html += `<button id="submitExamBtn" class="btn btn-success btn-lg w-100 mt-3">הגש מבחן</button></div></div>`;

    executionArea.innerHTML = html;

    // Start the countdown timer
    this.startExam(exam);

    // Submit the exam when the button is clicked
    document.getElementById("submitExamBtn").addEventListener("click", () => {
      if (confirm("האם אתה בטוח שברצונך להגיש את המבחן?")) {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.checkExam(exam);
      }
    });
  }

  // Checks the submitted answers and calculates the score
  checkExam(exam) {
    let score = 0;
    let resultsHTML = "<h4 class='mb-4'>תוצאות המבחן:</h4><ul class='list-group mb-4'>";

    // Check every question
    this.currentExamQuestions.forEach((q, qIndex) => {
      const selected = document.querySelector(`input[name="q_${qIndex}"]:checked`);
      const selectedIndex = selected ? Number(selected.value) : -1;

      const isCorrect = selectedIndex === q.correctAnswerIndex;

      if (isCorrect) score++;

      resultsHTML += `
        <li class="list-group-item ${isCorrect ? 'list-group-item-success' : 'list-group-item-danger'}">
          <strong>שאלה:</strong> ${q.text} <br>
          <strong>התשובה שלך:</strong> ${selectedIndex !== -1 ? q.answers[selectedIndex] : "לא ענית"} <br>
          ${!isCorrect ? `<strong>התשובה הנכונה:</strong> ${q.answers[q.correctAnswerIndex]}` : "תשובה נכונה!"}
        </li>`;
    });

    resultsHTML += "</ul>";

    // Calculate the final percentage
    const percent = Math.round((score / this.currentExamQuestions.length) * 100);

    // Save the student's result
    this.resultService.saveResult(
      this.currentUser.username,
      exam.title,
      score,
      this.currentExamQuestions.length
    );

    // Replace the exam with the final results and a button to return to exams
    document.getElementById("examExecutionArea").innerHTML = `
      <div class="card shadow-sm border-primary">
        <div class="card-header bg-primary text-white text-center">
          <h3>ציון סופי: ${percent}%</h3>
        </div>
        <div class="card-body">
          ${resultsHTML}
          <button id="backToExamsBtn" class="btn btn-primary mt-3">חזור לרשימת המבחנים</button>
        </div>
      </div>
    `;

    // Refresh the history section
    this.renderHistory();

    // Reload the available exams list when clicking "Back"
    document.getElementById("backToExamsBtn").addEventListener("click", () => {
      document.getElementById("examExecutionArea").innerHTML = "";
      document.getElementById("searchCodeInput").parentElement.parentElement.classList.remove("d-none");
      this.filterExams("");
    });
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
        <div class="alert alert-primary text-center fs-5">הממוצע הכללי שלך: <strong>${average}%</strong></div>
        ${myResults.length === 0
          ? "<p class='text-muted text-center'>טרם ביצעת מבחנים.</p>"
          : `<ul class="list-group">${myResults.map(r => `<li class="list-group-item d-flex justify-content-between"><span>${r.examTitle}</span> <strong>${r.percent}%</strong></li>`).join("")}</ul>`}
    `;
  }
}