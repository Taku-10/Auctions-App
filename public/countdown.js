const endTime = new Date("<%= endTime %>");
    const countdown = document.getElementById("countdown");

    function updateCountdown() {
      const now = new Date();
      const remainingTime = endTime - now;

      if (remainingTime <= 0) {
        countdown.innerHTML = "Auction has ended.";
        return;
      }

      const days = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
      const hours = Math.floor((remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

      countdown.innerHTML = `Auction ends in: ${days}d ${hours}h ${minutes}m ${seconds}s`;
    }

    setInterval(updateCountdown, 1000);