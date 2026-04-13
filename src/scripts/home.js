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

  try {
    const quotes = await Promise.all(
      DEFAULT_SYMBOLS.map(async (symbol) => {
        const quote = await getQuote(symbol);

        if (!quote || typeof quote.c !== 'number') {
          throw new RateLimitError('Rate limit reached. Try again in a minute.');
        }

        return { symbol, quote };
      })
    );

    tbody.innerHTML = "";

    for (const { symbol, quote } of quotes) {
      const row = document.createElement('tr');
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
      tbody.appendChild(row);
    }

  } catch (err) {
    const table = document.getElementById("stock-table");
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