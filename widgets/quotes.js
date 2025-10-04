export function createWidget() {
    const container = document.createElement("div");
    container.id = "quotes-widget";
    container.className = "widget";

    // Show loading UI immediately
    container.innerHTML = `
        <div class="close-btn">&#x2715;</div>
        <div class="drag-btn"><img src="../assets/other/drag.png"></div>
        <p class="quote-text">"The best way to get started is to quit talking and begin doing."</p>
        <p class="quote-author">-Walt Disney</p>
    `;

    const fallbackQuote = {
        q: "The best way to get started is to quit talking and begin doing.",
        a: "Walt Disney"
    };

    async function fetchQuote() {
        try {
            const res = await fetch('https://zenquotes.io/api/random');
            if (!res.ok) throw new Error('Network response was not ok');
            const data = await res.json();
            return data[0];
        } catch (error) {
            return fallbackQuote;
        }
    }

    function renderQuote(quote) {
        const quoteTextElem = container.querySelector('.quote-text');
        const quoteAuthorElem = container.querySelector('.quote-author');

        quoteTextElem.textContent = `"${quote.q}"`;
        quoteAuthorElem.textContent = `- ${quote.a}`;
    }

    // Async fetch and render quote, after container is returned
    (async () => {
        const quote = await fetchQuote();
        renderQuote(quote);
    })();

    return container;
}
