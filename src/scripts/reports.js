const FAVORITES_KEY = "favorites";
const PORTFOLIO_KEY = "portfolio";
const MARKET_VIEW_KEY = "reports_market_view";

document.addEventListener("DOMContentLoaded", () => {
    initializeMarketViewToggle();
    initializeReportsPage();
});

function initializeMarketViewToggle() {
    const toggleButton = document.querySelector("#market-view-toggle");
    const reportsCard = toggleButton?.closest(".reports-card");

    if (!toggleButton || !reportsCard) {
        return;
    }

    let currentView = getSavedMarketView();
    applyMarketView(reportsCard, toggleButton, currentView);

    toggleButton.addEventListener("click", () => {
        currentView = currentView === "card" ? "list" : "card";
        localStorage.setItem(MARKET_VIEW_KEY, currentView);
        applyMarketView(reportsCard, toggleButton, currentView);
    });
}

async function initializeReportsPage() {
    const savedFavorites = getFavorites();
    const portfolio = getPortfolio();
    const stocksToRender = savedFavorites.map((symbol) => ({
        symbol,
        company: portfolio[symbol]?.company || symbol
    }));

    const marketTable = document.querySelector("#market-report-table");
    const portfolioTable = document.querySelector("#portfolio-report-table");

    try {
        const reportRows = await Promise.all(
            stocksToRender.map(async (stock) => buildStockReport(stock, portfolio[stock.symbol]))
        );

        renderMarketTable(reportRows, marketTable);
        renderPortfolioTable(reportRows, portfolioTable);
        updateTotalGainLoss(reportRows);
    } catch (error) {
        console.error("Failed to build reports page:", error);
        marketTable.innerHTML = `<p class="reports-error">Could not load the report data right now.</p>`;
        portfolioTable.innerHTML = `<p class="reports-error">Could not calculate gain/loss right now.</p>`;
    }
}

async function buildStockReport(stock, portfolioEntry) {
    const fallbackBasePrice = Number(portfolioEntry?.averageCost) || 100;
    const report = {
        symbol: stock.symbol,
        company: stock.company || stock.symbol,
        currentPrice: fallbackBasePrice,
        change24h: 0,
        history: createFallbackTrendData(fallbackBasePrice),
        shares: portfolioEntry?.shares || 0,
        averageCost: portfolioEntry?.averageCost || 0,
        gainLoss: 0
    };

    try {
        const [quote, profile] = await Promise.all([
            getQuote(stock.symbol),
            getProfile(stock.symbol)
        ]);

        if (profile?.name) {
            report.company = simplifyCompanyName(profile.name);
        }

        if (quote && typeof quote.c === "number" && quote.c > 0) {
            report.currentPrice = quote.c;
            report.change24h = typeof quote.d === "number" ? quote.d : quote.c - (quote.pc || quote.c);
            report.history = buildTrendDataFromQuote(quote);
        }
    } catch (error) {
        console.error(`Failed to fetch report data for ${stock.symbol}:`, error);
    }

    report.gainLoss = report.shares * (report.currentPrice - report.averageCost);
    return report;
}

function renderMarketTable(reportRows, container) {
    if (!reportRows.length) {
        container.innerHTML = `<p class="reports-empty">No saved stocks yet. Make a trade in the simulation page to see reports here.</p>`;
        return;
    }

    container.innerHTML = "";

    reportRows.forEach((stock, index) => {
        const row = document.createElement("article");
        row.className = "report-row reports-grid";

        row.innerHTML = `
            <div class="report-cell" data-label="Stock Name">
                <div class="stock-name-block">
                    <span class="stock-company">${stock.company}</span>
                    <span class="stock-symbol">- ${stock.symbol}</span>
                </div>
            </div>
            <div class="report-cell" data-label="Past Month Activity">
                <div class="chart-shell">${createSparklineSVG(stock.history, stock.symbol, index)}</div>
            </div>
            <div class="report-cell" data-label="24 Hour Change">
                <span class="change-value ${stock.change24h >= 0 ? "change-positive" : "change-negative"}">
                    ${formatSignedCurrency(stock.change24h)}
                </span>
            </div>
        `;

        container.appendChild(row);
    });
}

function applyMarketView(reportsCard, toggleButton, view) {
    const isCardView = view === "card";
    reportsCard.classList.toggle("reports-card-view", isCardView);
    toggleButton.textContent = isCardView ? "List View" : "Card View";
    toggleButton.setAttribute("aria-pressed", String(isCardView));
}

function getSavedMarketView() {
    try {
        return localStorage.getItem(MARKET_VIEW_KEY) === "card" ? "card" : "list";
    } catch (error) {
        console.error("Could not read reports view preference:", error);
        return "list";
    }
}

function renderPortfolioTable(reportRows, container) {
    const ownedStocks = reportRows.filter((row) => row.shares > 0);

    if (!ownedStocks.length) {
        container.innerHTML = `<p class="reports-empty">You do not have any saved simulation stocks yet.</p>`;
        return;
    }

    container.innerHTML = "";

    ownedStocks.forEach((stock) => {
        const row = document.createElement("article");
        row.className = "holding-row holdings-grid";

        row.innerHTML = `
            <div class="holding-cell" data-label="Stock Name">
                <p class="holding-name">${stock.company} - ${stock.symbol}</p>
            </div>
            <div class="holding-cell" data-label="Your Loss / Gain">
                <p class="holding-gain ${stock.gainLoss >= 0 ? "gain-positive" : "gain-negative"}">
                    ${formatSignedCurrency(stock.gainLoss)}
                    <span>USD</span>
                </p>
            </div>
        `;

        container.appendChild(row);
    });
}

function updateTotalGainLoss(reportRows) {
    const total = reportRows.reduce((sum, stock) => sum + stock.gainLoss, 0);
    const totalElement = document.querySelector("#total-gain-loss");
    totalElement.textContent = `Total Gain/Loss: ${formatSignedCurrency(total)} USD`;
    totalElement.classList.toggle("gain-positive", total >= 0);
    totalElement.classList.toggle("gain-negative", total < 0);
}

function createSparklineSVG(points, symbol, index) {
    const width = 420;
    const height = 150;
    const padding = { top: 18, right: 18, bottom: 24, left: 22 };
    const min = Math.min(...points);
    const max = Math.max(...points);
    const usableWidth = width - padding.left - padding.right;
    const usableHeight = height - padding.top - padding.bottom;

    const polylinePoints = points.map((value, pointIndex) => {
        const x = padding.left + (pointIndex / (points.length - 1)) * usableWidth;
        const y = padding.top + usableHeight - (((value - min) / (max - min || 1)) * usableHeight);
        return `${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(" ");

    const lineColor = points[points.length - 1] >= points[0] ? "#f4a18d" : "#d7dce5";
    const baselineOne = padding.top + usableHeight * 0.33;
    const baselineTwo = padding.top + usableHeight * 0.66;

    return `
        <svg class="spark-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${symbol} price activity chart ${index + 1}">
            <rect class="spark-bg" x="0" y="0" width="${width}" height="${height}" rx="8"></rect>
            <line class="spark-grid" x1="${padding.left}" y1="${baselineOne}" x2="${width - padding.right}" y2="${baselineOne}"></line>
            <line class="spark-grid" x1="${padding.left}" y1="${baselineTwo}" x2="${width - padding.right}" y2="${baselineTwo}"></line>
            <text class="spark-label" x="${padding.left}" y="${height - 8}">Prev Close</text>
            <text class="spark-label" x="${width / 2 - 18}" y="${height - 8}">Session</text>
            <text class="spark-label" x="${width - 48}" y="${height - 8}">Now</text>
            <polyline class="spark-line" stroke="${lineColor}" points="${polylinePoints}"></polyline>
        </svg>
    `;
}

function buildTrendDataFromQuote(quote) {
    const previousClose = getValidPrice(quote.pc, quote.c);
    const open = getValidPrice(quote.o, previousClose);
    const high = getValidPrice(quote.h, Math.max(open, quote.c || open));
    const low = getValidPrice(quote.l, Math.min(open, quote.c || open));
    const current = getValidPrice(quote.c, open);

    const anchorPoints = [previousClose, open];
    const firstSwing = current >= open ? low : high;
    const secondSwing = current >= open ? high : low;

    anchorPoints.push(firstSwing);

    if (secondSwing !== firstSwing) {
        anchorPoints.push(secondSwing);
    }

    anchorPoints.push(current);

    return interpolateTrendPoints(anchorPoints, 25);
}

function interpolateTrendPoints(anchorPoints, totalPoints) {
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

function createFallbackTrendData(basePrice) {
    const safeBasePrice = getValidPrice(basePrice, 100);
    return interpolateTrendPoints([safeBasePrice, safeBasePrice], 25);
}

function getValidPrice(value, fallback) {
    const amount = Number(value);
    if (Number.isFinite(amount) && amount > 0) {
        return amount;
    }

    return Number(fallback) || 100;
}

function getPortfolio() {
    try {
        const saved = localStorage.getItem(PORTFOLIO_KEY);
        return saved ? JSON.parse(saved) : {};
    } catch (error) {
        console.error("Could not read saved portfolio:", error);
        return {};
    }
}

function getFavorites() {
    try {
        const saved = localStorage.getItem(FAVORITES_KEY);
        if (!saved) {
            return [];
        }

        const parsed = JSON.parse(saved);
        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed
            .map((symbol) => String(symbol).trim().toUpperCase())
            .filter(Boolean);
    } catch (error) {
        console.error("Could not read saved favorites:", error);
        return [];
    }
}

function formatSignedCurrency(value) {
    const amount = Number(value || 0);
    const sign = amount >= 0 ? "+" : "-";
    return `${sign}$${Math.abs(amount).toFixed(2)}`;
}

function simplifyCompanyName(name) {
    return name
        .replace(/\b(incorporated|inc\.?|corporation|corp\.?|company|co\.?|holdings?)\b/gi, "")
        .replace(/\s{2,}/g, " ")
        .trim();
}
