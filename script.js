document.addEventListener('DOMContentLoaded', function() {
    // Array to hold all tradeup data
    let allTradeupData = [];
    let currentPage = 1;
    const tradeupsPerPage = 50; // Adjust this number based on performance needs

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
        // Show loading indicator
        const container = document.getElementById('tradeups-container');
        container.innerHTML = '<div class="loading">Loading tradeups...</div>';

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
                
                // Initial render with first page
                renderTradeups(getPaginatedTradeups());

                // Setup pagination controls
                setupPaginationControls();

                // Setup sort functionality
                const sortBySelect = document.getElementById('sort-by');
                sortBySelect.addEventListener('change', function() {
                    const sortBy = sortBySelect.value;
                    sortTradeups(allTradeupData, sortBy);
                });
            })
            .catch(error => {
                console.error('Error loading tradeup data:', error);
                const container = document.getElementById('tradeups-container');
                container.innerHTML = '<div class="error">Failed to load tradeups. Please try again later.</div>';
            });
    }

    // Function to get paginated tradeups
    function getPaginatedTradeups() {
        const startIndex = (currentPage - 1) * tradeupsPerPage;
        return allTradeupData.slice(startIndex, startIndex + tradeupsPerPage);
    }

    // Function to setup pagination controls
    function setupPaginationControls() {
        const totalPages = Math.ceil(allTradeupData.length / tradeupsPerPage);
        const paginationContainer = document.getElementById('pagination');
        paginationContainer.innerHTML = '';

        // Previous button
        if (currentPage > 1) {
            const prevButton = document.createElement('button');
            prevButton.textContent = 'Previous';
            prevButton.addEventListener('click', () => {
                currentPage--;
                renderTradeups(getPaginatedTradeups());
                updatePaginationControls();
            });
            paginationContainer.appendChild(prevButton);
        }

        // Page numbers
        const pageInfo = document.createElement('span');
        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
        paginationContainer.appendChild(pageInfo);

        // Next button
        if (currentPage < totalPages) {
            const nextButton = document.createElement('button');
            nextButton.textContent = 'Next';
            nextButton.addEventListener('click', () => {
                currentPage++;
                renderTradeups(getPaginatedTradeups());
                updatePaginationControls();
            });
            paginationContainer.appendChild(nextButton);
        }
    }

    // Function to update pagination controls
    function updatePaginationControls() {
        setupPaginationControls();
    }

    // Call the load function
    loadAllTradeups();

    // Render tradeups (rest of the previous implementation remains the same)
    function renderTradeups(tradeups) {
        const container = document.getElementById('tradeups-container');
        container.innerHTML = ''; // Clear any previous content

        tradeups.forEach((tradeup, index) => {
            const globalIndex = (currentPage - 1) * tradeupsPerPage + index + 1;
            const tradeupDiv = document.createElement('div');
            tradeupDiv.className = 'tradeup-item';

            // Add Tradeup Name (Tradeup-X)
            const nameHeading = document.createElement('h2');
            nameHeading.textContent = `Tradeup-N°${globalIndex}`;

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

        // Update pagination controls
        setupPaginationControls();
    }

    // Sorting function remains the same
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
        
        // Reset to first page after sorting
        currentPage = 1;
        renderTradeups(getPaginatedTradeups());
    }
});

// Skin section rendering function (same as previous implementation)
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
        // Determine how many times to render the skin
        const timesToRender = !isOutput && skin.times ? skin.times : 1;

        // Create a copy of the skin without the 'times' key for rendering
        const skinToRender = {...skin};
        delete skinToRender.times;

        // Render the skin multiple times
        for (let i = 0; i < timesToRender; i++) {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'item';
            let price = isOutput ? skinToRender.sell_price : skinToRender.buy_price;
            let additionalInfo = '';

            if (isOutput && skinToRender.chance) {
                additionalInfo = `<p>Chance: ${(skinToRender.chance * 100).toFixed(2)}%</p>`;
            }

            let frameBackground = '';
            if (isOutput && tradeupCost !== 0) {
                frameBackground = (skinToRender.sell_price > tradeupCost) ? 'rgba(144, 238, 144, 0.3)' : 'rgba(250, 128, 114, 0.3)';
            }

            itemDiv.innerHTML = `
                <div class="skin-frame" style="background-color: ${frameBackground};">
                    <img src="${skinToRender.image}" alt="${skinToRender.name}">
                    <p>${skinToRender.name}</p>
                    <p>Collection: ${skinToRender.collection_name}</p>
                    <p>Float: ${skinToRender.float.toFixed(8)}</p>
                    <p>Price: $${price.toFixed(2)}</p>
                    ${additionalInfo}
                </p>
            `;
            sectionDiv.appendChild(itemDiv);
        }
    });

    sectionContainer.appendChild(sectionDiv);
    return sectionContainer;
}