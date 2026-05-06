// 10 default stocks to display on home page.
const DEFAULT_SYMBOLS = [
  "AAPL", "GOOGL", "MSFT", "AMZN", "META",
  "TSLA", "NVDA", "JPM", "V", "JNJ"
];

// Custom error for rate limiting
class RateLimitError extends Error {
  constructor(message) {
    super(message);
    this.name = "RateLimitError";
  }
}

function translate(key, params = {}) {
  if (window.I18N?.t) {
    return window.I18N.t(key, params);
  }
  return key;
}


// Upon favorite button click, add class to change styling of button
function updateFavoriteIcon(button, isFavorite) {
  if (isFavorite) {
    button.classList.add("favorited");
  } else {
    button.classList.remove("favorited");
  }
}

async function loadHome() {
  const tbody = document.getElementById('stock-table-body');

  // Clear existing content and add loading rows
  tbody.innerHTML = "";
  for (const symbol of DEFAULT_SYMBOLS) {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${symbol}</td>
      <td><div class="spinner"></div></td>
      <td><div class="spinner"></div></td>
      <td><div class="spinner"></div></td>
      <td><div class="spinner"></div></td>
      <td><div class="spinner"></div></td>
      <td><div class="spinner"></div></td>
      <td><div class="spinner"></div></td>
      <td><div class="spinner"></div></td>
    `;
    tbody.appendChild(row);
  }

  //Populates quotes var with stock price information
  try {
    const quotes = await Promise.all(
      DEFAULT_SYMBOLS.map(async (symbol) => {
        // Get quote calls Finnhub API for pricing info
        const quote = await getQuote(symbol);

        //Rate limit check
        if (!quote || typeof quote.c !== 'number') {
          throw new RateLimitError(translate("home_rate_limit"));
        }

        return { symbol, quote };
      })
    );

    tbody.innerHTML = "";

    //Populate HTML table with stock information
    for (const { symbol, quote } of quotes) {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${symbol}</td>
        <td>${quote.c.toFixed(2)}</td>
        <td>${quote.d.toFixed(2)}</td>
        <td>${quote.dp.toFixed(2)}%</td>
        <td>${quote.h.toFixed(2)}</td>
        <td>${quote.l.toFixed(2)}</td>
        <td>${quote.o.toFixed(2)}</td>
        <td>${quote.pc.toFixed(2)}</td>
        <td><button class="fav-btn">${translate("home_favorite_button")}</button></td>
      `;

      const favBtn = row.querySelector(".fav-btn");
      //Check if stock is a favorite and update button style accordingly
      updateFavoriteIcon(favBtn, getFavorites().includes(symbol));

      //If click toggle favorite button style and add to localStorage.
      favBtn.addEventListener("click", () => {
        toggleFavorite(symbol);
        updateFavoriteIcon(favBtn, getFavorites().includes(symbol));
      });

      tbody.appendChild(row);
    }
    //Error checking
  } catch (err) {
    const table = document.getElementById("stock-table");
    const errorMessage = document.createElement('p');

    if (err.name === "RateLimitError") {
      errorMessage.textContent = err.message;

    } else {
      errorMessage.textContent = translate("home_error_load");
    }

    errorMessage.classList.add("error-msg");

    if (table) {
      table.replaceWith(errorMessage);
    } else {
      document.body.appendChild(errorMessage);
    }
  }
}

async function runSearch() {
  const input = document.getElementById("stock-search-input");
  const message = document.getElementById("search-message");
  const tbody = document.getElementById("stock-table-body");

  const query = input.value.trim();

  if (!query) {
    setDefaultTableMode();
    loadHome();
    return;
  }

  setSearchTableMode();
  message.textContent = "Searching...";
  tbody.innerHTML = "";

  try {
    const results = await searchSymbol(query);

    if (!results.result || results.result.length === 0) {
      message.textContent = "Invalid search";
      return;
    }

    // Use first result only (API limits)
    const match = results.result[0];
    const symbol = match.symbol;

    const [profile, quote] = await Promise.all([
      getProfile(symbol),
      getQuote(symbol)
    ]);

    if (!profile || !profile.ticker) {
      message.textContent = "Invalid search";
      return;
    }

    message.textContent = "";

    tbody.innerHTML = "";

   const row = document.createElement("tr");

row.innerHTML = `
  <td>
    <div style="display:flex; align-items:center; gap:10px;">
      <img src="${profile.logo}" width="28" height="28"
           style="border-radius:50%; background:white; object-fit:contain;">
      <div>
        <div style="font-weight:600;">${profile.name}</div>
        <div style="font-size:12px;color:#94a3b8;">${profile.ticker}</div>
      </div>
    </div>
  </td>

  <td>${profile.finnhubIndustry || "—"}</td>
  <td>${profile.exchange || "—"}</td>

  <td>${quote.c ? quote.c.toFixed(2) : "—"}</td>

  <td>
    <a href="${profile.weburl}" target="_blank"
       style="color:#4ade80; text-decoration:none;">
      Visit →
    </a>
  </td>

  <td>
    <button class="fav-btn">
      ${translate("home_favorite_button")}
    </button>
  </td>
`;

    const favBtn = row.querySelector(".fav-btn");

    updateFavoriteIcon(
      favBtn,
      getFavorites().includes(symbol)
    );

    favBtn.addEventListener("click", () => {
      toggleFavorite(symbol);
      updateFavoriteIcon(
        favBtn,
        getFavorites().includes(symbol)
      );
    });

    tbody.appendChild(row);

  } catch (err) {
    message.textContent = "Invalid search";
  }
}

function setupSearch() {
  const input = document.getElementById("stock-search-input");
  const searchBtn = document.getElementById("stock-search-btn");
  const clearBtn = document.getElementById("stock-clear-btn");

  searchBtn.addEventListener("click", runSearch);

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      runSearch();
    }
  });

  clearBtn.addEventListener("click", () => {
  input.value = "";
  document.getElementById("search-message").textContent = "";

  setDefaultTableMode();
  loadHome();
});
}

function setSearchTableMode() {
  const headerRow = document.querySelector("#stock-table thead tr:nth-child(2)");
  const titleRow = document.getElementById("stock-table-header");

  titleRow.innerHTML = `<td colspan="6">Search Result</td>`;

  headerRow.innerHTML = `
    <th>Company</th>
    <th>Industry</th>
    <th>Exchange</th>
    <th>Price</th>
    <th>Website</th>
    <th>Favorite</th>
  `;
}

function setDefaultTableMode() {
  const headerRow = document.querySelectorAll("#stock-table thead tr")[1];
  const titleRow = document.getElementById("stock-table-header");

  if (!headerRow || !titleRow) return;

  titleRow.innerHTML = `<td colspan="9">Popular Stocks</td>`;

  headerRow.innerHTML = `
    <th>Symbol</th>
    <th>Price</th>
    <th>Change</th>
    <th>% Change</th>
    <th>High</th>
    <th>Low</th>
    <th>Open</th>
    <th>Prev Close</th>
    <th>Favorite</th>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  setDefaultTableMode();
  loadHome();
  setupSearch();
});

