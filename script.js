document.addEventListener('DOMContentLoaded', function() {
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            renderTradeups(data);

            const sortBySelect = document.getElementById('sort-by');
            sortBySelect.addEventListener('change', function() {
                const sortBy = sortBySelect.value;
                sortTradeups(data, sortBy);
            });
        })
        .catch(error => console.error('Error fetching data:', error));
});

function renderTradeups(tradeups) {
    const container = document.getElementById('tradeups-container');
    container.innerHTML = ''; // Clear previous content

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
    // ... (Same as before) ...
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