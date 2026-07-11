import { Exam } from "../models/Exam.js";
import { Question } from "../models/Question.js";

export class TeacherUI {
  // Initializes the teacher interface
  constructor(examService, resultService) {
    // Store the required services
    this.examService = examService;
    this.resultService = resultService;

    // Store the currently edited exam
    this.currentExam = null;

    // Store the chart instance
    this.chartInstance = null;

    // Get the teacher container
    this.builderContainer = document.getElementById("teacher-view");

    // Build the page and attach event listeners
    this.setupHTML();
    this.attachGlobalEventListeners();
  }

  // Builds the teacher page layout
  setupHTML() {
    this.builderContainer.innerHTML = `
      <!-- Displays information about the currently selected exam -->
      <div id="exam-details-panel" class="card mb-4 d-none">
          <div class="card-header bg-secondary text-white">פרטי המבחן הנוכחי</div>
          <div class="card-body">
              <p><strong>ID:</strong> <span id="display-exam-id"></span></p>
              <p><strong>שם המבחן:</strong> <span id="display-exam-title"></span></p>
          </div>
      </div>

      <div class="mb-4">
        <button id="btn-manage-exams" class="btn btn-primary">ניהול מבחנים</button>
        <button id="btn-stats" class="btn btn-secondary">סטטיסטיקות ותוצאות</button>
      </div>

      <div id="manage-exams-view">
        <div class="card mb-4 p-3">
          <label>ייבוא מבחן מקובץ JSON:</label>
          <input type="file" id="importFile" accept=".json" class="form-control">
        </div>

        <div class="row">
          <div class="col-md-5">
            <div class="card mb-4">
              <div class="card-header bg-primary text-white">יצירת/עריכת מבחן</div>
              <div class="card-body">
                <input id="examTitle" type="text" class="form-control mb-2" placeholder="שם המבחן">
                <input id="examDesc" type="text" class="form-control mb-2" placeholder="תיאור">
                <input id="examCat" type="text" class="form-control mb-2" placeholder="קטגוריה">
                <input id="examTime" type="number" class="form-control mb-3" placeholder="משך זמן (דקות)">
                <hr>
                <h5>הוספת שאלות</h5>
                <input id="qText" type="text" class="form-control mb-2" placeholder="טקסט השאלה">
                <input id="ans1" type="text" class="form-control mb-2" placeholder="תשובה 1">
                <input id="ans2" type="text" class="form-control mb-2" placeholder="תשובה 2">
                <input id="ans3" type="text" class="form-control mb-2" placeholder="תשובה 3">
                <input id="ans4" type="text" class="form-control mb-2" placeholder="תשובה 4">

                <input id="correctAns" type="number" class="form-control mb-2" placeholder="מספר תשובה נכונה (1-4)">

                <select id="qDifficulty" class="form-control mb-3">
                  <option value="easy">קל</option>
                  <option value="medium">בינוני</option>
                  <option value="hard">קשה</option>
                </select>

                <button id="addQBtn" class="btn btn-success w-100 mb-2">הוסף שאלה</button>
                <button id="saveExBtn" class="btn btn-primary w-100">שמור/עדכן מבחן</button>
              </div>
            </div>
          </div>

          <div class="col-md-7">
            <div class="card mb-4">
              <div class="card-header bg-dark text-white">רשימת המבחנים שלי</div>
              <div class="card-body" id="teacherExamList"></div>
            </div>
          </div>
        </div>
      </div>

      <div id="stats-view" style="display: none;">
        <div class="row">
          <div class="col-md-6">
            <div class="card">
              <div class="card-header bg-info text-white">תוצאות תלמידים</div>
              <div class="card-body" id="allStudentsResults"></div>
            </div>
          </div>

          <div class="col-md-6">
            <div class="card">
              <div class="card-header bg-success text-white">גרף ציונים למבחן</div>
              <div class="card-body">
                <canvas id="myChart"></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Display the exam list and student results
    this.renderExamList();
    this.renderStudentResults();
  }

  // Attaches one global event listener using event delegation
  attachGlobalEventListeners() {
    this.builderContainer.addEventListener("click", (e) => {
      if (e.target.id === "btn-manage-exams") this.switchView("manage");
      if (e.target.id === "btn-stats") this.switchView("stats");
      if (e.target.id === "addQBtn") this.addQuestion();
      if (e.target.id === "saveExBtn") this.saveExam();

      // Handle exam action buttons
      if (e.target.classList.contains("delete-btn"))
        this.deleteExam(e.target.dataset.id);

      if (e.target.classList.contains("edit-btn"))
        this.editExam(e.target.dataset.id);

      if (e.target.classList.contains("export-btn"))
        this.exportExam(this.examService.getExamById(e.target.dataset.id));
    });

    // Handle JSON file import
    document.getElementById("importFile").addEventListener("change", (e) => {
      if (e.target.files[0]) this.importExam(e.target.files[0]);
    });
  }

  // Loads an exam into the edit form
  editExam(id) {
    const exam = this.examService.getExamById(id);

    this.currentExam = exam;

    // Show the exam information panel
    document.getElementById("exam-details-panel").classList.remove("d-none");
    document.getElementById("display-exam-id").innerText = exam.id;
    document.getElementById("display-exam-title").innerText = exam.title;

    // Fill the form with the exam data
    document.getElementById("examTitle").value = exam.title;
    document.getElementById("examDesc").value = exam.description;
    document.getElementById("examCat").value = exam.category;
    document.getElementById("examTime").value = exam.durationMinutes;
  }

  // Deletes an exam after confirmation
  deleteExam(id) {
    if (confirm("האם למחוק?")) {
      this.examService.deleteExam(id);
      this.renderExamList();
    }
  }

  // Switches between the management and statistics views
  switchView(viewName) {
    const manageView = document.getElementById("manage-exams-view");
    const statsView = document.getElementById("stats-view");
    const btnManage = document.getElementById("btn-manage-exams");
    const btnStats = document.getElementById("btn-stats");

    if (viewName === "manage") {
      manageView.style.display = "block";
      statsView.style.display = "none";
      btnManage.classList.replace("btn-secondary", "btn-primary");
      btnStats.classList.replace("btn-primary", "btn-secondary");
    } else {
      manageView.style.display = "none";
      statsView.style.display = "block";
      btnStats.classList.replace("btn-secondary", "btn-primary");
      btnManage.classList.replace("btn-primary", "btn-secondary");

      // Refresh the chart
      this.renderChart();
    }
  }

  // Adds a new question to the current exam
  addQuestion() {
    const title = document.getElementById("examTitle").value.trim();
    const qText = document.getElementById("qText").value.trim();
    const ans1 = document.getElementById("ans1").value.trim();
    const ans2 = document.getElementById("ans2").value.trim();
    const ans3 = document.getElementById("ans3").value.trim();
    const ans4 = document.getElementById("ans4").value.trim();
    const correctAns = Number(document.getElementById("correctAns").value);

    // Read the selected difficulty level
    const difficulty = document.getElementById("qDifficulty").value;

    // Validate the required fields
    if (!title || !qText || !ans1 || !ans2 || !ans3 || !ans4 || !correctAns) {
      alert("נא למלא את כל השדות בצורה תקינה!");
      return;
    }

    // Create the exam if it does not exist yet
    if (!this.currentExam) {
      const desc = document.getElementById("examDesc").value.trim();
      const cat = document.getElementById("examCat").value.trim();
      const time = document.getElementById("examTime").value;

      this.currentExam = new Exam(title, desc, cat, time);
    }

    // Create and add the question
    const question = new Question(
      qText,
      [ans1, ans2, ans3, ans4],
      correctAns - 1,
      difficulty
    );

    this.currentExam.addQuestion(question);

    alert("השאלה נוספה בהצלחה!");

    // Clear the question fields
    document
      .querySelectorAll("#qText, #ans1, #ans2, #ans3, #ans4, #correctAns")
      .forEach(i => (i.value = ""));
  }

  // Saves the current exam
  saveExam() {
    if (!this.currentExam) {
      alert("נא ליצור מבחן ולהוסיף שאלות לפני השמירה.");
      return;
    }

    this.examService.saveExam(this.currentExam);
    this.currentExam = null;

    this.renderExamList();
    this.renderStudentResults();

    alert("המבחן נשמר בהצלחה!");
  }

  // Displays the teacher's exam list
  renderExamList() {
    const exams = this.examService.getAllExams();
    const list = document.getElementById("teacherExamList");

    list.innerHTML = exams
      .map(
        ex => `
      <div class="exam-card border p-2 mb-2">
        <h6>${ex.title} (קוד: ${ex.searchCode})</h6>
        <button class="btn btn-sm btn-warning edit-btn" data-id="${ex.id}">ערוך</button>
        <button class="btn btn-sm btn-danger delete-btn" data-id="${ex.id}">מחק</button>
        <button class="btn btn-sm btn-info export-btn" data-id="${ex.id}">ייצוא JSON</button>
      </div>
    `
      )
      .join("");

    // Attach event listeners to the action buttons
    list.querySelectorAll(".delete-btn").forEach(btn =>
      btn.addEventListener("click", e => {
        if (confirm("האם למחוק?")) {
          this.examService.deleteExam(e.target.dataset.id);
          this.renderExamList();
        }
      })
    );

    list.querySelectorAll(".edit-btn").forEach(btn =>
      btn.addEventListener("click", e => {
        const exam = this.examService.getExamById(e.target.dataset.id);
        this.currentExam = exam;

        document.getElementById("examTitle").value = exam.title;
        document.getElementById("examDesc").value = exam.description;
        document.getElementById("examCat").value = exam.category;
        document.getElementById("examTime").value = exam.durationMinutes;
      })
    );

    list.querySelectorAll(".export-btn").forEach(btn =>
      btn.addEventListener("click", e => {
        const exam = this.examService.getExamById(e.target.dataset.id);
        this.exportExam(exam);
      })
    );
  }

  // Exports an exam as a JSON file
  exportExam(exam) {
    const dataStr = JSON.stringify(exam, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${exam.title}.json`;
    a.click();
  }

  // Imports an exam from a JSON file
  importExam(file) {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const importedExam = JSON.parse(e.target.result);

        // Assign a new ID and rename the imported copy
        importedExam.id = Date.now().toString();
        importedExam.title = importedExam.title + " (עותק)";

        this.examService.saveExam(importedExam);

        alert("המבחן יובא בהצלחה עם שם חדש!");
        this.renderExamList();
      } catch (error) {
        alert("שגיאה בייבוא הקובץ.");
      }
    };

    reader.readAsText(file);
  }

  // Displays all student results
  renderStudentResults() {
    const results = this.resultService.getResults();
    const container = document.getElementById("allStudentsResults");

    container.innerHTML =
      results.length === 0
        ? "<p>אין עדיין תוצאות.</p>"
        : results
            .map(
              r =>
                `<p>סטודנט: ${r.studentUsername} | מבחן: ${r.examTitle} | ציון: ${r.percent}%</p>`
            )
            .join("");

    // Refresh the chart if the statistics view is active
    if (document.getElementById("stats-view").style.display === "block") {
      this.renderChart();
    }
  }

  // Draws the results chart using Chart.js
  renderChart() {
    const results = this.resultService.getResults();

    // Do not draw a chart if there are no results
    if (results.length === 0) return;

    const ctx = document.getElementById("myChart").getContext("2d");

    // Destroy the previous chart before creating a new one
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    // Prepare chart labels and data
    const labels = results.map(
      r => r.studentUsername + " (" + r.examTitle + ")"
    );
    const data = results.map(r => r.percent);

    // Create the chart
    this.chartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "ציון באחוזים",
            data: data,
            backgroundColor: "rgba(54, 162, 235, 0.6)",
            borderColor: "rgba(54, 162, 235, 1)",
            borderWidth: 1
          }
        ]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            max: 100
          }
        }
      }
    });
  }
}