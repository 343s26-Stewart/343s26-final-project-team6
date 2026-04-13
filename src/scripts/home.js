const DEFAULT_SYMBOLS = [
  "AAPL", "GOOGL", "MSFT", "AMZN", "META",
  "TSLA", "NVDA", "JPM", "V", "JNJ"
];

async function loadHome() {
  const tbody = document.getElementById('stock-table-body');

  const quotes = await Promise.all(
    DEFAULT_SYMBOLS.map(symbol => 
      getQuote(symbol).then(quote => ({ symbol, quote }))
    )
  );

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
}

document.addEventListener('DOMContentLoaded', loadHome);
