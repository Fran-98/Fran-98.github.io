document.addEventListener('DOMContentLoaded', function() {
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('tradeups-container');
            data.forEach(tradeup => {
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
                `;

                tradeupDiv.appendChild(nameHeading);
                tradeupDiv.appendChild(inputsDiv);
                tradeupDiv.appendChild(outputsDiv);
                tradeupDiv.appendChild(detailsDiv);

                container.appendChild(tradeupDiv);
            });
        })
        .catch(error => console.error('Error fetching data:', error));
});

function createTradeUpSection(items, title) {
    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'tradeup-section';
    sectionDiv.innerHTML = `<h3>${title}</h3>`;

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