import { Exam } from "./models/Exam.js";
import { Question } from "./models/Question.js";
import { ExamService } from "./services/ExamService.js";
import { ExamUI } from "./ui/ExamUI.js";
import { AuthService } from "./services/AuthService.js";
import { TeacherUI } from "./ui/TeacherUI.js";
import { StudentUI } from "./ui/StudentUI.js";
import { ResultService } from "./services/ResultService.js";


document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('users')) {
        const defaultUsers = [
            { "username": "karmen_teacher", "password": "123", "role": "teacher" },
            { "username": "malak_student", "password": "123", "role": "student" }
        ];
        localStorage.setItem('users', JSON.stringify(defaultUsers));
    }
    
});

// ==========================================
// --- Settings and Services ---
// ==========================================
const authService = new AuthService();
const examService = new ExamService();
const resultService = new ResultService(); // Results service
const examUI = new ExamUI(examService);

let teacherUI = null;
let studentUI = null;
let currentExam = null;

// ==========================================
// --- Navigation and Login Elements ---
// ==========================================
const loginView = document.getElementById("login-view");
const registerView = document.getElementById("register-view");
const teacherView = document.getElementById("teacher-view");
const studentView = document.getElementById("student-view");
const mainNav = document.getElementById("main-nav");
const welcomeMessage = document.getElementById("welcomeMessage");

// Function to update navigation between screens
function updateView() {
  const currentUser = authService.getCurrentUser();
  
  loginView.classList.add("d-none");
  registerView.classList.add("d-none");
  teacherView.classList.add("d-none");
  studentView.classList.add("d-none");
  mainNav.classList.add("d-none");

  if (!currentUser) {
    loginView.classList.remove("d-none");
  } else {
    mainNav.classList.remove("d-none");
    welcomeMessage.textContent = `שלום, ${currentUser.username}`;
    
    if (currentUser.role === "teacher") {
      teacherView.classList.remove("d-none");
      
      if (!teacherUI) {
        // Initialize teacher interface with required services
        teacherUI = new TeacherUI(examService, resultService); 
      }
      
      if(teacherUI && typeof teacherUI.renderExamList === 'function') {
          teacherUI.renderExamList();
      }

      if(teacherUI && typeof teacherUI.renderStudentResults === 'function') {
          teacherUI.renderStudentResults();
      }

    } else if (currentUser.role === "student") {
      studentView.classList.remove("d-none");

      if (!studentUI) {
        studentUI = new StudentUI(examService, resultService, currentUser);
      }
    }
  }
}

// ==========================================
// --- Event Listeners - Registration and Login ---
// ==========================================

document.getElementById("goToRegisterBtn").addEventListener("click", () => {
  loginView.classList.add("d-none");
  registerView.classList.remove("d-none");
});

document.getElementById("goToLoginBtn").addEventListener("click", () => {
  registerView.classList.add("d-none");
  loginView.classList.remove("d-none");
});

document.getElementById("registerBtn").addEventListener("click", () => {
  const user = document.getElementById("regUsername").value.trim();
  const pass = document.getElementById("regPassword").value.trim();
  const role = document.getElementById("regRole").value;
  
  if (!user || !pass) {
    alert("נא למלא את כל השדות.");
    return;
  }

  try {
    authService.register(user, pass, role);
    alert("ההרשמה הצליחה! כעת ניתן להתחבר.");
    document.getElementById("goToLoginBtn").click();
  } catch (error) {
    alert(error.message);
  }
});

document.getElementById("loginBtn").addEventListener("click", () => {
  const user = document.getElementById("loginUsername").value.trim();
  const pass = document.getElementById("loginPassword").value.trim();
  
  try {
    authService.login(user, pass);
    updateView();
  } catch (error) {
    alert(error.message);
  }
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  authService.logout();
  updateView();
});

if (document.getElementById("darkModeBtn")) {
  document.getElementById("darkModeBtn").addEventListener("click", () => {
    document.body.classList.toggle("bg-dark");
    document.body.classList.toggle("text-white");
    
    const cards = document.querySelectorAll(".card");

    cards.forEach(card => {
      card.classList.toggle("bg-dark");
      card.classList.toggle("border-light");
    });
  });
}

// ==========================================
// --- Original Teacher Code ---
// ==========================================
const examTitleInput = document.getElementById("examTitle");
const questionTextInput = document.getElementById("questionText");

const answer1Input = document.getElementById("answer1");
const answer2Input = document.getElementById("answer2");
const answer3Input = document.getElementById("answer3");
const answer4Input = document.getElementById("answer4");

const correctAnswerInput = document.getElementById("correctAnswer");

const addQuestionBtn = document.getElementById("addQuestionBtn");
const saveExamBtn = document.getElementById("saveExamBtn");

const examListElement = document.getElementById("examList");


if (addQuestionBtn) {
  addQuestionBtn.addEventListener("click", () => {

    const title = examTitleInput.value.trim();
    const questionText = questionTextInput.value.trim();

    const answers = [
      answer1Input.value.trim(),
      answer2Input.value.trim(),
      answer3Input.value.trim(),
      answer4Input.value.trim()
    ];

    const correctAnswerNumber = Number(correctAnswerInput.value);


    if (!title) {
      examUI.showBuilderMessage("Please enter exam title.", "danger");
      return;
    }


    if (!questionText) {
      examUI.showBuilderMessage("Please enter question text.", "danger");
      return;
    }


    if (answers.some(answer => answer === "")) {
      examUI.showBuilderMessage("Please fill all 4 answers.", "danger");
      return;
    }


    if (correctAnswerNumber < 1 || correctAnswerNumber > 4) {
      examUI.showBuilderMessage("Correct answer must be a number from 1 to 4.", "danger");
      return;
    }


    if (!currentExam) {
      currentExam = new Exam(title);
    }


    const correctAnswerIndex = correctAnswerNumber - 1;


    const question = new Question(
      questionText,
      answers,
      correctAnswerIndex
    );


    currentExam.addQuestion(question);


    examUI.showBuilderMessage(
      `Question added. Current exam has ${currentExam.getQuestionCount()} question(s).`,
      "success"
    );


    clearQuestionInputs();

  });
}



if (saveExamBtn) {

  saveExamBtn.addEventListener("click", () => {


    if (!currentExam) {
      examUI.showBuilderMessage("Create an exam and add at least one question first.", "danger");
      return;
    }


    if (currentExam.getQuestionCount() === 0) {
      examUI.showBuilderMessage("Cannot save exam without questions.", "danger");
      return;
    }


    examService.saveExam(currentExam);


    examUI.showBuilderMessage(
      "Exam saved successfully.",
      "success"
    );


    currentExam = null;


    examTitleInput.value = "";


    examUI.renderExamList();


  });

}



if (examListElement) {

  examListElement.addEventListener("click", event => {


    const examId = event.target.dataset.id;



    if (event.target.classList.contains("run-btn")) {


      const exam = examService.getExamById(examId);


      examUI.renderExamRunner(exam);

    }



    if (event.target.classList.contains("delete-btn")) {


      const confirmed = confirm(
        "Are you sure you want to delete this exam?"
      );


      if (!confirmed) return;



      examService.deleteExam(examId);


      examUI.renderExamList();

    }


  });

}



function clearQuestionInputs() {

  if (questionTextInput) questionTextInput.value = "";

  if (answer1Input) answer1Input.value = "";

  if (answer2Input) answer2Input.value = "";

  if (answer3Input) answer3Input.value = "";

  if (answer4Input) answer4Input.value = "";

  if (correctAnswerInput) correctAnswerInput.value = "";

}



// ==========================================
// --- Student Results ---
// ==========================================


function showStudentResults() {

  const data = localStorage.getItem("exam_results");


  const results = data ? JSON.parse(data) : [];



  const resultsDiv = document.getElementById("allStudentsResults");



  if (!resultsDiv) return;



  if (results.length === 0) {


    resultsDiv.innerHTML = "<p>אין עדיין תוצאות במערכת.</p>";


    return;

  }



  let html = '<ul class="list-group">';



  results.forEach(r => {


    html += `<li class="list-group-item">

      סטודנט: <strong>${r.studentUsername}</strong> | מבחן: ${r.examTitle} | ציון: ${r.percent}%

    </li>`;


  });



  html += '</ul>';



  resultsDiv.innerHTML = html;


}



const viewResultsBtn = document.getElementById("viewResultsBtn");


if (viewResultsBtn) {


  viewResultsBtn.addEventListener("click", showStudentResults);


}
 
// Run the update function when the page is loaded
if (examUI && typeof examUI.renderExamList === 'function') {
    examUI.renderExamList();
}

updateView();