const LANGUAGE_STORAGE_KEY = "site_language";
const DEFAULT_LANGUAGE = "en";

const TRANSLATIONS = {
    en: {
        nav_home: "Home",
        nav_simulation: "Simulation",
        nav_reports: "Reports",
        nav_open_menu: "Open menu",
        nav_close_menu: "Close menu",
        lang_label: "Language",
        lang_en: "English",
        lang_es: "Spanish",
        hero_title: "Learn investing the smart way",
        hero_subtitle: "Dip your toes into the market and learn how to invest safely, without losing any money.",
        hero_start: "Get Started",
        home_popular_stocks: "Popular Stocks",
        home_col_symbol: "Symbol",
        home_col_price: "Price",
        home_col_change: "Change",
        home_col_percent_change: "% Change",
        home_col_high: "High",
        home_col_low: "Low",
        home_col_open: "Open",
        home_col_prev_close: "Prev Close",
        home_col_favorite: "Favorite",
        home_table_caption: "Popular stocks with current market pricing and favorite controls",
        home_favorite_button: "Favorite",
        home_error_load: "Failed to load data.",
        home_rate_limit: "Rate limit reached. Try again in a minute.",
        reports_kicker: "Performance Snapshot",
        reports_title: "Welcome to the Reports Page.",
        reports_subtitle: "Here you can see how your favorite stocks and simulated trades have been doing.",
        reports_saved_stocks: "Saved Stocks",
        reports_toggle_card: "Card View",
        reports_market_col_name: "Stock Name",
        reports_market_col_month: "Past Month Activity",
        reports_market_col_change: "24 Hour Change",
        reports_loading_saved: "Loading saved stocks...",
        reports_loss_gain_title: "Loss/Gain Per Trade",
        reports_total_gain_loss: "Total Gain/Loss",
        reports_portfolio_holdings: "Portfolio Holdings",
        reports_holdings_col_name: "Stock Name",
        reports_holdings_col_gain: "Your Loss / Gain",
        reports_loading_portfolio: "Calculating portfolio performance...",
        reports_export_json: "Export JSON",
        reports_import_json: "Import JSON",
        reports_import_success: "Report data imported.",
        reports_import_error: "Could not import that JSON file.",
        reports_view_list: "List View",
        reports_view_card: "Card View",
        reports_error_market: "Could not load the report data right now.",
        reports_error_portfolio: "Could not calculate gain/loss right now.",
        reports_empty_saved: "No saved stocks yet. Make a trade in the simulation page to see reports here.",
        reports_empty_portfolio: "You do not have any saved simulation stocks yet.",
        reports_spark_prev_close: "Prev Close",
        reports_spark_session: "Session",
        reports_spark_now: "Now",
        simulation_eyebrow: "Simulation Market View",
        simulation_subtitle: "Quote and simulated activity",
        simulation_live_price: "Live Price",
        simulation_shares_owned: "Shares Owned",
        simulation_skip_to_trade: "Skip to trade form",
        simulation_skip_to_trades: "Skip to recent activity",
        simulation_average_cost: "Average Cost",
        simulation_current_pnl: "Current PnL",
        simulation_recent_trades: "Recent Trades",
        simulation_saved_local: "Saved locally in your browser",
        simulation_no_trades: "No trades yet for this stock.",
        simulation_selected_stock: "Selected Stock",
        simulation_label_symbol: "Symbol:",
        simulation_label_company: "Company:",
        simulation_label_open: "Open:",
        simulation_label_high: "High:",
        simulation_label_low: "Low:",
        simulation_label_prev_close: "Prev Close:",
        simulation_watchlist: "Quick Watchlist",
        simulation_watchlist_subtitle: "Click a ticker to load it here",
        simulation_execute_trade: "Execute Trade",
        simulation_shares: "Shares",
        simulation_total_cost: "Total Cost",
        simulation_buy: "Buy",
        simulation_sell: "Sell",
        simulation_open_chatbot: "Open chatbot",
        simulation_chatbot_help: "Stock Help",
        simulation_close_chatbot: "Close chatbot",
        simulation_chat_prompt_label: "Type a chatbot question",
        simulation_chat_placeholder: "Ask a stock question...",
        simulation_send: "Send",
        simulation_chat_intro: "Ask about this stock or the simulator. Try:",
        simulation_chat_example1: "\"What does PnL mean?\"",
        simulation_chat_example2: "\"What happens when I buy more shares?\"",
        simulation_chat_messages_aria: "Chatbot conversation messages",
        simulation_footer: "StalkStocks © 2026 | Practice trades safely with simulated investing tools.",
        simulation_chart_aria: "Stock trend chart",
        simulation_chart_region_aria: "Scrollable stock trend chart",
        simulation_loading_stock: "Loading stock data...",
        simulation_load_quote_error: "Could not load stock quote.",
        simulation_load_general_error: "Something went wrong while loading this stock.",
        simulation_chart_unavailable: "Loaded {{symbol}}, but chart data is unavailable right now.",
        simulation_showing_trend: "Showing {{range}} quote trend for {{symbol}}.",
        simulation_loaded_symbol: "Loaded {{symbol}}.",
        simulation_loading_watchlist: "Loading watchlist...",
        simulation_watchlist_error: "Could not load watchlist.",
        simulation_watchlist_load: "Load",
        simulation_invalid_shares: "Enter a valid number of shares.",
        simulation_no_price: "No market price available.",
        simulation_cannot_sell: "You cannot sell more shares than you own.",
        simulation_trade_done: "{{action}} {{shares}} share{{plural}} of {{symbol}}.",
        simulation_trade_bought: "Bought",
        simulation_trade_sold: "Sold",
        simulation_chat_error: "Sorry, I couldn't generate a response. Please try again."
    },
    es: {
        nav_home: "Inicio",
        nav_simulation: "Simulación",
        nav_reports: "Reportes",
        nav_open_menu: "Abrir menú",
        nav_close_menu: "Cerrar menú",
        lang_label: "Idioma",
        lang_en: "Inglés",
        lang_es: "Español",
        hero_title: "Aprende a invertir de forma inteligente",
        hero_subtitle: "Entra al mercado y aprende a invertir de forma segura, sin perder dinero.",
        hero_start: "Comenzar",
        home_popular_stocks: "Acciones populares",
        home_col_symbol: "Símbolo",
        home_col_price: "Precio",
        home_col_change: "Cambio",
        home_col_percent_change: "% Cambio",
        home_col_high: "Máximo",
        home_col_low: "Mínimo",
        home_col_open: "Apertura",
        home_col_prev_close: "Cierre ant.",
        home_col_favorite: "Favorito",
        home_table_caption: "Acciones populares con precios actuales del mercado y controles de favoritos",
        home_favorite_button: "Favorito",
        home_error_load: "No se pudieron cargar los datos.",
        home_rate_limit: "Límite de solicitudes alcanzado. Inténtalo de nuevo en un minuto.",
        reports_kicker: "Resumen de rendimiento",
        reports_title: "Bienvenido a la página de reportes.",
        reports_subtitle: "Aquí puedes ver cómo han rendido tus acciones favoritas y tus operaciones simuladas.",
        reports_saved_stocks: "Acciones guardadas",
        reports_toggle_card: "Vista de tarjetas",
        reports_market_col_name: "Nombre de acción",
        reports_market_col_month: "Actividad del último mes",
        reports_market_col_change: "Cambio de 24 horas",
        reports_loading_saved: "Cargando acciones guardadas...",
        reports_loss_gain_title: "Pérdida/Ganancia por operación",
        reports_total_gain_loss: "Ganancia/Pérdida total",
        reports_portfolio_holdings: "Posiciones del portafolio",
        reports_holdings_col_name: "Nombre de acción",
        reports_holdings_col_gain: "Tu pérdida / ganancia",
        reports_loading_portfolio: "Calculando rendimiento del portafolio...",
        reports_export_json: "Exportar JSON",
        reports_import_json: "Importar JSON",
        reports_import_success: "Datos del reporte importados.",
        reports_import_error: "No se pudo importar ese archivo JSON.",
        reports_view_list: "Vista de lista",
        reports_view_card: "Vista de tarjetas",
        reports_error_market: "No se pudieron cargar los datos del reporte en este momento.",
        reports_error_portfolio: "No se pudo calcular pérdida/ganancia en este momento.",
        reports_empty_saved: "Aún no hay acciones guardadas. Haz una operación en simulación para ver reportes aquí.",
        reports_empty_portfolio: "Aún no tienes acciones simuladas guardadas.",
        reports_spark_prev_close: "Cierre ant.",
        reports_spark_session: "Sesión",
        reports_spark_now: "Ahora",
        simulation_eyebrow: "Vista de mercado de simulación",
        simulation_subtitle: "Cotización y actividad simulada",
        simulation_live_price: "Precio en vivo",
        simulation_shares_owned: "Acciones en posesión",
        simulation_average_cost: "Costo promedio",
        simulation_current_pnl: "PnL actual",
        simulation_recent_trades: "Operaciones recientes",
        simulation_saved_local: "Guardado localmente en tu navegador",
        simulation_no_trades: "Aún no hay operaciones para esta acción.",
        simulation_selected_stock: "Acción seleccionada",
        simulation_label_symbol: "Símbolo:",
        simulation_label_company: "Empresa:",
        simulation_label_open: "Apertura:",
        simulation_label_high: "Máximo:",
        simulation_label_low: "Mínimo:",
        simulation_label_prev_close: "Cierre ant.:",
        simulation_watchlist: "Lista de seguimiento rápida",
        simulation_watchlist_subtitle: "Haz clic en un ticker para cargarlo aqui",
        simulation_execute_trade: "Ejecutar operación",
        simulation_shares: "Acciones",
        simulation_total_cost: "Costo total",
        simulation_buy: "Comprar",
        simulation_sell: "Vender",
        simulation_open_chatbot: "Abrir chatbot",
        simulation_chatbot_help: "Ayuda de acciones",
        simulation_close_chatbot: "Cerrar chatbot",
        simulation_chat_prompt_label: "Escribe una pregunta para el chatbot",
        simulation_chat_placeholder: "Haz una pregunta sobre acciones...",
        simulation_send: "Enviar",
        simulation_chat_intro: "Pregunta sobre esta acción o el simulador. Prueba:",
        simulation_chat_example1: "\"¿Qué significa PnL?\"",
        simulation_chat_example2: "\"¿Qué pasa cuando compro más acciones?\"",
        simulation_chat_messages_aria: "Mensajes de la conversación del chatbot",
        simulation_footer: "StalkStocks © 2026 | Practica operaciones de forma segura con herramientas de inversión simulada.",
        simulation_chart_aria: "Gráfico de tendencia de la acción",
        simulation_chart_region_aria: "Gráfico desplazable de tendencia de la acción",
        simulation_loading_stock: "Cargando datos de la acción...",
        simulation_load_quote_error: "No se pudo cargar la cotización.",
        simulation_load_general_error: "Ocurrió un error al cargar esta acción.",
        simulation_chart_unavailable: "Se cargó {{symbol}}, pero los datos del gráfico no están disponibles ahora.",
        simulation_showing_trend: "Mostrando tendencia {{range}} para {{symbol}}.",
        simulation_loaded_symbol: "{{symbol}} cargado.",
        simulation_loading_watchlist: "Cargando lista de seguimiento...",
        simulation_watchlist_error: "No se pudo cargar la lista de seguimiento.",
        simulation_watchlist_load: "Cargar",
        simulation_invalid_shares: "Ingresa una cantidad válida de acciones.",
        simulation_no_price: "No hay precio de mercado disponible.",
        simulation_cannot_sell: "No puedes vender mas acciones de las que tienes.",
        simulation_trade_done: "{{action}} {{shares}} acción{{plural}} de {{symbol}}.",
        simulation_trade_bought: "Compraste",
        simulation_trade_sold: "Vendiste",
        simulation_chat_error: "Lo siento, no pude generar una respuesta. Inténtalo de nuevo.",
        simulation_skip_to_trade: "Salta al formulario de ejecución",
        simulation_skip_to_trades: "Salta a tu actividád",
    }
};

function getLanguage() {
    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (savedLanguage && TRANSLATIONS[savedLanguage]) {
        return savedLanguage;
    }
    return DEFAULT_LANGUAGE;
}

function setLanguage(language) {
    const nextLanguage = TRANSLATIONS[language] ? language : DEFAULT_LANGUAGE;
    localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    applyTranslations(nextLanguage);
    document.dispatchEvent(new CustomEvent("languageChanged", { detail: { language: nextLanguage } }));
}

function t(key, params = {}, language = getLanguage()) {
    const dictionary = TRANSLATIONS[language] || TRANSLATIONS[DEFAULT_LANGUAGE];
    const template = dictionary[key] || TRANSLATIONS[DEFAULT_LANGUAGE][key] || key;
    return template.replace(/\{\{(.*?)\}\}/g, (_, token) => {
        const trimmed = token.trim();
        return Object.prototype.hasOwnProperty.call(params, trimmed) ? String(params[trimmed]) : "";
    });
}

function applyTranslations(language = getLanguage()) {
    document.documentElement.lang = language;

    document.querySelectorAll("[data-i18n]").forEach((element) => {
        element.textContent = t(element.dataset.i18n, {}, language);
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
        element.setAttribute("placeholder", t(element.dataset.i18nPlaceholder, {}, language));
    });

    document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
        element.setAttribute("aria-label", t(element.dataset.i18nAriaLabel, {}, language));
    });
}

function initializeLanguageSelectors() {
    const selectors = document.querySelectorAll(".language-select");
    const currentLanguage = getLanguage();

    selectors.forEach((selector) => {
        selector.value = currentLanguage;

        selector.addEventListener("change", (event) => {
            const selectedLanguage = event.target.value;
            setLanguage(selectedLanguage);

            document.querySelectorAll(".language-select").forEach((otherSelector) => {
                otherSelector.value = selectedLanguage;
            });
        });
    });
}

window.I18N = {
    t,
    getLanguage,
    setLanguage,
    applyTranslations
};

document.addEventListener("DOMContentLoaded", () => {
    initializeLanguageSelectors();
    applyTranslations();
});
