const cursor = document.getElementById("cursor");
const buttons = document.querySelectorAll(".btn");

let wasPinching = false;
let selectedButton = null;

function resetButtons() {
  buttons.forEach((btn) => {
    btn.style.background = "white";
    btn.style.color = "black";
  });
}

window.onHandUpdate((hand) => {
  const x = hand.x * window.innerWidth;
  const y = hand.y * window.innerHeight;

  cursor.style.left = x + "px";
  cursor.style.top = y + "px";

  const pinchStarted = hand.isPinching && !wasPinching;

  if (pinchStarted) {
    buttons.forEach((btn) => {
      const rect = btn.getBoundingClientRect();

      const isInside =
        x > rect.left &&
        x < rect.right &&
        y > rect.top &&
        y < rect.bottom;

      if (isInside) {
        if (selectedButton === btn) {
          resetButtons();
          selectedButton = null;
        } else {
          resetButtons();
          btn.style.background = "green";
          btn.style.color = "white";
          selectedButton = btn;
        }
      }
    });
  }

  wasPinching = hand.isPinching;
});