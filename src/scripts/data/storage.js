//returns localStorage.favorites as a string
function getFavorites() {
    try {
        const stored = localStorage.getItem("favorites");
        if (stored === null) {
            return [];
        }
        return JSON.parse(stored);
    } catch {
        console.log("error getting favorites");
        return [];
    }
}

//toggles a stock to favorite /not favorite, adding and removing it from localStorage.favorites
function toggleFavorite(symbol) {
    symbol = symbol.toUpperCase();
    const favorites = getFavorites();

    if (favorites.includes(symbol)) {
        const updated = favorites.filter(s => s !== symbol);
        localStorage.setItem("favorites", JSON.stringify(updated));
    } else {
        favorites.push(symbol);
        localStorage.setItem("favorites", JSON.stringify(favorites));
    }
}

//returns localStorage.transactions as a string
function getTransactions() {
    try {
        const transactions = localStorage.getItem("transactions");
        if (transactions === null) {
            return [];
        }
        return JSON.parse(transactions);
    } catch {
        console.log("error getting transactions");
        return [];
    }
}

//Adds a new transaction to localStorage.transactions. No remove transaction to keep a running history of buys and sells to calculate P/L etc.
function newTransaction(symbol, type, shares, price) {
    symbol = symbol.toUpperCase();
    const transactions = getTransactions();
    transactions.push({ symbol, type, shares, price, date: new Date().toISOString() });
    localStorage.setItem("transactions", JSON.stringify(transactions));
}


//returns localStorage portfolio as an object keyed by symbol
function getPortfolio() {
    try {
        const saved = localStorage.getItem("portfolio");
        if (saved === null) {
            return {};
        }
        return JSON.parse(saved);
    } catch {
        console.log("error getting portfolio");
        return {};
    }
}

//saves portfolio object to localStorage
function savePortfolio(portfolio) {
    localStorage.setItem("portfolio", JSON.stringify(portfolio));
}