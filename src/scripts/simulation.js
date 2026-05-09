document.addEventListener("DOMContentLoaded", () => {
    setupTradeButtons();
    setupChatbot();
    initializeSimulationPage();
});

const DEFAULT_WATCHLIST = ["AAPL", "MSFT", "NVDA", "TSLA"];

let currentSymbol = "AAPL";
let currentCompany = "Apple Inc";
let currentQuote = null;

function translate(key, params = {}) {
    if (window.I18N?.t) {
        return window.I18N.t(key, params);
    }
    return key;
}

function setupTradeButtons() {
    const buyButton = document.querySelector("#buy-button");
    const sellButton = document.querySelector("#sell-button");
    const shareInput = document.querySelector("#share-input");

    buyButton.addEventListener("click", () => executeTrade("buy"));
    sellButton.addEventListener("click", () => executeTrade("sell"));
    shareInput.addEventListener("input", updateTradeTotal);
}

function updateTradeTotal() {
    const shares = Number(document.querySelector("#share-input").value) || 0;
    const price = currentQuote?.c || 0;

    document.querySelector("#trade-total").textContent = formatCurrency(shares * price);
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
    setTradeStatus(translate("simulation_loading_stock"));

    try {
        currentSymbol = symbol;
        currentCompany = companyName;

        const quote = await getQuote(symbol);

        if (!quote || typeof quote.c !== "number" || quote.c === 0) {
            setTradeStatus(translate("simulation_load_quote_error"));
            return;
        }

        currentQuote = quote;

        const profile = await getProfile(symbol);
        if (profile && profile.name) {
            currentCompany = profile.name;
        }

        updatePageStockInfo();
        await loadChartForCurrentSymbol();
        updatePortfolioSummary();
        renderTradeLog();

        setTradeStatus(translate("simulation_loaded_symbol", { symbol: currentSymbol }));
    } catch (error) {
        console.error("Error loading simulation stock:", error);
        setTradeStatus(translate("simulation_load_general_error"));
    }
}

function updatePageStockInfo() {
    document.querySelector("#stock-title").textContent = `${currentCompany} (${currentSymbol})`;
    document.querySelector("#stock-subtitle").textContent = translate("simulation_subtitle");
    document.querySelector("#current-price").textContent = formatCurrency(currentQuote.c);

    document.querySelector("#side-symbol").textContent = currentSymbol;
    document.querySelector("#side-company").textContent = currentCompany;
    document.querySelector("#open-price").textContent = formatCurrency(currentQuote.o);
    document.querySelector("#high-price").textContent = formatCurrency(currentQuote.h);
    document.querySelector("#low-price").textContent = formatCurrency(currentQuote.l);
    document.querySelector("#prev-close-price").textContent = formatCurrency(currentQuote.pc);

    updateTradeTotal();
}

async function loadChartForCurrentSymbol() {
    if (!currentQuote) {
        return;
    }

    const chartData = buildQuoteBasedChartData(currentQuote);

    if (!chartData || chartData.prices.length < 2) {
        setTradeStatus(translate("simulation_chart_unavailable", { symbol: currentSymbol }));
        return;
    }

    drawChart(chartData.prices, chartData.isUptrending);
    setTradeStatus(translate("simulation_showing_trend", {
        range: "",
        symbol: currentSymbol
    }));
}

function buildQuoteBasedChartData(quote) {
    if (!quote) {
        return null;
    }

    const previousClose = getValidPrice(quote.pc, quote.c);
    const open = getValidPrice(quote.o, previousClose);
    const high = getValidPrice(quote.h, Math.max(open, quote.c || open));
    const low = getValidPrice(quote.l, Math.min(open, quote.c || open));
    const current = getValidPrice(quote.c, open);

    const monthStart = previousClose * 0.96;
    const monthLow = Math.min(low, monthStart);
    const monthHigh = Math.max(high, current * 1.015);

    const anchorPoints = buildQuoteAnchors(
        monthStart,
        previousClose,
        open,
        monthLow,
        monthHigh,
        current
    );

    const prices = interpolateTrendPoints(anchorPoints, 25);

    if (!prices || prices.length < 2) {
        return null;
    }

    return {
        prices,
        isUptrending: current >= previousClose
    };
}

function buildQuoteAnchors(...values) {
    return values
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value) && value > 0);
}

function interpolateTrendPoints(anchorPoints, totalPoints) {
    if (anchorPoints.length === 0) {
        return [];
    }

    if (anchorPoints.length === 1) {
        return Array.from({ length: totalPoints }, () => anchorPoints[0]);
    }

    const points = [];

    for (let index = 0; index < totalPoints; index += 1) {
        const progress = (index / (totalPoints - 1)) * (anchorPoints.length - 1);
        const leftIndex = Math.floor(progress);
        const rightIndex = Math.min(anchorPoints.length - 1, leftIndex + 1);
        const segmentProgress = progress - leftIndex;

        const leftValue = anchorPoints[leftIndex];
        const rightValue = anchorPoints[rightIndex];
        const value = leftValue + ((rightValue - leftValue) * segmentProgress);

        points.push(Number(value.toFixed(2)));
    }

    return points;
}

function getValidPrice(value, fallback) {
    const amount = Number(value);

    if (Number.isFinite(amount) && amount > 0) {
        return amount;
    }

    return Number(fallback) || 100;
}

function drawChart(prices, isUptrending) {
    const chartLine = document.querySelector("#chart-line");

    if (!chartLine || !Array.isArray(prices) || prices.length < 2) {
        return;
    }

    const points = prices
        .map((price) => Number(price))
        .filter((price) => Number.isFinite(price) && price > 0);

    if (points.length < 2) {
        return;
    }

    const min = Math.min(...points);
    const max = Math.max(...points);

    const chartTop = 50;  
    const chartBottom = 260;
    const chartLeft = 70;
    const chartRight = 740;

    const chartHeight = chartBottom - chartTop;
    const chartWidth = chartRight - chartLeft;
    const priceRange = max - min || 1;

    const pointString = points
        .map((price, index) => {
            const x = chartLeft + (index / (points.length - 1)) * chartWidth;
            const y = chartBottom - ((price - min) / priceRange) * chartHeight;

            return `${x.toFixed(2)},${y.toFixed(2)}`;
        }) 
        .join(" ");

    const lineColor = isUptrending ? "#22c55e" : "#ef4444";

    chartLine.setAttribute("points", pointString);
    chartLine.setAttribute("fill", "none");
    chartLine.setAttribute("stroke", lineColor);
    chartLine.setAttribute("stroke-width", "4");
    chartLine.setAttribute("stroke-linecap", "round");
    chartLine.setAttribute("stroke-linejoin", "round");

    document.querySelector("#chart-max-label").textContent = max.toFixed(2);
    document.querySelector("#chart-mid-top-label").textContent = (min + priceRange * 0.67).toFixed(2);
    document.querySelector("#chart-mid-bottom-label").textContent = (min + priceRange * 0.33).toFixed(2);
    document.querySelector("#chart-min-label").textContent = min.toFixed(2);

    clearChartTimeLabels();
}

function clearChartTimeLabels() {
    const labels = Array.from(document.querySelectorAll("#price-chart .time-label"));

    labels.forEach((label) => {
        label.textContent = "";
    });
}

async function renderWatchlist() {
    const watchlistContainer = document.querySelector("#watchlist");
    watchlistContainer.innerHTML = `<p class="empty-message">${translate("simulation_loading_watchlist")}</p>`;

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
        watchlistContainer.innerHTML = `<p class="empty-message">${translate("simulation_watchlist_error")}</p>`;
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
        <button class="watchlist-load" type="button">${translate("simulation_watchlist_load")}</button>
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

    const shares = Number(shareInput.value);
    const tradePrice = currentQuote?.c;

    if (!shares || shares <= 0) {
        setTradeStatus(translate("simulation_invalid_shares"));
        return;
    }

    if (!tradePrice || tradePrice <= 0) {
        setTradeStatus(translate("simulation_no_price"));
        return;
    }

    const portfolio = getPortfolio();

    const existingPosition = portfolio[currentSymbol] || {
        symbol: currentSymbol,
        company: currentCompany,
        shares: 0,
        averageCost: 0
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
            setTradeStatus(translate("simulation_cannot_sell"));
            return;
        }

        existingPosition.shares -= shares;

        if (existingPosition.shares === 0) {
            existingPosition.averageCost = 0;
        }
    }

    existingPosition.company = currentCompany;
    portfolio[currentSymbol] = existingPosition;

    savePortfolio(portfolio);
    newTransaction(currentSymbol, type, shares, tradePrice);

    updatePortfolioSummary();
    renderTradeLog();

    setTradeStatus(
        translate("simulation_trade_done", {
            action: type === "buy" ? translate("simulation_trade_bought") : translate("simulation_trade_sold"),
            shares,
            plural: shares === 1 ? "" : "s",
            symbol: currentSymbol
        })
    );
}

function updatePortfolioSummary() {
    const portfolio = getPortfolio();
    const position = portfolio[currentSymbol] || { shares: 0, averageCost: 0 };

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
    const trades = getTransactions()
        .filter((trade) => trade.symbol === currentSymbol)
        .reverse()
        .slice(0, 6);

    if (trades.length === 0) {
        tradeLog.innerHTML = `<p class="empty-message">${translate("simulation_no_trades")}</p>`;
        return;
    }

    tradeLog.innerHTML = "";

    trades.forEach((trade) => {
        const item = document.createElement("div");
        item.className = "trade-log-item";

        item.innerHTML = `
      <div class="trade-log-left">
        <strong>${trade.type.toUpperCase()} ${trade.shares} share${trade.shares === 1 ? "" : "s"}</strong>
        <span>${formatCurrency(trade.price)} each</span>
      </div>
      <div class="trade-log-right">${new Date(trade.date).toLocaleString()}</div>
    `;

        tradeLog.appendChild(item);
    });
}

async function sendChatMessage() {
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

    input.value = "";

    const botBubble = document.createElement("div");
    botBubble.className = "bot-message";
    botBubble.textContent = "...";
    messages.appendChild(botBubble);
    messages.scrollTop = messages.scrollHeight;

    try {
        const reply = await generateResponse(text);
        botBubble.textContent = reply;
    } catch (error) {
        botBubble.textContent = translate("simulation_chat_error");
        console.error("Chatbot error:", error);
    }

    messages.scrollTop = messages.scrollHeight;
}

function formatCurrency(value) {
    return `$${Number(value || 0).toFixed(2)}`;
}

function setTradeStatus(message) {
    document.querySelector("#trade-status").textContent = message;
}

document.addEventListener("languageChanged", () => {
    if (currentQuote) {
        updatePageStockInfo();
    }
    renderTradeLog();
    renderWatchlist();
});
