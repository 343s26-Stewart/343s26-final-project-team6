const PORTFOLIO_KEY = "stalkstocks_portfolio";
const REPORT_FALLBACKS = [
    { symbol: "AAPL", company: "Apple" },
    { symbol: "DIS", company: "Disney" }
];

document.addEventListener("DOMContentLoaded", () => {
    initializeReportsPage();
});

async function initializeReportsPage() {
    const portfolio = getPortfolio();
    const savedSymbols = Object.keys(portfolio);
    const stocksToRender = savedSymbols.length > 0
        ? savedSymbols.map((symbol) => ({
            symbol,
            company: portfolio[symbol]?.company || symbol
        }))
        : REPORT_FALLBACKS;

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
        history: generateTrendData(fallbackBasePrice, portfolioEntry ? "portfolio" : "watchlist"),
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
            report.history = generateTrendData(quote.c, portfolioEntry ? "portfolio" : "watchlist");
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
            <text class="spark-label" x="${padding.left}" y="${height - 8}">9:30 AM</text>
            <text class="spark-label" x="${width / 2 - 18}" y="${height - 8}">1:00 PM</text>
            <text class="spark-label" x="${width - 66}" y="${height - 8}">4:00 PM</text>
            <polyline class="spark-line" stroke="${lineColor}" points="${polylinePoints}"></polyline>
        </svg>
    `;
}

function generateTrendData(basePrice, profileType) {
    const pointCount = profileType === "portfolio" ? 26 : 22;
    const volatility = profileType === "portfolio" ? 4.4 : 3.2;
    const points = [];
    let currentValue = Number(basePrice) || 100;

    for (let index = 0; index < pointCount; index += 1) {
        const wave = Math.sin(index / 2.8) * (volatility * 0.3);
        const drift = (Math.random() - 0.5) * volatility;
        currentValue = Math.max(1, currentValue + wave + drift);
        points.push(Number(currentValue.toFixed(2)));
    }

    return points;
}

function getPortfolio() {
    const saved = localStorage.getItem(PORTFOLIO_KEY);
    return saved ? JSON.parse(saved) : {};
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
