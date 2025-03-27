document.addEventListener('DOMContentLoaded', function() {
    // Array to hold all tradeup data
    let allTradeupData = [];

    // Predefined list of JSON files (you'll need to update this manually)
    const jsonFiles = [
        'tradeups_data/tradeups_chunk_0.json',
        'tradeups_data/tradeups_chunk_1.json',
        'tradeups_data/tradeups_chunk_2.json',
        'tradeups_data/tradeups_chunk_3.json',
        // Add all your JSON file paths here
    ];

    // Function to fetch all JSON files
    function loadAllTradeups() {
        // Fetch all JSON files
        const fetchPromises = jsonFiles.map(file => 
            fetch(file)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status} for ${file}`);
                    }
                    return response.json();
                })
                .catch(error => {
                    console.error(`Error loading ${file}:`, error);
                    return []; // Return empty array if file fails to load
                })
        );

        Promise.all(fetchPromises)
            .then(chunks => {
                // Flatten the array of chunks
                allTradeupData = chunks.flat();
                
                // Initial render
                renderTradeups(allTradeupData);

                // Setup sort functionality
                const sortBySelect = document.getElementById('sort-by');
                sortBySelect.addEventListener('change', function() {
                    const sortBy = sortBySelect.value;
                    sortTradeups(allTradeupData, sortBy);
                });
            })
            .catch(error => console.error('Error loading tradeup data:', error));
    }

    // Call the load function
    loadAllTradeups();
});

function renderTradeups(tradeups) {
    const container = document.getElementById('tradeups-container');
    container.innerHTML = ''; // Clear any previous content

    tradeups.forEach((tradeup, index) => {
        const tradeupDiv = document.createElement('div');
        tradeupDiv.className = 'tradeup-item';

        // Add Tradeup Name (Tradeup-X)
        const nameHeading = document.createElement('h2');
        nameHeading.textContent = `Tradeup-N°${index + 1}`;

        // Add general details (Odds, Cost, Profitability) horizontally
        const detailsDiv = document.createElement('div');
        detailsDiv.className = 'tradeup-details';
        detailsDiv.innerHTML = `        
            <p><strong>Odds:</strong> ${tradeup.odds_to_profit.toFixed(2)} %</p>
            <p><strong>Cost:</strong> $${tradeup.tradeup_cost.toFixed(2)}</p>
            <p><strong>Profitability:</strong> ${(tradeup.profitability + 100).toFixed(2)} %</p>
            <p><strong>Profit per trade:</strong> $${(tradeup.tradeup_profit).toFixed(2)}</p>
        `;

        // Create inputs and outputs sections
        const inputsDiv = createSkinsSection(tradeup.input_skins, 'Inputs', false);
        const outputsDiv = createSkinsSection(tradeup.output_skins, 'Outputs', true, tradeup.tradeup_cost);

        // Create header with general info (name and tradeup details)
        const tradeupHeader = document.createElement('div');
        tradeupHeader.className = 'tradeup-header';
        tradeupHeader.appendChild(nameHeading);
        tradeupHeader.appendChild(detailsDiv);
        tradeupDiv.appendChild(tradeupHeader);

        // Add inputs and outputs side by side (using flexbox)
        const sectionsContainer = document.createElement('div');
        sectionsContainer.style.display = 'flex'; // Side by side layout
        sectionsContainer.style.gap = '20px'; // Space between the sections
        sectionsContainer.appendChild(inputsDiv);
        sectionsContainer.appendChild(outputsDiv);

        tradeupDiv.appendChild(sectionsContainer);

        // Add tradeup item to container
        container.appendChild(tradeupDiv);
    });
}

function createSkinsSection(skins, title, isOutput = false, tradeupCost = 0) {
    const sectionContainer = document.createElement('div');
    sectionContainer.className = 'tradeup-section-container';

    // Create the title for the section
    const titleHeading = document.createElement('h3');
    titleHeading.className = 'section-title';
    titleHeading.textContent = title;
    sectionContainer.appendChild(titleHeading);

    const sectionDiv = document.createElement('div');
    sectionDiv.className = `tradeup-section ${isOutput ? 'outputs' : 'inputs'}`; 

    skins.forEach(skin => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'item';
        let price = isOutput ? skin.sell_price : skin.buy_price;
        let additionalInfo = '';
        let timesInfo = '';

        // Handle the new 'times' key for input skins
        if (!isOutput && skin.times && skin.times > 1) {
            timesInfo = `<p><strong>Quantity:</strong> ${skin.times}</p>`;
        }

        if (isOutput && skin.chance) {
            additionalInfo = `<p>Chance: ${(skin.chance * 100).toFixed(2)}%</p>`;
        }

        let frameBackground = '';
        if (isOutput && tradeupCost !== 0) {
            frameBackground = (skin.sell_price > tradeupCost) ? 'rgba(144, 238, 144, 0.3)' : 'rgba(250, 128, 114, 0.3)';
        }

        itemDiv.innerHTML = `
            <div class="skin-frame" style="background-color: ${frameBackground};">
                <img src="${skin.image}" alt="${skin.name}">
                <p>${skin.name}</p>
                <p>Collection: ${skin.collection_name}</p>
                <p>Float: ${skin.float.toFixed(8)}</p>
                <p>Price: $${price.toFixed(2)}</p>
                ${timesInfo}
                ${additionalInfo}
            </div>
        `;
        sectionDiv.appendChild(itemDiv);
    });

    sectionContainer.appendChild(sectionDiv);
    return sectionContainer;
}

function sortTradeups(tradeups, sortBy) {
    tradeups.sort((a, b) => {
        if (sortBy === 'odds') {
            return b.odds_to_profit - a.odds_to_profit;
        } else if (sortBy === 'cost') {
            return b.tradeup_cost - a.tradeup_cost;
        } else if (sortBy === 'profitPerTrade') {
            return b.tradeup_profit - a.tradeup_profit;
        } else if (sortBy === 'profitability') {
            return b.profitability - a.profitability;
        }
    });
    renderTradeups(tradeups);
}