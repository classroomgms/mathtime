const container = document.getElementById('container');
const zoneViewer = document.getElementById('zoneViewer');
let zoneFrame = document.getElementById('zoneFrame');
const searchBar = document.getElementById('searchBar');
const sortOptions = document.getElementById('sortOptions');
const zonesURL = 'https://cdn.jsdelivr.net/gh/classroomgms/mathtime@main/zones.json';
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






