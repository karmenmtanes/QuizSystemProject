import { Exam } from "../models/Exam.js";
import { Question } from "../models/Question.js";

export class StudentUI {
  constructor(examService, resultService, currentUser) {
    this.examService = examService;
    this.resultService = resultService;
    this.currentUser = currentUser;
    this.studentContainer = document.getElementById("student-view");
    this.currentExamQuestions = [];
    this.timerInterval = null; 
    this.setupHTML();
  }

  // מבנה הדף הראשי - ללא הבר האדום, הוא ייווצר דינמית
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
      
      <!-- כאן יופיע המבחן + הטיימר שיוזרק דינמית -->
      <div id="examExecutionArea"></div>
    `;
    
    document.getElementById("searchCodeInput").addEventListener("input", (e) => this.filterExams(e.target.value));
    this.renderHistory();
  }

  filterExams(searchTerm) {
    const allExams = this.examService.getAllExams();
    const filtered = allExams.filter(ex => 
      ex.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      ex.searchCode.toLowerCase().includes(searchTerm.toLowerCase())
    );
    this.renderExamList(filtered);
  }

  renderExamList(exams) {
    const listArea = document.getElementById("searchResultsArea");
    if (exams.length === 0) {
      listArea.innerHTML = "<p>לא נמצאו מבחנים.</p>";
      return;
    }
    let html = `<ul class="list-group">`;
    exams.forEach(exam => {
      html += `<li class="list-group-item d-flex justify-content-between align-items-center">
                ${exam.title} (קוד: ${exam.searchCode})
                <button class="btn btn-sm btn-primary start-btn" data-code="${exam.searchCode}">התחל</button>
               </li>`;
    });
    html += `</ul>`;
    listArea.innerHTML = html;

    document.querySelectorAll('.start-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const exam = this.examService.getExamByCode(e.target.dataset.code);
        this.renderExamRunner(exam);
      });
    });
  }

  // הפעלת הטיימר בצורה נקייה
  startExam(exam) {
    if (this.timerInterval) clearInterval(this.timerInterval);

    let timeLeft = exam.durationMinutes * 60;
    const timerDisplay = document.getElementById("timer");
    
    this.timerInterval = setInterval(() => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        
        if (timerDisplay) {
            timerDisplay.innerText = `זמן שנותר: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        }

        if (timeLeft <= 0) {
            clearInterval(this.timerInterval);
            alert("נגמר הזמן!");
            this.checkExam(exam);
        }
        timeLeft--;
    }, 1000);
  }

  // בניית אזור המבחן + הטיימר (רק כשהסטודנט מתחיל)
  renderExamRunner(exam) {
    const executionArea = document.getElementById("examExecutionArea");
    const questions = this.prepareExam(exam);
    
    // כאן הבר האדום נבנה יחד עם המבחן - אין כפילויות!
    let html = `
      <div id="active-exam-panel" class="card mb-4 border-danger">
        <div class="card-header bg-danger text-white d-flex justify-content-between">
            <span>מבחן פעיל: ${exam.title}</span>
            <span id="timer" class="fw-bold">זמן שנותר: ${exam.durationMinutes}:00</span>
        </div>
      </div>
      <div class="card"><div class="card-body">
    `;
    
    questions.forEach((q, qIndex) => {
      html += `<div class="border p-3 rounded mb-3"><h5>${qIndex + 1}: ${q.text}</h5>`;
      q.answers.forEach((ans, aIndex) => {
        html += `<label class="d-block"><input type="radio" name="q_${qIndex}" value="${aIndex}"> ${ans}</label>`;
      });
      html += `</div>`;
    });
    
    html += `<button id="submitExamBtn" class="btn btn-success">הגש מבחן</button></div></div>`;
    executionArea.innerHTML = html;
    
    // מפעילים את הטיימר מיד אחרי שה-HTML נכנס לדף
    this.startExam(exam);
    
    document.getElementById("submitExamBtn").addEventListener("click", () => {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.checkExam(exam);
    });
  }

  checkExam(exam) {
    let score = 0;
    let resultsHTML = "<h4>תוצאות המבחן:</h4><ul>";

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

    const percent = Math.round((score / this.currentExamQuestions.length) * 100);
    this.resultService.saveResult(this.currentUser.username, exam.title, score, this.currentExamQuestions.length);
    
    // מנקים את אזור המבחן מהמסך (כולל הבר האדום)
    document.getElementById("examExecutionArea").innerHTML = `<h3>ציון סופי: ${percent}%</h3>${resultsHTML}`;
    this.renderHistory();
  }

  prepareExam(exam) {
    this.currentExamQuestions = exam.questions.map(q => {
      const newQ = { ...q, answers: [...q.answers] };
      const correctAnsText = newQ.answers[newQ.correctAnswerIndex];
      this.shuffleArray(newQ.answers);
      newQ.correctAnswerIndex = newQ.answers.indexOf(correctAnsText);
      return newQ;
    });
    this.shuffleArray(this.currentExamQuestions);
    return this.currentExamQuestions;
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // בתוך הפונקציה renderHistory() תעדכני את ה-HTML כך:
  renderHistory() {
    const historyArea = document.getElementById("historyArea");
    const myResults = this.resultService.getResultsByStudent(this.currentUser.username);
    
    // חישוב הממוצע
    let average = 0;
    if (myResults.length > 0) {
        const sum = myResults.reduce((acc, r) => acc + r.percent, 0);
        average = Math.round(sum / myResults.length);
    }

    historyArea.innerHTML = `
        <div class="alert alert-primary">הממוצע הכללי שלך: <strong>${average}%</strong></div>
        ${myResults.length === 0 ? "<p class='text-muted'>טרם ביצעת מבחנים.</p>" : 
        `<ul class="list-group">${myResults.map(r => `<li class="list-group-item">מבחן: ${r.examTitle} | ציון: ${r.percent}%</li>`).join('')}</ul>`}
    `;
  }
}
