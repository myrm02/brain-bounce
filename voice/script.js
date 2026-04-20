const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const simulateBtn = document.getElementById("simulateBtn");

const statusText = document.getElementById("statusText");
const transcriptEl = document.getElementById("transcript");
const intentEl = document.getElementById("intent");
const cartEl = document.getElementById("cart");
const logEl = document.getElementById("log");
const exampleButtons = document.querySelectorAll(".example-btn");
const catalogItems = document.querySelectorAll(".catalog li");

const products = ["casque", "clavier", "souris"];
const cart = [];

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

let recognition = null;

function setStatus(text) {
  statusText.textContent = text;
}

function setTranscript(text) {
  transcriptEl.textContent = text;
  transcriptEl.classList.toggle("empty", !text);
}

function setIntent(text) {
  intentEl.textContent = text;
  intentEl.classList.toggle("empty", !text);
}

function addLog(text) {
  const li = document.createElement("li");
  li.textContent = `[${new Date().toLocaleTimeString()}] ${text}`;
  logEl.prepend(li);
}

function renderCart() {
  cartEl.innerHTML = "";

  if (cart.length === 0) {
    const emptyLi = document.createElement("li");
    emptyLi.textContent = "Le panier est vide.";
    emptyLi.className = "empty";
    cartEl.appendChild(emptyLi);
    return;
  }

  cart.forEach((product, index) => {
    const li = document.createElement("li");
    li.textContent = `${index + 1}. ${capitalize(product)}`;
    cartEl.appendChild(li);
  });
}

function clearActiveProducts() {
  catalogItems.forEach((item) => item.classList.remove("active"));
}

function highlightProduct(productName) {
  clearActiveProducts();
  const match = [...catalogItems].find(
    (item) => item.dataset.product === productName
  );
  if (match) {
    match.classList.add("active");
  }
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function findProduct(command) {
  return products.find((product) => command.includes(product));
}

function handleCommand(rawCommand) {
  const command = rawCommand.toLowerCase().trim();

  setTranscript(rawCommand);
  addLog(`Commande reçue : "${rawCommand}"`);

  const product = findProduct(command);

  if (command.includes("vide") && command.includes("panier")) {
    cart.length = 0;
    renderCart();
    clearActiveProducts();
    setIntent("Intention détectée : vider le panier.");
    addLog("Panier vidé.");
    return;
  }

  if ((command.includes("montre") || command.includes("affiche")) && product) {
    highlightProduct(product);
    setIntent(`Intention détectée : afficher le produit "${product}".`);
    addLog(`Produit mis en avant : ${product}.`);
    return;
  }

  if (
    (command.includes("ajoute") || command.includes("mettre")) &&
    product &&
    command.includes("panier")
  ) {
    cart.push(product);
    renderCart();
    highlightProduct(product);
    setIntent(`Intention détectée : ajouter "${product}" au panier.`);
    addLog(`Produit ajouté au panier : ${product}.`);
    return;
  }

  setIntent("Commande entendue, mais intention non reconnue.");
  clearActiveProducts();
  addLog("Aucune règle ne correspond à la commande.");
}

function initRecognition() {
  if (!SpeechRecognition) {
    setStatus("non supporté");
    setIntent(
      "La reconnaissance vocale n'est pas disponible dans ce navigateur."
    );
    addLog("Web Speech API indisponible.");
    startBtn.disabled = true;
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = "fr-FR";
  recognition.continuous = false;
  recognition.interimResults = true;

  recognition.onstart = () => {
    setStatus("écoute en cours");
    startBtn.disabled = true;
    stopBtn.disabled = false;
    addLog("Micro démarré.");
  };

  recognition.onend = () => {
    setStatus("en attente");
    startBtn.disabled = false;
    stopBtn.disabled = true;
    addLog("Micro arrêté.");
  };

  recognition.onerror = (event) => {
    setStatus("erreur");
    addLog(`Erreur micro : ${event.error}`);
  };

  recognition.onresult = (event) => {
    let transcript = "";

    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }

    setTranscript(transcript);

    const lastResult = event.results[event.results.length - 1];
    if (lastResult.isFinal) {
      handleCommand(transcript);
    }
  };
}

startBtn.addEventListener("click", () => {
  if (!recognition) return;
  recognition.start();
});

stopBtn.addEventListener("click", () => {
  if (!recognition) return;
  recognition.stop();
});

simulateBtn.addEventListener("click", () => {
  const fakeCommand = prompt(
    "Entre une commande test :",
    "ajoute le casque au panier"
  );

  if (!fakeCommand) return;
  handleCommand(fakeCommand);
});

exampleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    handleCommand(button.dataset.command);
  });
});

renderCart();
initRecognition();