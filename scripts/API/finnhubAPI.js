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
    let result = await fetch(`${config.finnhubRoot}/quote?symbol=${symbol}`);
    return result.json();
}

async function getProfile(symbol){
    try {
        let result = await fetch(`${config.finnhubRoot}/stock/profile2?symbol=${symbol}`);
        return result.json();
    } catch (err) {
        console.error("Error fetching profile data. ", err);
    }
}

async function searchSymbol(search){
    try {
        let result = await fetch(`${config.finnhubRoot}/search?q=${search}`);
        return result.json();
    } catch(err) {
        console.error("Error fetching symbol from search query: ", err);
    }
}

async function symbolList(exchange = "US"){
    try {
        let result = await fetch(`${config.finnhubRoot}/stock/symbol?exchange=${exchange}`);
        return result;
    } catch (err) {
        console.error("Error fetching list from given exchange: ", err);
    }
}