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

document.addEventListener("languageChanged", () => {
  document.querySelectorAll(".fav-btn").forEach((button) => {
    button.textContent = translate("home_favorite_button");
  });
});

document.addEventListener('DOMContentLoaded', loadHome);
