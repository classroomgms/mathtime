const container = document.getElementById('container');
const zoneViewer = document.getElementById('zoneViewer');
let zoneFrame = document.getElementById('zoneFrame');
const searchBar = document.getElementById('searchBar');
const sortOptions = document.getElementById('sortOptions');
const zonesURL = "https://cdn.jsdelivr.net/gh/gn-math/assets@main/zones.json";
const coverURL = "https://cdn.jsdelivr.net/gh/gn-math/covers@main";
const htmlURL = "https://cdn.jsdelivr.net/gh/gn-math/html@main";

let zones = [];
let popularityData = {};

async function listZones() {
  try {
    const response = await fetch(zonesURL);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    zones = await response.json();
    await fetchPopularity();
    sortZones();
    const search = new URLSearchParams(window.location.search);
    const id = search.get('id');
    if (id) {
      const zone = zones.find(zone => zone.id + '' == id + '');
      if (zone) {
        openZone(zone);
      }
    }
    displayGameOfTheDay();
  } catch (error) {
    container.innerHTML = `Error loading zones: ${error.message}`;
  }
}

async function fetchPopularity() {
  try {
    const response = await fetch("https://data.jsdelivr.com/v1/stats/packages/gh/gn-math/html@main/files?period=year");
    const data = await response.json();
    data.forEach(file => {
      const idMatch = file.name.match(/\/(\d+)\.html$/);
      if (idMatch) {
        const id = parseInt(idMatch[1]);
        popularityData[id] = file.hits.total;
      }
    });
  } catch (error) {
    popularityData[0] = 0;
  }
}

function sortZones() {
  const sortBy = sortOptions.value;
  if (sortBy === 'name') {
    zones.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === 'id') {
    zones.sort((a, b) => a.id - b.id);
  } else if (sortBy === 'popular') {
    zones.sort((a, b) => (popularityData[b.id] || 0) - (popularityData[a.id] || 0));
  }
  zones.sort((a, b) => (a.id === -1 ? -1 : b.id === -1 ? 1 : 0));
  displayZones(zones);
  displayGameOfTheDay();
}

function displayZones(zonesToDisplay) {
  container.innerHTML = "";
  if (!zonesToDisplay.length) {
    container.innerHTML = "No zones found.";
    return;
  }

  // Insert Game of the Day container above zone items
  const gameOfTheDayContainer = document.getElementById("gameOfTheDay");
  if (!gameOfTheDayContainer) {
    const gameDiv = document.createElement("div");
    gameDiv.id = "gameOfTheDay";
    gameDiv.style.marginBottom = "10px";
    gameDiv.style.fontWeight = "bold";
    container.parentNode.insertBefore(gameDiv, container);
  }

  zonesToDisplay.forEach(file => {
    const zoneItem = document.createElement("div");
    zoneItem.className = "zone-item";
    zoneItem.onclick = () => openZone(file);

    const img = document.createElement("img");
    img.src = file.cover.replace("{COVER_URL}", coverURL).replace("{HTML_URL}", htmlURL);
    zoneItem.appendChild(img);

    const button = document.createElement("button");
    button.textContent = file.name;
    button.onclick = (event) => {
      event.stopPropagation();
      openZone(file);
    };
    zoneItem.appendChild(button);

    container.appendChild(zoneItem);
  });
  document.getElementById("zoneCount").textContent = `Total Games: ${zonesToDisplay.length}`;
}

function filterZones() {
  const query = searchBar.value.toLowerCase();
  const filteredZones = zones.filter(zone => zone.name.toLowerCase().includes(query));
  displayZones(filteredZones);
}

function openZone(file) {
  if (file.url.startsWith("http")) {
    window.location.href = file.url;
  } else {
    const url = file.url.replace("{COVER_URL}", coverURL).replace("{HTML_URL}", htmlURL);
    fetch(url).then(response => response.text()).then(html => {
      if (zoneFrame.contentDocument === null) {
        zoneFrame = document.createElement("iframe");
        zoneFrame.id = "zoneFrame";
        zoneViewer.appendChild(zoneFrame);
      }
      zoneFrame.contentDocument.open();
      zoneFrame.contentDocument.write(html);
      zoneFrame.contentDocument.close();
      document.getElementById('zoneName').textContent = file.name;
      document.getElementById('zoneId').textContent = file.id;
      zoneViewer.style.display = "block";
    }).catch(error => alert("Failed to load zone: " + error));
  }
}

function openZoneById(id) {
  const game = zones.find(g => g.id === id);
  if (game) {
    openZone(game);
  }
}

function getGameOfTheDay() {
  if (!zones || zones.length === 0) return null;
  const now = new Date();
  const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  const index = seed % zones.length;
  return zones[index];
}

function displayGameOfTheDay() {
  const game = getGameOfTheDay();
  const container = document.getElementById("container");
  let existing = document.getElementById("gameOfTheDayCard");
  if (existing) existing.remove();

  if (game) {
    const card = document.createElement("div");
    card.id = "gameOfTheDayCard";
    card.className = "zone-item";
    card.style.margin = "0 auto 15px auto";
    card.style.maxWidth = "200px";
    card.style.cursor = "pointer";
    card.onclick = () => openZone(game);

    const img = document.createElement("img");
    img.src = game.cover.replace("{COVER_URL}", coverURL).replace("{HTML_URL}", htmlURL);
    card.appendChild(img);

    const button = document.createElement("button");
    button.textContent = `${game.name}`;
    button.style.width = "100%";
    button.style.textAlign = "center";
    button.onclick = (e) => {
      e.stopPropagation();
      openZone(game);
    };
    card.appendChild(button);

    container.parentNode.insertBefore(card, container);
  }
}

function aboutBlank() {
  const newWindow = window.open("about:blank", "_blank");
  let zone = zones.find(zone => zone.id + '' === document.getElementById('zoneId').textContent).url.replace("{COVER_URL}", coverURL).replace("{HTML_URL}", htmlURL);
  fetch(zone).then(response => response.text()).then(html => {
    if (newWindow) {
      newWindow.document.open();
      newWindow.document.write(html);
      newWindow.document.close();
    }
  })
}

function closeZone() {
  zoneViewer.style.display = "none";
  if (zoneFrame) {
    zoneViewer.removeChild(zoneFrame);
    zoneFrame = document.createElement("iframe");
    zoneFrame.id = "zoneFrame";
    zoneViewer.appendChild(zoneFrame);
  }
}

function fullscreenZone() {
  if (zoneFrame.requestFullscreen) {
    zoneFrame.requestFullscreen();
  } else if (zoneFrame.mozRequestFullScreen) {
    zoneFrame.mozRequestFullScreen();
  } else if (zoneFrame.webkitRequestFullscreen) {
    zoneFrame.webkitRequestFullscreen();
  } else if (zoneFrame.msRequestFullscreen) {
    zoneFrame.msRequestFullscreen();
  }
}

function saveData() {
  let data = JSON.stringify(localStorage) + "\n\n|\n\n" + document.cookie;
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([data], {
    type: "text/plain"
  }));
  link.download = `${Date.now()}.data`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function loadData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    const content = e.target.result;
    const [localStorageData, cookieData] = content.split("\n\n|\n\n");
    try {
      const parsedData = JSON.parse(localStorageData);
      for (let key in parsedData) {
        localStorage.setItem(key, parsedData[key]);
      }
    } catch (error) {
      console.error(error);
    }
    if (cookieData) {
      const cookies = cookieData.split("; ");
      cookies.forEach(cookie => {
        document.cookie = cookie;
      });
    }
    alert("Data loaded");
  };
  reader.readAsText(file);
}

const darkModeToggle = document.getElementById('darkModeToggle');
darkModeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
});

listZones();

(function() {
    let lastTime = Date.now();
    const threshold = 60000; // 1 minute threshold for sleep detection

    setInterval(() => {
      const currentTime = Date.now();
      if (currentTime - lastTime > threshold) {
        location.reload(); // Refresh the page
      }
      lastTime = currentTime;
    }, 10000); // Check every 10 seconds
  })();

//           //

  const correctPassword = "timesitesgranted"; // Change this to your desired password
let wrongAttempts = 0;
const punishmentKey = "runawayPunishmentStart";

// Check if punishment is active
function isPunishmentActive() {
  const startTime = localStorage.getItem(punishmentKey);
  if (!startTime) return false;

  const elapsed = Date.now() - parseInt(startTime, 10);
  return elapsed < 3600000; // 1 hour in milliseconds
}

// Start punishment
function activatePunishment() {
  if (!localStorage.getItem(punishmentKey)) {
    localStorage.setItem(punishmentKey, Date.now().toString());
  }
  enableRunawayButtons();
}

// Password check
function checkPassword() {
  const input = document.getElementById("passwordInput").value;
  const errorMsg = document.getElementById("errorMsg");

  if (input === correctPassword) {
    document.getElementById("passwordOverlay").style.display = "none";
    document.body.style.overflow = "auto";
  } else {
    wrongAttempts++;
    errorMsg.style.display = "block";

    if (wrongAttempts >= 3 && !isPunishmentActive()) {
      activatePunishment();
    }
  }
}

// Enable Enter key
document.addEventListener("DOMContentLoaded", () => {
  const passwordInput = document.getElementById("passwordInput");
  passwordInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      checkPassword();
    }
  });

  if (isPunishmentActive()) {
    enableRunawayButtons();
  }
});

// Prevent scrolling while overlay is active
// document.body.style.overflow = "hidden";

// Secret key combo: hold 1 and 0 for 3 seconds
let keysHeld = {};
let holdTimer = null;

document.addEventListener("keydown", (e) => {
  keysHeld[e.key] = true;

  if (keysHeld["1"] && keysHeld["0"] && !holdTimer) {
    holdTimer = setTimeout(() => {
      alert("Password is: " + correctPassword);
    }, 3000);
  }
});

document.addEventListener("keyup", (e) => {
  keysHeld[e.key] = false;
  if (holdTimer) {
    clearTimeout(holdTimer);
    holdTimer = null;
  }
});

// Runaway button logic
function enableRunawayButtons() {
  const buttons = document.querySelectorAll("button");
  document.addEventListener("mousemove", (e) => {
    buttons.forEach((btn) => {
      const rect = btn.getBoundingClientRect();
      const distance = Math.hypot(e.clientX - rect.left, e.clientY - rect.top);
      if (distance < 100) {
        const offsetX = (Math.random() - 0.5) * 200;
        const offsetY = (Math.random() - 0.5) * 200;
        btn.style.position = "absolute";
        btn.style.left = Math.min(window.innerWidth - 100, Math.max(0, rect.left + offsetX)) + "px";
        btn.style.top = Math.min(window.innerHeight - 50, Math.max(0, rect.top + offsetY)) + "px";
      }
    });
  });
}

// Detect holding both Shift keys for 3 seconds to stop punishment
let shiftHeld = { left: false, right: false };
let shiftTimer = null;

document.addEventListener("keydown", (e) => {
  if (e.code === "ShiftLeft") shiftHeld.left = true;
  if (e.code === "ShiftRight") shiftHeld.right = true;

  if (shiftHeld.left && shiftHeld.right && !shiftTimer) {
    shiftTimer = setTimeout(() => {
      localStorage.removeItem(punishmentKey);
      alert("Punishment disabled.");
      location.reload(); // Refresh to stop runaway behavior
    }, 3000);
  }
});

document.addEventListener("keyup", (e) => {
  if (e.code === "ShiftLeft") shiftHeld.left = false;
  if (e.code === "ShiftRight") shiftHeld.right = false;

  if (shiftTimer) {
    clearTimeout(shiftTimer);
    shiftTimer = null;
  }
});


// 🔒 Lockout logic
const lockoutKey = "siteLockedUntil";
const now = Date.now();
const lockedUntil = localStorage.getItem(lockoutKey);

// ⛔ If user is locked out
if (lockedUntil && now < parseInt(lockedUntil)) {
  document.body.innerHTML = `
    <h1>Access Denied</h1>
    <p>You are locked out until ${new Date(parseInt(lockedUntil)).toLocaleTimeString()}.</p>
  `;
}

// 🧩 Secret key combo: Hold 1 + 0 for 5 seconds to unlock
let keysPressed = {};
let comboStartTime = null;
const unlockDuration = 5000; // 5 seconds

document.addEventListener("keydown", (e) => {
  keysPressed[e.key] = true;

  // 🔓 Unlock if holding 1 and 0 for 5 seconds
  if (keysPressed["1"] && keysPressed["0"]) {
    if (!comboStartTime) {
      comboStartTime = Date.now();
    } else {
      const elapsed = Date.now() - comboStartTime;
      if (elapsed >= unlockDuration) {
        localStorage.removeItem(lockoutKey);
        alert("🔓 Site unlocked!");
        location.reload();
      }
    }
  }

  // 🔒 Lock if spacebar is pressed
  if (e.key === " ") {
    const oneHourFromNow = now + 60 * 60 * 1000;
    localStorage.setItem(lockoutKey, oneHourFromNow.toString());
    alert("⛔ Site locked for 1 hour!");
    location.reload();
  }
});

document.addEventListener("keyup", (e) => {
  delete keysPressed[e.key];
  comboStartTime = null;
});



