document.addEventListener('DOMContentLoaded', function() {
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            console.log("Data fetched:", data); // Check if data is fetched
            let tradeupData = data;
            renderTradeups(tradeupData);

            const sortBySelect = document.getElementById('sort-by');
            sortBySelect.addEventListener('change', function() {
                const sortBy = sortBySelect.value;
                sortTradeups(tradeupData, sortBy);
            });
        })
        .catch(error => console.error('Error fetching data:', error));
});

function renderTradeups(tradeups) {
    const container = document.getElementById('tradeups-container');
    container.innerHTML = '';

    tradeups.forEach(tradeup => {
        const tradeupDiv = document.createElement('div');
        tradeupDiv.className = 'tradeup-item';

        const nameHeading = document.createElement('h2');
        nameHeading.textContent = tradeup.name;

        const inputsDiv = createTradeUpSection(tradeup.inputs, 'Inputs');
        const outputsDiv = createTradeUpSection(tradeup.outputs, 'Outputs');

        const detailsDiv = document.createElement('div');
        detailsDiv.className = 'tradeup-details';
        detailsDiv.innerHTML = `
            <p>Profit: $${tradeup.profit.toFixed(2)}</p>
            <p>Odds: ${tradeup.odds}</p>
            <p>Cost: $${tradeup.cost.toFixed(2)}</p>
            <p>Profit per Trade: $${tradeup.profitPerTrade.toFixed(2)}</p>
        `;

        tradeupDiv.appendChild(nameHeading);
        tradeupDiv.appendChild(inputsDiv);
        tradeupDiv.appendChild(outputsDiv);
        tradeupDiv.appendChild(detailsDiv);

        container.appendChild(tradeupDiv);
    });
}

function createTradeUpSection(items, title) {
    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'tradeup-section';

    const titleHeading = document.createElement('h3');
    titleHeading.textContent = title;
    sectionDiv.appendChild(titleHeading); // Corrected line

    items.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'item';
        itemDiv.innerHTML = `
            <img src="${item.image}" alt="item">
            <p>Float: ${item.float}</p>
            <p>Price: $${item.price.toFixed(2)}</p>
        `;
        sectionDiv.appendChild(itemDiv);
    });

    return sectionDiv;
}

function sortTradeups(tradeups, sortBy) {
    tradeups.sort((a, b) => {
        if (sortBy === 'odds') {
            return parseFloat(b.odds) - parseFloat(a.odds);
        } else {
            return b[sortBy] - a[sortBy];
        }
    });
    renderTradeups(tradeups);
}