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

async function loadHome() {
  const tbody = document.getElementById('stock-table-body');
  const table = document.getElementById("stock-table");

  if (!tbody) {
    return;
  }

  tbody.innerHTML = "";

  DEFAULT_SYMBOLS.forEach((symbol) => {
    const row = document.createElement('tr');
    row.dataset.symbol = symbol;
    row.innerHTML = `
      <td>${symbol}</td>
      <td colspan="7" class="loading-cell">
        <div class="stock-loading">
          <div class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></div>
          <span>Loading quote...</span>
        </div>
      </td>
    `;
    tbody.appendChild(row);
  });

  try {
    await Promise.all(
      DEFAULT_SYMBOLS.map(async (symbol) => {
        const quote = await getQuote(symbol);
        const row = tbody.querySelector(`tr[data-symbol="${symbol}"]`);

        if (!quote || typeof quote.c !== 'number') {
          throw new RateLimitError('Rate limit reached. Try again in a minute.');
        }

        if (!row) {
          return;
        }

        row.innerHTML = `
          <td>${symbol}</td>
          <td>${quote.c}</td>
          <td>${quote.d}</td>
          <td>${quote.dp}%</td>
          <td>${quote.h}</td>
          <td>${quote.l}</td>
          <td>${quote.o}</td>
          <td>${quote.pc}</td>
        `;
      })
    );
  } catch (err) {
    const errorMessage = document.createElement('p');

    if (err.name === "RateLimitError") {
      errorMessage.textContent = err.message;

    } else {
      errorMessage.textContent = 'Failed to load data.';
    }

    errorMessage.classList.add("error-msg");

    if (table) {
      table.replaceWith(errorMessage);
    } else {
      document.body.appendChild(errorMessage);
    }
  }
}

document.addEventListener('DOMContentLoaded', loadHome);
