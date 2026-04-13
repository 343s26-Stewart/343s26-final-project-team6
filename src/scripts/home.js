document.addEventListener("DOMContentLoaded", () => {
    setupMobileMenu();
    setupHomePage();
});

const DEFAULT_TICKERS = [
    "AAPL",
    "MSFT",
    "NVDA",
    "AMZN",
    "GOOGL",
    "META",
    "TSLA",
    "JPM"
];

function setupMobileMenu() {
    const navButton = document.querySelector("#nav-menu-button");
    const mobileMenu = document.querySelector("#mobile-menu");

    if (!navButton || !mobileMenu) {
        return;
    }

    navButton.addEventListener("click", () => {
        mobileMenu.classList.toggle("active");
    });
}

function setupHomePage() {
    const searchButton = document.querySelector("#search-button");
    const resetButton = document.querySelector("#reset-button");
    const searchInput = document.querySelector("#stock-search");

    loadDefaultStocks();

    searchButton.addEventListener("click", () => {
        handleSearch();
    });

    resetButton.addEventListener("click", () => {
        searchInput.value = "";
        loadDefaultStocks();
    });

    searchInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            handleSearch();
        }
    });
}

async function loadDefaultStocks() {
    setStatus("Loading default stocks...");
    const stockData = await buildStockRowsFromTickers(DEFAULT_TICKERS);
    renderStocks(stockData);

    if (stockData.length > 0) {
        setStatus("Showing popular stocks.");
    } else {
        setStatus("Could not load stocks right now. Please try again.");
    }
}

async function handleSearch() {
    const searchInput = document.querySelector("#stock-search");
    const searchTerm = searchInput.value.trim();

    if (!searchTerm) {
        setStatus("Please enter a ticker or company name.");
        return;
    }

    setStatus(`Searching for "${searchTerm}"...`);

    try {
        const searchResults = await searchSymbol(searchTerm);

        if (!searchResults || !searchResults.result || searchResults.result.length === 0) {
            renderStocks([]);
            setStatus("No matching stocks were found.");
            return;
        }

        const filteredMatches = searchResults.result
            .filter((item) => item.symbol && item.description)
            .slice(0, 8);

        const tickers = filteredMatches.map((item) => item.symbol);
        const stockData = await buildStockRowsFromTickers(tickers, filteredMatches);

        renderStocks(stockData);

        if (stockData.length > 0) {
            setStatus(`Found ${stockData.length} matching stock${stockData.length === 1 ? "" : "s"}.`);
        } else {
            setStatus("Matches were found, but quote data could not be loaded.");
        }
    } catch (error) {
        console.error("Search failed:", error);
        renderStocks([]);
        setStatus("Something went wrong while searching. Please try again.");
    }
}

async function buildStockRowsFromTickers(tickers, existingResults = []) {
    const stockPromises = tickers.map(async (ticker) => {
        try {
            const quote = await getQuote(ticker);

            if (!quote || typeof quote.c !== "number" || quote.c === 0) {
                return null;
            }

            let companyName = ticker;

            const matchingSearchResult = existingResults.find((item) => item.symbol === ticker);

            if (matchingSearchResult && matchingSearchResult.description) {
                companyName = matchingSearchResult.description;
            } else {
                const profile = await getProfile(ticker);
                if (profile && profile.name) {
                    companyName = profile.name;
                }
            }

            return {
                ticker,
                companyName,
                currentPrice: quote.c,
                openPrice: quote.o,
                highPrice: quote.h,
                lowPrice: quote.l,
                previousClose: quote.pc,
                change: quote.c - quote.pc
            };
        } catch (error) {
            console.error(`Failed to load stock data for ${ticker}:`, error);
            return null;
        }
    });

    const results = await Promise.all(stockPromises);
    return results.filter((item) => item !== null);
}

function renderStocks(stocks) {
    const tableBody = document.querySelector("#stocks-table-body");
    tableBody.innerHTML = "";

    if (!stocks || stocks.length === 0) {
        tableBody.innerHTML = `
      <tr>
        <td colspan="9" class="placeholder-cell">No stock data to display.</td>
      </tr>
    `;
        return;
    }

    stocks.forEach((stock) => {
        const row = document.createElement("tr");

        const changeClass = stock.change >= 0 ? "positive-change" : "negative-change";
        const formattedChange = formatCurrency(stock.change);

        row.innerHTML = `
      <td>${stock.ticker}</td>
      <td>${stock.companyName}</td>
      <td>${formatCurrency(stock.currentPrice)}</td>
      <td>${formatCurrency(stock.openPrice)}</td>
      <td>${formatCurrency(stock.highPrice)}</td>
      <td>${formatCurrency(stock.lowPrice)}</td>
      <td>${formatCurrency(stock.previousClose)}</td>
      <td class="${changeClass}">${formattedChange}</td>
      <td>
        <button
          class="trade-button"
          type="button"
          data-symbol="${stock.ticker}"
          data-price="${stock.currentPrice}"
          data-company="${stock.companyName}"
        >
          Trade
        </button>
      </td>
    `;

        tableBody.appendChild(row);
    });

    const tradeButtons = document.querySelectorAll(".trade-button");
    tradeButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const symbol = button.dataset.symbol;
            const price = button.dataset.price;
            const company = button.dataset.company;

            const queryString = new URLSearchParams({
                symbol,
                price,
                company
            }).toString();

            window.location.href = `simulation.html?${queryString}`;
        });
    });
}

function formatCurrency(value) {
    return `$${Number(value).toFixed(2)}`;
}

function setStatus(message) {
    const statusText = document.querySelector("#search-status");
    statusText.textContent = message;
}