document.addEventListener("DOMContentLoaded", () => {
    setupMobileMenu();
    setupChartFilterButtons();
    setupTradeButtons();
    setupChatbot();
    initializeSimulationPage();
});

const DEFAULT_WATCHLIST = ["AAPL", "MSFT", "NVDA", "TSLA"];
const PORTFOLIO_KEY = "stalkstocks_portfolio";

let currentSymbol = "AAPL";
let currentCompany = "Apple Inc";
let currentQuote = null;
let currentChartRange = "1D";

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

function setupChartFilterButtons() {
    const buttons = document.querySelectorAll(".chart-filter");

    buttons.forEach((button) => {
        button.addEventListener("click", () => {
            buttons.forEach((item) => item.classList.remove("active"));
            button.classList.add("active");
            currentChartRange = button.dataset.range;
            if (currentQuote) {
                drawChart(currentQuote.c, currentChartRange);
            }
        });
    });
}

function setupTradeButtons() {
    const buyButton = document.querySelector("#buy-button");
    const sellButton = document.querySelector("#sell-button");

    buyButton.addEventListener("click", () => executeTrade("buy"));
    sellButton.addEventListener("click", () => executeTrade("sell"));
}

function setupChatbot() {
    const chatbotToggle = document.querySelector("#chatbot-toggle");
    const chatbotPanel = document.querySelector("#chatbot-panel");
    const chatbotClose = document.querySelector("#chatbot-close");
    const chatbotSend = document.querySelector("#chatbot-send");
    const chatbotInput = document.querySelector("#chatbot-input");

    chatbotToggle.addEventListener("click", () => {
        const isOpen = chatbotPanel.classList.toggle("open");
        chatbotPanel.setAttribute("aria-hidden", String(!isOpen));
        chatbotToggle.setAttribute("aria-expanded", String(isOpen));
    });

    chatbotClose.addEventListener("click", () => {
        chatbotPanel.classList.remove("open");
        chatbotPanel.setAttribute("aria-hidden", "true");
        chatbotToggle.setAttribute("aria-expanded", "false");
    });

    chatbotSend.addEventListener("click", sendChatMessage);

    chatbotInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            sendChatMessage();
        }
    });
}

async function initializeSimulationPage() {
    const params = new URLSearchParams(window.location.search);
    currentSymbol = params.get("symbol") || "AAPL";
    currentCompany = params.get("company") || currentSymbol;

    await loadStockData(currentSymbol, currentCompany);
    await renderWatchlist();
}

async function loadStockData(symbol, companyName = symbol) {
    setTradeStatus("Loading stock data...");

    try {
        currentSymbol = symbol;
        currentCompany = companyName;

        const quote = await getQuote(symbol);

        if (!quote || typeof quote.c !== "number" || quote.c === 0) {
            setTradeStatus("Could not load stock quote.");
            return;
        }

        currentQuote = quote;

        const profile = await getProfile(symbol);
        if (profile && profile.name) {
            currentCompany = profile.name;
        }

        updatePageStockInfo();
        drawChart(currentQuote.c, currentChartRange);
        updatePortfolioSummary();
        renderTradeLog();

        setTradeStatus(`Loaded ${currentSymbol}.`);
    } catch (error) {
        console.error("Error loading simulation stock:", error);
        setTradeStatus("Something went wrong while loading this stock.");
    }
}

function updatePageStockInfo() {
    document.querySelector("#stock-title").textContent = `${currentCompany} (${currentSymbol})`;
    document.querySelector("#stock-subtitle").textContent = "Quote and simulated activity";
    document.querySelector("#current-price").textContent = formatCurrency(currentQuote.c);

    document.querySelector("#side-symbol").textContent = currentSymbol;
    document.querySelector("#side-company").textContent = currentCompany;
    document.querySelector("#open-price").textContent = formatCurrency(currentQuote.o);
    document.querySelector("#high-price").textContent = formatCurrency(currentQuote.h);
    document.querySelector("#low-price").textContent = formatCurrency(currentQuote.l);
    document.querySelector("#prev-close-price").textContent = formatCurrency(currentQuote.pc);

    document.querySelector("#price-input").value = Number(currentQuote.c).toFixed(2);
}

function drawChart(basePrice, range) {
    const chartLine = document.querySelector("#chart-line");
    const points = generateTrendData(basePrice, range);

    const min = Math.min(...points);
    const max = Math.max(...points);
    const chartTop = 50;
    const chartBottom = 260;
    const chartLeft = 70;
    const chartRight = 740;
    const chartHeight = chartBottom - chartTop;
    const chartWidth = chartRight - chartLeft;

    const pointString = points
        .map((price, index) => {
            const x = chartLeft + (index / (points.length - 1)) * chartWidth;
            const y =
                chartBottom - ((price - min) / (max - min || 1)) * chartHeight;
            return `${x},${y}`;
        })
        .join(" ");

    chartLine.setAttribute("points", pointString);

    const lineColor =
        points[points.length - 1] >= points[0] ? "#4ade80" : "#f59e94";
    chartLine.setAttribute("stroke", lineColor);

    document.querySelector("#chart-max-label").textContent = max.toFixed(2);
    document.querySelector("#chart-mid-top-label").textContent = (min + (max - min) * 0.67).toFixed(2);
    document.querySelector("#chart-mid-bottom-label").textContent = (min + (max - min) * 0.33).toFixed(2);
    document.querySelector("#chart-min-label").textContent = min.toFixed(2);
}

function generateTrendData(basePrice, range) {
    const counts = {
        "1D": 28,
        "1W": 22,
        "1M": 26
    };

    const volatility = {
        "1D": 0.9,
        "1W": 2.4,
        "1M": 5.5
    };

    const totalPoints = counts[range] || 28;
    const movementSize = volatility[range] || 0.9;
    const points = [];

    let currentValue = Number(basePrice);

    for (let i = 0; i < totalPoints; i += 1) {
        const drift = (Math.random() - 0.5) * movementSize;
        currentValue = Math.max(1, currentValue + drift);
        points.push(Number(currentValue.toFixed(2)));
    }

    return points;
}

async function renderWatchlist() {
    const watchlistContainer = document.querySelector("#watchlist");
    watchlistContainer.innerHTML = `<p class="empty-message">Loading watchlist...</p>`;

    const watchlistItems = [];

    for (const symbol of DEFAULT_WATCHLIST) {
        try {
            const quote = await getQuote(symbol);
            const profile = await getProfile(symbol);

            if (quote && typeof quote.c === "number" && quote.c !== 0) {
                watchlistItems.push({
                    symbol,
                    company: profile?.name || symbol,
                    price: quote.c
                });
            }
        } catch (error) {
            console.error(`Failed to load watchlist item ${symbol}:`, error);
        }
    }

    if (watchlistItems.length === 0) {
        watchlistContainer.innerHTML = `<p class="empty-message">Could not load watchlist.</p>`;
        return;
    }

    watchlistContainer.innerHTML = "";

    watchlistItems.forEach((item) => {
        const wrapper = document.createElement("div");
        wrapper.className = "watchlist-item";

        wrapper.innerHTML = `
      <div class="watchlist-left">
        <span class="watchlist-symbol">${item.symbol}</span>
        <span class="watchlist-company">${item.company}</span>
      </div>
      <div>
        <div>${formatCurrency(item.price)}</div>
        <button class="watchlist-load" type="button">Load</button>
      </div>
    `;

        const loadButton = wrapper.querySelector(".watchlist-load");
        loadButton.addEventListener("click", async () => {
            await loadStockData(item.symbol, item.company);
        });

        watchlistContainer.appendChild(wrapper);
    });
}

function executeTrade(type) {
    const shareInput = document.querySelector("#share-input");
    const priceInput = document.querySelector("#price-input");

    const shares = Number(shareInput.value);
    const tradePrice = Number(priceInput.value);

    if (!shares || shares <= 0) {
        setTradeStatus("Enter a valid number of shares.");
        return;
    }

    if (!tradePrice || tradePrice <= 0) {
        setTradeStatus("Enter a valid trade price.");
        return;
    }

    const portfolio = getPortfolio();
    const existingPosition = portfolio[currentSymbol] || {
        symbol: currentSymbol,
        company: currentCompany,
        shares: 0,
        averageCost: 0,
        trades: []
    };

    if (type === "buy") {
        const currentCostBasis = existingPosition.shares * existingPosition.averageCost;
        const additionalCost = shares * tradePrice;
        const newShareTotal = existingPosition.shares + shares;
        const newAverageCost = (currentCostBasis + additionalCost) / newShareTotal;

        existingPosition.shares = newShareTotal;
        existingPosition.averageCost = Number(newAverageCost.toFixed(2));
    } else {
        if (shares > existingPosition.shares) {
            setTradeStatus("You cannot sell more shares than you own.");
            return;
        }

        existingPosition.shares -= shares;

        if (existingPosition.shares === 0) {
            existingPosition.averageCost = 0;
        }
    }

    existingPosition.company = currentCompany;
    existingPosition.trades.unshift({
        type,
        shares,
        price: tradePrice,
        date: new Date().toLocaleString()
    });

    portfolio[currentSymbol] = existingPosition;
    savePortfolio(portfolio);

    updatePortfolioSummary();
    renderTradeLog();
    setTradeStatus(
        `${type === "buy" ? "Bought" : "Sold"} ${shares} share${shares === 1 ? "" : "s"} of ${currentSymbol}.`
    );
}

function updatePortfolioSummary() {
    const portfolio = getPortfolio();
    const position = portfolio[currentSymbol] || {
        shares: 0,
        averageCost: 0,
        trades: []
    };

    document.querySelector("#owned-shares").textContent = position.shares;
    document.querySelector("#average-cost").textContent = formatCurrency(position.averageCost || 0);

    const pnlValue = document.querySelector("#pnl-value");
    const pnl = position.shares * ((currentQuote?.c || 0) - (position.averageCost || 0));

    pnlValue.textContent = formatCurrency(pnl);
    pnlValue.classList.remove("pnl-positive", "pnl-negative");

    if (pnl > 0) {
        pnlValue.classList.add("pnl-positive");
    } else if (pnl < 0) {
        pnlValue.classList.add("pnl-negative");
    }
}

function renderTradeLog() {
    const tradeLog = document.querySelector("#trade-log");
    const portfolio = getPortfolio();
    const position = portfolio[currentSymbol];

    if (!position || !position.trades || position.trades.length === 0) {
        tradeLog.innerHTML = `<p class="empty-message">No trades yet for this stock.</p>`;
        return;
    }

    tradeLog.innerHTML = "";

    position.trades.slice(0, 6).forEach((trade) => {
        const item = document.createElement("div");
        item.className = "trade-log-item";

        item.innerHTML = `
      <div class="trade-log-left">
        <strong>${trade.type.toUpperCase()} ${trade.shares} share${trade.shares === 1 ? "" : "s"}</strong>
        <span>${formatCurrency(trade.price)} each</span>
      </div>
      <div class="trade-log-right">${trade.date}</div>
    `;

        tradeLog.appendChild(item);
    });
}

function sendChatMessage() {
    const input = document.querySelector("#chatbot-input");
    const messages = document.querySelector("#chatbot-messages");
    const text = input.value.trim();

    if (!text) {
        return;
    }

    const userBubble = document.createElement("div");
    userBubble.className = "user-message";
    userBubble.textContent = text;
    messages.appendChild(userBubble);

    const botBubble = document.createElement("div");
    botBubble.className = "bot-message";
    botBubble.textContent = buildBotReply(text);
    messages.appendChild(botBubble);

    input.value = "";
    messages.scrollTop = messages.scrollHeight;
}

function buildBotReply(userText) {
    const question = userText.toLowerCase();

    if (question.includes("pnl")) {
        return "PnL means profit and loss. It compares your average cost to the current stock price based on how many shares you own.";
    }

    if (question.includes("buy")) {
        return "When you buy shares, your position increases and your average cost may change depending on the trade price.";
    }

    if (question.includes("sell")) {
        return "When you sell shares, your total shares go down. In this simulator, your average cost stays tied to the shares you still own.";
    }

    if (question.includes("risk")) {
        return "A simple way to think about risk is price volatility. Stocks that swing more can create bigger gains, but also bigger losses.";
    }

    return `This simulator is showing ${currentSymbol} at ${formatCurrency(currentQuote?.c || 0)}. You can buy or sell shares and track your simulated PnL.`;
}

function getPortfolio() {
    const saved = localStorage.getItem(PORTFOLIO_KEY);
    return saved ? JSON.parse(saved) : {};
}

function savePortfolio(portfolio) {
    localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(portfolio));
}

function formatCurrency(value) {
    return `$${Number(value || 0).toFixed(2)}`;
}

function setTradeStatus(message) {
    document.querySelector("#trade-status").textContent = message;
}