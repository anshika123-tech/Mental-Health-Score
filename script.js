const API_URL = "https://mental-health-score-1-pmsw.onrender.com/predict";

const form = document.getElementById("predict-form");
const predictBtn = document.getElementById("predict-btn");
const resetBtn = document.getElementById("reset-btn");
const formMessage = document.getElementById("form-message");
const resultSection = document.getElementById("result");
const resultScore = document.getElementById("result-score");
const resultInline = document.getElementById("result-inline");

// Each field: label for messages, type, and optional limits
const FIELDS = [
  { name: "age", label: "Age", type: "int", min: 10, max: 100 },
  { name: "gender", label: "Gender", type: "text" },
  { name: "country", label: "Country", type: "text" },
  { name: "academic_level", label: "Academic level", type: "text" },
  { name: "most_used_platform", label: "Most used platform", type: "text" },
  { name: "purpose_of_use", label: "Purpose of use", type: "text" },
  {
    name: "avg_daily_usage_hours",
    label: "Average daily usage hours",
    type: "float",
    min: 0,
    max: 24
  },
  {
    name: "daily_unlocks",
    label: "Daily unlocks",
    type: "int",
    min: 0
  },
  {
    name: "study_hours",
    label: "Study hours",
    type: "float",
    min: 0,
    max: 24
  },
  {
    name: "physical_activity_hours",
    label: "Physical activity hours",
    type: "float",
    min: 0,
    max: 24
  },
  {
    name: "sleep_hours_per_night",
    label: "Sleep hours per night",
    type: "float",
    min: 0,
    max: 24
  },
  { name: "stress_level", label: "Stress level", type: "text" }
];

function setError(name, message) {
  const input = document.getElementById(name);
  const error = document.getElementById(name + "-error");

  error.textContent = message;
  input.classList.add("invalid");
}

function clearErrors() {
  FIELDS.forEach(({ name }) => {
    document.getElementById(name + "-error").textContent = "";
    document.getElementById(name).classList.remove("invalid");
  });

  hideFormMessage();
}

function showFormMessage(message) {
  formMessage.textContent = message;
  formMessage.hidden = false;
}

function hideFormMessage() {
  formMessage.textContent = "";
  formMessage.hidden = true;
}

// Build payload for FastAPI
function validateAndBuildPayload() {
  clearErrors();

  const payload = {};
  let valid = true;

  FIELDS.forEach((field) => {
    const raw = document.getElementById(field.name).value.trim();

    if (raw === "") {
      setError(field.name, field.label + " is required.");
      valid = false;
      return;
    }

    if (field.type === "text") {
      payload[field.name] = raw;
      return;
    }

    const value = Number(raw);

    if (Number.isNaN(value)) {
      setError(field.name, field.label + " must be a number.");
      valid = false;
      return;
    }

    if (field.type === "int" && !Number.isInteger(value)) {
      setError(field.name, field.label + " must be a whole number.");
      valid = false;
      return;
    }

    if (field.min !== undefined && value < field.min) {
      const message =
        field.max !== undefined
          ? field.label +
            " must be between " +
            field.min +
            " and " +
            field.max +
            "."
          : field.label + " cannot be negative.";

      setError(field.name, message);
      valid = false;
      return;
    }

    if (field.max !== undefined && value > field.max) {
      setError(
        field.name,
        field.label +
          " must be between " +
          field.min +
          " and " +
          field.max +
          "."
      );
      valid = false;
      return;
    }

    payload[field.name] = value;
  });

  return { valid, payload };
}

function setLoading(isLoading) {
  predictBtn.disabled = isLoading;
  predictBtn.textContent = isLoading ? "Predicting..." : "Predict";
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  resultSection.hidden = true;

  const { valid, payload } = validateAndBuildPayload();

  if (!valid) {
    showFormMessage("Please fix the highlighted fields and try again.");
    return;
  }

  setLoading(true);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      showFormMessage(
        response.status === 422
          ? "The server could not accept these values. Please check your entries and try again."
          : "The prediction server returned an error. Please try again later."
      );
      return;
    }

    const data = await response.json();

    const score = Number(data.predicted_mental_health_score);

    if (!Number.isFinite(score)) {
      showFormMessage(
        "The server sent an unexpected response. Please try again."
      );
      return;
    }

    resultScore.textContent = score.toFixed(2);
    resultInline.textContent = score.toFixed(2);

    resultSection.hidden = false;

    resultSection.scrollIntoView({
      behavior: "smooth",
      block: "nearest"
    });

  } catch (err) {
    console.error("Prediction error:", err);

    showFormMessage(
      "Unable to connect to the prediction server. Please make sure the FastAPI server is running."
    );

  } finally {
    setLoading(false);
  }
});

resetBtn.addEventListener("click", () => {
  form.reset();

  clearErrors();

  resultSection.hidden = true;

  resultScore.textContent = "0.00";
  resultInline.textContent = "0.00";

  setLoading(false);
});