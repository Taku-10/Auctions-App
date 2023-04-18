
// Toggle the eye button icon for showing and hiding the password
const passwordInput = document.querySelector('#password');
const togglePasswordBtn = document.querySelector('#togglePasswordBtn');

togglePasswordBtn.addEventListener('click', function() {
  const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
  passwordInput.setAttribute('type', type);
  this.classList.toggle('fa-eye-slash');
  this.classList.toggle('fa-eye');
});
