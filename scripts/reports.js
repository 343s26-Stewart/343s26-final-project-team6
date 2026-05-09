const FAVORITES_KEY = "favorites";
const PORTFOLIO_KEY = "portfolio";
const MARKET_VIEW_KEY = "reports_market_view";
let currentReportRows = [];
let currentMarketView = "list";

function translate(key, params = {}) {
    if (window.I18N?.t) {
        return window.I18N.t(key, params);
    }
    return key;
}

document.addEventListener("DOMContentLoaded", () => {
    insertExportButton();
    initializeMarketViewToggle();
    initializeReportsPage();
});


// adds in functionality to the export button
function insertExportButton() {
    const reportsPage = document.querySelector(".reports-page");

    // if its not yet loaded return
    if (!reportsPage) {
        return;
    }

    // create the export page button
    const actionBar = document.createElement("div");
    actionBar.className = "reports-page-actions";

    const exportButton = document.createElement("button");
    exportButton.id = "export-reports-button";
    exportButton.className = "page-action-button";
    exportButton.type = "button";
    exportButton.textContent = translate("reports_export_json");

    // When the export button is clicked,
    exportButton.addEventListener("click", () => {

        // format of the JSON obj and put in data
        const jsonObj = {
            exportedAt: new Date().toISOString(),
            totalGainLoss: currentReportRows.reduce((sum, stock) => sum + stock.gainLoss, 0),
            savedStocks: currentReportRows.map((stock) => ({
                symbol: stock.symbol,
                company: stock.company,
                currentPrice: stock.currentPrice,
                change24h: stock.change24h,
                history: stock.history
            })),
            portfolioHoldings: currentReportRows
                .filter((stock) => stock.shares > 0)
                .map((stock) => ({
                    symbol: stock.symbol,
                    company: stock.company,
                    shares: stock.shares,
                    averageCost: stock.averageCost,
                    currentPrice: stock.currentPrice,
                    gainLoss: stock.gainLoss
                }))
        };

        // make the exported data a string
        const data = JSON.stringify(jsonObj, null, 2);
        const blob = new Blob([data], { type: "application/json" });
        const jsonObjectUrl = URL.createObjectURL(blob);
        
        // create file
        const filename = `reports-export-${formatExportDate(new Date())}.json`;
        const anchorEl = document.createElement("a");

        // actually download the file
        anchorEl.href = jsonObjectUrl;
        anchorEl.download = filename;
        anchorEl.click();

        URL.revokeObjectURL(jsonObjectUrl);
    });

    // add the element to the page
    actionBar.appendChild(exportButton);
    reportsPage.prepend(actionBar);
}

// goes into local storage and applies either the list or card mode view
function initializeMarketViewToggle() {

    // get elements
    const toggleButton = document.querySelector("#market-view-toggle");
    const reportsCard = toggleButton?.closest(".reports-card");

    // if elements are not there then just return
    if (!toggleButton || !reportsCard) {
        return;
    }

    // get list or card view, apply it
    currentMarketView = getSavedMarketView();
    applyMarketView(reportsCard, toggleButton, currentMarketView);

    // when clicked, set local storage to either card or list
    toggleButton.addEventListener("click", () => {
        currentMarketView = currentMarketView === "card" ? "list" : "card";
        localStorage.setItem(MARKET_VIEW_KEY, currentMarketView);
        applyMarketView(reportsCard, toggleButton, currentMarketView);
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

        currentReportRows = reportRows;
        renderMarketTable(reportRows, marketTable);
        renderPortfolioTable(reportRows, portfolioTable);
        updateTotalGainLoss(reportRows);
    } catch (error) {
        console.error("Failed to build reports page:", error);
        currentReportRows = [];
        marketTable.innerHTML = `<p class="reports-error">${translate("reports_error_market")}</p>`;
        portfolioTable.innerHTML = `<p class="reports-error">${translate("reports_error_portfolio")}</p>`;
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
        container.innerHTML = `<p class="reports-empty">${translate("reports_empty_saved")}</p>`;
        return;
    }

    container.innerHTML = "";

    reportRows.forEach((stock, index) => {
        const row = document.createElement("article");
        row.className = "report-row reports-grid";

        row.innerHTML = `
            <div class="report-cell" data-label="${translate("reports_market_col_name")}">
                <div class="stock-name-block">
                    <span class="stock-company">${stock.company}</span>
                    <span class="stock-symbol">- ${stock.symbol}</span>
                </div>
            </div>
            <div class="report-cell" data-label="${translate("reports_market_col_month")}">
                <div class="chart-shell">${createSparklineSVG(stock.history, stock.symbol, index)}</div>
            </div>
            <div class="report-cell" data-label="${translate("reports_market_col_change")}">
                <span class="change-value ${stock.change24h >= 0 ? "change-positive" : "change-negative"}">
                    ${formatSignedCurrency(stock.change24h)}
                </span>
            </div>
        `;

        container.appendChild(row);
    });
}

// Change the classes of elements to trigger card/list view
function applyMarketView(reportsCard, toggleButton, view) {
    // bool, set to true/false depending on if its a card view
    const isCardView = view === "card";

    // add necessary classes to activate correct CSS properties
    reportsCard.classList.toggle("reports-card-view", isCardView);

    // set text content to either list view or card view
    toggleButton.textContent = isCardView ? translate("reports_view_list") : translate("reports_view_card");
    toggleButton.setAttribute("aria-pressed", String(isCardView));
}

// get saved view from local storage
function getSavedMarketView() {
    try {
        return localStorage.getItem(MARKET_VIEW_KEY) === "card" ? "card" : "list";
    } catch (error) {
        console.error("Could not read reports view preference:", error);
        return "list";
    }
}

function formatExportDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

function renderPortfolioTable(reportRows, container) {
    const ownedStocks = reportRows.filter((row) => row.shares > 0);

    if (!ownedStocks.length) {
        container.innerHTML = `<p class="reports-empty">${translate("reports_empty_portfolio")}</p>`;
        return;
    }

    container.innerHTML = "";

    ownedStocks.forEach((stock) => {
        const row = document.createElement("article");
        row.className = "holding-row holdings-grid";

        row.innerHTML = `
            <div class="holding-cell" data-label="${translate("reports_holdings_col_name")}">
                <p class="holding-name">${stock.company} - ${stock.symbol}</p>
            </div>
            <div class="holding-cell" data-label="${translate("reports_holdings_col_gain")}">
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
    totalElement.textContent = `${translate("reports_total_gain_loss")}: ${formatSignedCurrency(total)} USD`;
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
            <text class="spark-label" x="${padding.left}" y="${height - 8}">${translate("reports_spark_prev_close")}</text>
            <text class="spark-label" x="${width / 2 - 18}" y="${height - 8}">${translate("reports_spark_session")}</text>
            <text class="spark-label" x="${width - 48}" y="${height - 8}">${translate("reports_spark_now")}</text>
            <polyline class="spark-line" stroke="${lineColor}" points="${polylinePoints}"></polyline>
        </svg>
    `;
}

document.addEventListener("languageChanged", () => {
    const exportButton = document.querySelector("#export-reports-button");
    if (exportButton) {
        exportButton.textContent = translate("reports_export_json");
    }

    const toggleButton = document.querySelector("#market-view-toggle");
    const reportsCard = toggleButton?.closest(".reports-card");
    if (toggleButton && reportsCard) {
        applyMarketView(reportsCard, toggleButton, currentMarketView);
    }

    if (currentReportRows.length) {
        renderMarketTable(currentReportRows, document.querySelector("#market-report-table"));
        renderPortfolioTable(currentReportRows, document.querySelector("#portfolio-report-table"));
        updateTotalGainLoss(currentReportRows);
    }
});

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
