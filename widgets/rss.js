// widgets/rssWidget.js
// widgets/rssWidget.js
export function createWidget() {
    const container = document.createElement("div");
    container.className = "widget glass";
    container.id = "rss";

    // Add initial loading content or spinner
    container.innerHTML = `
    <div class="rss-header">
        <h2>Top News</h2>
        <div class="close-btn">&#x2715;</div>
        <div class="drag-btn"><img src="../assets/other/drag.png"></div>
    </div>
    <div class="rss-content">
        <div class="rss-item">
            <h3 class="rss-title">Loading...</h3>
        </div>
    </div>
`;


    // Start loading the RSS content asynchronously
    const feedUrl = "https://timesofindia.indiatimes.com/rssfeedstopstories.cms";
    updateRSSFeed(feedUrl, container);

    // Refresh every 10 minutes
    setInterval(() => updateRSSFeed(feedUrl, container), 600000);

    // Return the container immediately
    return container;
}


async function updateRSSFeed(url, widget) {
    if (!widget) return;

    if (!navigator.onLine) {
        widget.querySelector('.rss-content').innerHTML = offlineRSSHTML();
        return;
    }

    try {
        const res = await fetch(url);
        const data = await res.text();

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(data, "text/xml");
        const items = xmlDoc.getElementsByTagName("item");

        const numberOfItems = 5;
        let contentHTML = "";

        for (let i = 0; i < Math.min(items.length, numberOfItems); i++) {
            const title = items[i].getElementsByTagName("title")[0].textContent;
            const link = items[i].getElementsByTagName("link")[0].textContent;
            const pubDate = items[i].getElementsByTagName("pubDate")[0].textContent;

            let imageUrl = "";
            const enclosure = items[i].getElementsByTagName("enclosure")[0];
            if (enclosure && enclosure.getAttribute("type").includes("image")) {
                imageUrl = enclosure.getAttribute("url");
            } else {
                const mediaContent = items[i].getElementsByTagName("media:content")[0];
                if (mediaContent) {
                    imageUrl = mediaContent.getAttribute("url");
                }
            }

            const date = new Date(pubDate);
            const options = {
                weekday: 'short',
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            };

            contentHTML += `
                <div class="rss-item">
                    <div style="display:flex;align-items: center;">
                        <h3 class="rss-title"><a href="${link}" rel="noopener">${title}</a></h3>
                        ${imageUrl ? `<img src="${imageUrl}" class="rss-image" alt="Image" />` : ""}
                    </div>
                    <p class="rss-date">${date.toLocaleDateString('en-GB', options)}</p>
                </div>
            `;
        }

        // ✅ Only update rss-content
        widget.querySelector('.rss-content').innerHTML = contentHTML;

    } catch (err) {
        console.error(err);
        widget.querySelector('.rss-content').innerHTML = offlineRSSHTML();
    }
}


function offlineRSSHTML() {
    return `
        <div class="rss-content">
            <div class="rss-item">
                <h3 class="rss-title">Offline</h3>
                <p class="rss-date">Unable to fetch the RSS feed. Check your internet connection.</p>
            </div>
        </div>
    `;
}
