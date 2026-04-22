//Gets pricing info for specified ticker: Current price, high, low, open
/*
{
  "c": 261.74,
  "h": 263.31,
  "l": 260.68,
  "o": 261.07,
  "pc": 259.45,
  "t": 1582641000 
}
*/
async function getQuote(symbol){
    let result = await fetch(`${config.finnhubRoot}/quote?symbol=${symbol}&token=${config.finnhubKey}`);
    return result.json();
}

//Gets company profile based on ticker
//{country, currency, exchange, ipo, ...., ticker, full name, weburl, logo, industry}
async function getProfile(symbol){
    try {
    let result = await fetch(`${config.finnhubRoot}/stock/profile2?symbol=${symbol}&token=${config.finnhubKey}`);

    return result.json();
    } catch (err) {
        console.error("Error fetching profile data. ", err);
    }
}

//Allows user to search for a company.

async function searchSymbol(search){
    try {
    let result = await fetch(`${config.finnhubRoot}/search?q=${search}&token=${config.finnhubKey}`);

    return result.json();
    } catch(err) {
                console.error("Error fetching symbol from search query: ", err);
    }
}

//Unfiltered of symbols from specified exchange to populate home page.
async function symbolList(exchange = "US"){
    try {
        let result = await fetch(`${config.finnhubRoot}/stock/symbol?exchange=${exchange}&token=${config.finnhubKey}`);

        return result;
    } catch (err) {
        console.error("Error fetching list from given exchange: ", err);
    }
}