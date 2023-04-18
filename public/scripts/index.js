
// Toggle the eye button icon for showing and hiding the password
const passwordInputs = document.querySelectorAll('.password-input');
  const togglePasswordBtns = document.querySelectorAll('.toggle-password-btn');

  togglePasswordBtns.forEach(function(togglePasswordBtn) {
    togglePasswordBtn.addEventListener('click', function() {
      const index = Array.from(togglePasswordBtns).indexOf(this);
      const type = passwordInputs[index].getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInputs[index].setAttribute('type', type);
      this.classList.toggle('fa-eye-slash');
      this.classList.toggle('fa-eye');
    });
  });
