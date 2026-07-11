export class ExamUI {
  constructor(examService) {
    // Store the exam service for CRUD operations
    this.examService = examService;

    // Get references to the main UI elements
    this.examListElement = document.getElementById("examList");
    this.examRunnerElement = document.getElementById("examRunner");
    this.builderMessageElement = document.getElementById("builderMessage");
  }

  // Displays a status message in the exam builder
  showBuilderMessage(message, type = "success") {
    this.builderMessageElement.innerHTML = `
      <div class="alert alert-${type}">
        ${message}
      </div>
    `;
  }

  // Clears the builder message area
  clearBuilderMessage() {
    this.builderMessageElement.innerHTML = "";
  }

  // Renders the list of saved exams
  renderExamList() {
    const exams = this.examService.getAllExams();

    // Clear the current exam list
    this.examListElement.innerHTML = "";

    // Display a message if no exams exist
    if (exams.length === 0) {
      this.examListElement.innerHTML = `
        <p class="text-muted">No exams saved yet.</p>
      `;
      return;
    }

    // Create a card for each exam
    exams.forEach(exam => {
      const div = document.createElement("div");
      div.className = "exam-card";

      div.innerHTML = `<h5>${exam.title} (קוד מבחן: ${exam.searchCode || 'אין קוד'})</h5>

        <p class="small-muted">
          Questions: ${exam.getQuestionCount()}
        </p>

        <p class="small-muted">
          Created: ${new Date(exam.createdAt).toLocaleString()}
        </p>

        <button
          class="btn btn-sm btn-success run-btn"
          data-id="${exam.id}">
          Run Exam
        </button>

        <button
          class="btn btn-sm btn-danger delete-btn"
          data-id="${exam.id}">
          Delete
        </button>
      `;

      this.examListElement.appendChild(div);
    });
  }

  // Displays the selected exam for the user
  renderExamRunner(exam) {
    // Show an error if the exam does not exist
    if (!exam) {
      this.examRunnerElement.innerHTML = `
        <div class="alert alert-danger">
          Exam not found.
        </div>
      `;
      return;
    }

    // Show a warning if the exam has no questions
    if (exam.questions.length === 0) {
      this.examRunnerElement.innerHTML = `
        <div class="alert alert-warning">
          This exam has no questions.
        </div>
      `;
      return;
    }

    // Display the exam title and instructions
    this.examRunnerElement.innerHTML = `
      <h4>${exam.title}</h4>
      <p class="text-muted">
        Answer all questions and submit the exam.
      </p>
    `;

    // Render every question and its answer options
    exam.questions.forEach((question, questionIndex) => {
      const questionDiv = document.createElement("div");
      questionDiv.className = "question-box";

      questionDiv.innerHTML = `
        <h5>${questionIndex + 1}. ${question.text}</h5>

        ${question.answers.map((answer, answerIndex) => `
          <label class="answer-label">
            <input
              type="radio"
              name="question-${questionIndex}"
              value="${answerIndex}">
            ${answer}
          </label>
        `).join("")}
      `;

      this.examRunnerElement.appendChild(questionDiv);
    });

    // Create the submit button
    const submitButton = document.createElement("button");
    submitButton.className = "btn btn-primary";
    submitButton.textContent = "Submit Exam";

    // Check the exam when the button is clicked
    submitButton.addEventListener("click", () => {
      this.checkExam(exam);
    });

    this.examRunnerElement.appendChild(submitButton);
  }

  // Calculates the student's score
  checkExam(exam) {
    let score = 0;

    // Check each answered question
    exam.questions.forEach((question, questionIndex) => {
      const selectedAnswer = document.querySelector(
        `input[name="question-${questionIndex}"]:checked`
      );

      // Skip unanswered questions
      if (!selectedAnswer) {
        return;
      }

      const userAnswerIndex = Number(selectedAnswer.value);

      // Increase the score if the answer is correct
      if (question.isCorrect(userAnswerIndex)) {
        score++;
      }
    });

    // Display the final exam result
    const resultDiv = document.createElement("div");
    resultDiv.className = "alert alert-info mt-3";

    resultDiv.innerHTML = `
      <h5>Exam Result</h5>
      <p>Score: ${score} / ${exam.questions.length}</p>
      <p>Percent: ${Math.round((score / exam.questions.length) * 100)}%</p>
    `;

    this.examRunnerElement.appendChild(resultDiv);
  }
}