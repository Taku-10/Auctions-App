const passwordInput = document.getElementById("password");
const passwordStrengthMeter = document.getElementById("password-strength-meter");
const passwordStrengthText = document.getElementById("password-strength-text");

passwordInput.addEventListener("input", () => {
  const password = passwordInput.value;
  const passwordStrength = zxcvbn(password).score; // Calculate password strength score from zxcvbn library

  // Update password strength meter and text based on password strength score
  switch (passwordStrength) {
    case 0:
      passwordStrengthMeter.style.width = "0%";
      passwordStrengthMeter.className = "bg-danger";
      passwordStrengthText.innerText = "Very weak";
      passwordStrengthText.className = "text-danger";
      break;
    case 1:
      passwordStrengthMeter.style.width = "25%";
      passwordStrengthMeter.className = "bg-danger";
      passwordStrengthText.innerText = "Weak";
      passwordStrengthText.className = "text-danger";
      break;
    case 2:
      passwordStrengthMeter.style.width = "50%";
      passwordStrengthMeter.className = "bg-warning";
      passwordStrengthText.innerText = "Fair";
      passwordStrengthText.className = "text-warning";
      break;
    case 3:
      passwordStrengthMeter.style.width = "75%";
      passwordStrengthMeter.className = "bg-info";
      passwordStrengthText.innerText = "Good";
      passwordStrengthText.className = "text-info";
      break;
    case 4:
      passwordStrengthMeter.style.width = "100%";
      passwordStrengthMeter.className = "bg-success";
      passwordStrengthText.innerText = "Strong";
      passwordStrengthText.className = "text-success";
      break;
    default:
      passwordStrengthMeter.style.width = "0%";
      passwordStrengthMeter.className = "bg-danger";
      passwordStrengthText.innerText = "Very weak";
      passwordStrengthText.className = "text-danger";
      break;
  }
});
