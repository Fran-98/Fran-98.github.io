document.addEventListener('DOMContentLoaded', function () {
    // Existing variables...
    let allTradeupData = [];
    let filteredTradeupData = [];
    let currentBatchIndex = 0;
    let currentJsonIndex = 0;
    const batchSize = 20;
    let isLoading = false;

    const jsonFiles = [
        'tradeups_data/tradeups_0.json',
        // 'tradeups_data/tradeups_chunk_1.json',
        // ...
    ];

    const container = document.getElementById('tradeups-container');
    const loadMoreButton = document.getElementById('load-more-btn');
    const sortBySelect = document.getElementById('sort-by');

    // --- Get Filter Element References ---
    const costMinInput = document.getElementById('cost-min');
    const costMaxInput = document.getElementById('cost-max');
    const profitMinInput = document.getElementById('profit-min');
    const profitMaxInput = document.getElementById('profit-max');
    const oddsMinInput = document.getElementById('odds-min');
    const oddsMaxInput = document.getElementById('odds-max');
    // New Float References
    const floatMinInput = document.getElementById('float-min');
    const floatMaxInput = document.getElementById('float-max');
    // ---
    const applyFiltersButton = document.getElementById('apply-filters-btn');
    const clearFiltersButton = document.getElementById('clear-filters-btn');
    // -----------------------------------

    // --- Filtering Function (with dynamic float calculation) ---
    function filterAndSortData() {
        // Helper function to safely get value or default, and log error if element missing
        const getInputValue = (element, elementId, defaultValue) => {
            if (!element) {
                console.error(`Filter element with ID '${elementId}' not found! Cannot read value. Using default filter value.`);
                return defaultValue;
            }
            return element.value !== '' ? parseFloat(element.value) : defaultValue;
        };

        // Read filter values using the helper
        const costMin = getInputValue(costMinInput, 'cost-min', -Infinity);
        const costMax = getInputValue(costMaxInput, 'cost-max', Infinity);
        const profitMin = getInputValue(profitMinInput, 'profit-min', -Infinity);
        const profitMax = getInputValue(profitMaxInput, 'profit-max', Infinity);
        const oddsMin = getInputValue(oddsMinInput, 'odds-min', -Infinity);
        const oddsMax = getInputValue(oddsMaxInput, 'odds-max', Infinity);
        const floatMin = getInputValue(floatMinInput, 'float-min', -Infinity);
        const floatMax = getInputValue(floatMaxInput, 'float-max', Infinity);

        // Optional: Check if any filter element was missing
        if (!costMinInput || !costMaxInput || !profitMinInput || !profitMaxInput || !oddsMinInput || !oddsMaxInput || !floatMinInput || !floatMaxInput || !sortBySelect) {
             console.warn("One or more filter/sort input elements were not found in the HTML. Please check element IDs ('cost-min', 'cost-max', 'profit-min', 'profit-max', 'odds-min', 'odds-max', 'float-min', 'float-max', 'sort-by').");
        }

        console.log("Filtering with:", { costMin, costMax, profitMin, profitMax, oddsMin, oddsMax, floatMin, floatMax });

        // Filter the main data source (allTradeupData)
        filteredTradeupData = allTradeupData.filter(tradeup => {
            // --- Calculate Average Input Float Dynamically ---
            let totalFloatSum = 0;
            let totalSkinCount = 0;
            // Default to NaN. Comparisons with NaN (e.g., NaN >= 0.1) are always false,
            // effectively excluding items where avg float cannot be calculated from float filters.
            let avgFloat = NaN;

            // Check if input_skins exists and is an array
            if (tradeup.input_skins && Array.isArray(tradeup.input_skins)) {
                tradeup.input_skins.forEach(skin => {
                    // Check if skin object is valid and has a numeric float
                    if (skin && typeof skin.float === 'number') {
                        // Determine quantity: Use skin.times if it's a positive number, otherwise default to 1
                        const quantity = (typeof skin.times === 'number' && skin.times > 0) ? Math.floor(skin.times) : 1;

                        totalFloatSum += (skin.float * quantity);
                        totalSkinCount += quantity;
                    }
                    // Optional: Could add an else here to warn about invalid input skin data
                    // else { console.warn("Skipping invalid input skin during float calculation:", skin); }
                });

                // Calculate average only if we counted skins
                if (totalSkinCount > 0) {
                    avgFloat = totalFloatSum / totalSkinCount;
                }
            }
            // Optional: Could add an else here to warn about missing input_skins array
            // else { console.warn("Tradeup missing input_skins array:", tradeup); }
            // --- End Average Float Calculation ---

            // Get other tradeup properties, providing defaults
            const cost = tradeup.tradeup_cost ?? 0;
            const profit = tradeup.mean_profit ?? -Infinity;
            const odds = tradeup.odds_to_profit ?? -Infinity;

            // Perform filter checks
            const costMatch = cost >= costMin && cost <= costMax;
            const profitMatch = profit >= profitMin && profit <= profitMax;
            const oddsMatch = odds >= oddsMin && odds <= oddsMax;
            // Use the dynamically calculated avgFloat for the check
            const floatMatch = avgFloat >= floatMin && avgFloat <= floatMax;

            // Return true only if ALL conditions match
            return costMatch && profitMatch && oddsMatch && floatMatch;
        }); // End of .filter() callback

        console.log(`Filtered data count: ${filteredTradeupData.length}`);

        // Apply the current sorting to the filtered data
        const currentSort = sortBySelect ? sortBySelect.value : 'profitability'; // Default sort
        sortTradeups(currentSort, false); // false = don't re-render yet

        // Reset rendering state and render the first batch of filtered data
        currentBatchIndex = 0;
        container.innerHTML = ''; // Clear current display
        if (filteredTradeupData.length === 0) {
             // Display message only if actual data exists but filters excluded everything
             if (allTradeupData.length > 0) {
                container.innerHTML = '<p>No tradeups match the current filters.</p>';
             } else {
                 // Initial load might still be happening or failed
             }
        }
        renderTradeupsBatch(); // Render the first batch (or handle empty)
        updateLoadMoreButtonVisibility(); // Update button based on filtered data
    }
    // ------------------------

    // --- loadNextJsonFile (no changes needed from previous version) ---
     async function loadNextJsonFile() {
        if (currentJsonIndex >= jsonFiles.length) {
            console.log("No more JSON files to load.");
            return false;
        }
        const file = jsonFiles[currentJsonIndex];
        currentJsonIndex++;
        try {
            const response = await fetch(file);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} for ${file}`);
            }
            const data = await response.json();
            console.log(`Successfully loaded ${file} with ${data.length} items.`);

            allTradeupData = allTradeupData.concat(data); // Add new data to the main list

            // Re-apply filters and sort after loading new data
            filterAndSortData(); // Filters ALL data (old + new) and triggers re-render

            return true;
        } catch (error) {
            console.error(`Error loading ${file}:`, error);
            return false; // Indicate failure
        }
    }
    // -------------------------------------------------------------

    // --- renderTradeupsBatch (no changes needed from previous version) ---
     function renderTradeupsBatch() {
        const fragment = document.createDocumentFragment();
        const batchEndIndex = Math.min(currentBatchIndex + batchSize, filteredTradeupData.length);
        const batch = filteredTradeupData.slice(currentBatchIndex, batchEndIndex);

        console.log(`Rendering batch from ${currentBatchIndex} to ${batchEndIndex - 1} (filtered), batch size: ${batch.length}`);

         // Message for empty filter result is handled in filterAndSortData now
         if (batch.length === 0) {
             console.log("No more items to render in current batch.");
             // Visibility handled by updateLoadMoreButtonVisibility
             return;
         }

        batch.forEach((tradeup, index) => {
            // Using currentBatchIndex + index gives a running number for the visible items
            fragment.appendChild(createTradeupElement(tradeup, currentBatchIndex + index));
        });
        container.appendChild(fragment);
        currentBatchIndex += batch.length;

        console.log(`Next batch starts at index: ${currentBatchIndex} (filtered)`);
        updateLoadMoreButtonVisibility();
    }
    // -----------------------------------------------------------------

    // --- updateLoadMoreButtonVisibility (no changes needed from previous)---
     function updateLoadMoreButtonVisibility() {
        if (!loadMoreButton) return;
        const moreFilteredItemsToRender = currentBatchIndex < filteredTradeupData.length;
        const moreJsonFilesToLoad = currentJsonIndex < jsonFiles.length;

        if (moreFilteredItemsToRender || moreJsonFilesToLoad) {
            loadMoreButton.style.display = 'block';
            loadMoreButton.disabled = false; // Ensure it's enabled
        } else {
            loadMoreButton.style.display = 'none';
            console.log("All filtered data rendered and/or all JSON loaded.");
        }
     }
    // -------------------------------------------------------------------

    // --- createTradeupElement and createSkinsSection (no changes needed from previous) ---
    // (Paste the versions from the previous response here - they include null checks etc.)
     function createTradeupElement(tradeup, index) {
       const tradeupDiv = document.createElement('div');
       tradeupDiv.className = 'tradeup-item';

       const tradeupHeader = document.createElement('div');
       tradeupHeader.className = 'tradeup-header';

       const nameHeading = document.createElement('h2');
       nameHeading.textContent = `Tradeup #${index + 1}`; // Index relative to filtered/sorted list

       const detailsDiv = document.createElement('div');
       detailsDiv.className = 'tradeup-details';
       detailsDiv.innerHTML = `
               <p><strong>Odds:</strong> ${tradeup.odds_to_profit != null ? tradeup.odds_to_profit.toFixed(2) : 'N/A'} %</p>
               <p><strong>Cost:</strong> $${tradeup.tradeup_cost != null ? tradeup.tradeup_cost.toFixed(2) : 'N/A'}</p>
               <p><strong>Profit %:</strong> ${tradeup.profitability != null ? (tradeup.profitability).toFixed(2) : 'N/A'} %</p> <p><strong>Avg Profit:</strong> $${tradeup.mean_profit != null ? tradeup.mean_profit.toFixed(2) : 'N/A'}</p> `; // Added != null checks and adjusted labels

       tradeupHeader.appendChild(detailsDiv); // Details first
       tradeupHeader.appendChild(nameHeading); // Then Name

       tradeupDiv.appendChild(tradeupHeader);

       const inputsDiv = createSkinsSection(tradeup.input_skins, 'Inputs', false);
       const outputsDiv = createSkinsSection(tradeup.output_skins, 'Outputs', true, tradeup.tradeup_cost);

       const sectionsContainer = document.createElement('div');
       sectionsContainer.className = 'sections-container';
       // Create inner container for grid if needed, or apply directly
       inputsDiv.classList.add('inputs'); // Add class for grid styling
       outputsDiv.classList.add('outputs'); // Add class for grid styling

       sectionsContainer.appendChild(inputsDiv);
       sectionsContainer.appendChild(outputsDiv);
       tradeupDiv.appendChild(sectionsContainer);

       return tradeupDiv;
     }

     function createSkinsSection(skins, title, isOutput = false, tradeupCost = 0) {
       const sectionContainer = document.createElement('div');
       sectionContainer.className = 'tradeup-section-container'; // Renamed from 'item'

       const titleHeading = document.createElement('h3');
       titleHeading.className = 'section-title';
       titleHeading.textContent = title;
       sectionContainer.appendChild(titleHeading);

       // This div will be the grid container
       const sectionGridDiv = document.createElement('div');
       // Add 'inputs' or 'outputs' class here for grid styling
       sectionGridDiv.className = `tradeup-section ${isOutput ? 'outputs' : 'inputs'}`;

       if (!skins) {
           console.warn("Skins data missing for section:", title);
            sectionGridDiv.innerHTML = '<p>No skin data available.</p>'; // Add placeholder
            sectionContainer.appendChild(sectionGridDiv);
           return sectionContainer;
       }

       skins.forEach(skin => {
           if (!skin || !skin.name || !skin.image) {
              console.warn("Invalid skin data found in section:", title, skin);
              return;
           }

           let quantity = isOutput ? 1 : (skin.times || 1);
           for (let i = 0; i < quantity; i++) {
               // Create the frame directly, it will be a grid item
               const itemFrameDiv = document.createElement('div');
               itemFrameDiv.className = 'skin-frame'; // This is the grid item

               let price = isOutput ? skin.sell_price : skin.buy_price;
               let additionalInfo = '';

               if (isOutput && skin.chance != null) {
                   additionalInfo = `<p>Chance: ${(skin.chance * 100).toFixed(2)}%</p>`;
               }
               

               let frameBackground = 'transparent'; // Default background
                if (isOutput && tradeupCost != null && tradeupCost !== 0 && skin.sell_price != null) {
                    // Use CSS variables or more specific classes for themes if needed
                    // Using RGBA for simplicity here
                    if (skin.sell_price > tradeupCost) {
                        frameBackground = 'rgba(144, 238, 144, 0.2)'; // Lighter green with less opacity
                    } else if (skin.sell_price < tradeupCost) {
                         frameBackground = 'rgba(250, 128, 114, 0.2)'; // Lighter red with less opacity
                    } else {
                         // Optional: style for break-even
                        frameBackground = 'rgba(255, 255, 255, 0.05)';
                    }
               } else if (!isOutput) {
                    // Ensure inputs are transparent or slightly indicated
                    frameBackground = 'rgba(255, 255, 255, 0.02)';
               }

               itemFrameDiv.style.backgroundColor = frameBackground;

               const displayFloat = typeof skin.float === 'number' ? skin.float.toFixed(8) : 'N/A';
               const displayPrice = typeof price === 'number' ? price.toFixed(2) : 'N/A';
               const collectionName = skin.collection_name || 'N/A';

               if (isOutput && skin.chance != null) {
                priceInfo = `<p>Sell Price: $${displayPrice}</p>`;
                }
                else{
                priceInfo = `<p>Price: $${displayPrice}</p>`;
                }
               itemFrameDiv.innerHTML = `
                       <img src="${skin.image}" alt="${skin.name}" loading="lazy">
                       <p title="${skin.name}">${skin.name}</p> <p>Coll: ${collectionName}</p> <p>Float: ${displayFloat}</p>
                       ${priceInfo}
                       ${additionalInfo}
                       `;
               sectionGridDiv.appendChild(itemFrameDiv); // Add frame to the grid
           }
       });

       sectionContainer.appendChild(sectionGridDiv); // Add the grid div to the container
       return sectionContainer;
     }
    // --------------------------------------------------------------------------------

    // --- sortTradeups (no changes needed from previous) ---
     function sortTradeups(sortBy, shouldRender = true) {
        filteredTradeupData.sort((a, b) => {
            let valA, valB;
            switch (sortBy) {
                case 'odds':
                    valA = a.odds_to_profit ?? -Infinity;
                    valB = b.odds_to_profit ?? -Infinity;
                    break;
                case 'cost':
                    valA = a.tradeup_cost ?? Infinity;
                    valB = b.tradeup_cost ?? Infinity;
                    return valA - valB; // Ascending for cost
                case 'profitPerTrade': // Corresponds to mean_profit
                    valA = a.mean_profit ?? -Infinity;
                    valB = b.mean_profit ?? -Infinity;
                    break;
                case 'profitability': // This is the percentage
                default:
                    valA = a.profitability ?? -Infinity;
                    valB = b.profitability ?? -Infinity;
                    break;
                 // Add case for sorting by avg_input_float if needed
                 // case 'float':
                 //    valA = a.avg_input_float ?? 1; // Default high for ascending
                 //    valB = b.avg_input_float ?? 1;
                 //    return valA - valB; // Ascending float sort
            }
            // Descending default for most cases
            return valB - valA;
        });

        if (shouldRender) {
            currentBatchIndex = 0;
            container.innerHTML = '';
            if (filteredTradeupData.length === 0 && allTradeupData.length > 0) {
                container.innerHTML = '<p>No tradeups match the current filters.</p>';
            } else if (filteredTradeupData.length === 0 && allTradeupData.length === 0) {
                 // Message handled by initial load or load error logic
            }
            renderTradeupsBatch();
            updateLoadMoreButtonVisibility();
        }
    }
    // ---------------------------------------------------

    // --- loadMoreHandler (no changes needed from previous) ---
     async function loadMoreHandler() {
        if (isLoading) {
            console.log("Already loading...");
            return;
        }
        isLoading = true;
        if (loadMoreButton) loadMoreButton.disabled = true; // Disable button

        console.log("Load more handler triggered.");

        const moreFilteredItemsAvailable = currentBatchIndex < filteredTradeupData.length;
        const moreJsonFilesAvailable = currentJsonIndex < jsonFiles.length;

        if (!moreFilteredItemsAvailable && moreJsonFilesAvailable) {
            console.log("Attempting to load next JSON file.");
            // loadNextJsonFile now handles filtering, sorting, and rendering
            await loadNextJsonFile();
            // Update button state based on the result of loading and filtering
            updateLoadMoreButtonVisibility();

        } else if (moreFilteredItemsAvailable) {
             console.log("Rendering next batch of existing filtered data.");
             renderTradeupsBatch(); // This calls updateLoadMoreButtonVisibility internally
        } else {
             console.log("No more items or files.");
             updateLoadMoreButtonVisibility(); // Ensure button is hidden
        }


        isLoading = false;
        // Re-enable button only if it should still be visible
        if (loadMoreButton && loadMoreButton.style.display !== 'none') {
             loadMoreButton.disabled = false;
        }
    }
    // ---------------------------------------------------

    // --- IntersectionObserver Setup (no changes needed from previous) ---
    const observerOptions = { /* ... */ };
    const observerCallback = (entries) => { /* ... */ };
    const observer = new IntersectionObserver(observerCallback, observerOptions);
    // ----------------------------------------------------------------

    // --- Event Listeners ---

    // Load More Button
    if (loadMoreButton) {
        loadMoreButton.addEventListener('click', () => {
            console.log("Manual button click.");
            loadMoreHandler();
        });
        observer.observe(loadMoreButton);
    } else { console.error("Load More button not found!"); }

    // Sorting Select
    if (sortBySelect) {
        sortBySelect.addEventListener('change', function () {
            console.log("Sort selection changed.");
            sortTradeups(this.value, true); // Re-sort and re-render filtered data
        });
    }

    // Filter Buttons
    if (applyFiltersButton) {
        applyFiltersButton.addEventListener('click', () => {
            console.log("Apply filters button clicked.");
            filterAndSortData(); // Apply filters, sort, and re-render
        });
    }

    if (clearFiltersButton) {
        clearFiltersButton.addEventListener('click', () => {
            console.log("Clear filters button clicked.");
            // Clear input fields
            costMinInput.value = '';
            costMaxInput.value = '';
            profitMinInput.value = '';
            profitMaxInput.value = '';
            oddsMinInput.value = '';
            oddsMaxInput.value = '';
            // Clear New Float Inputs
            floatMinInput.value = '';
            floatMaxInput.value = '';
            // ---
            filterAndSortData(); // Re-apply (no) filters, sort, and re-render
        });
    }
    // -----------------------------------

    // --- Initial Load ---
    console.log("Starting initial load...");
    (async () => {
        // Load the first JSON file. loadNextJsonFile now handles the initial filter/sort/render
        const loaded = await loadNextJsonFile();
        if (!loaded) {
             // Handle initial load failure more gracefully
             container.innerHTML = '<p>Failed to load initial tradeup data. Please try refreshing.</p>';
             if(loadMoreButton) loadMoreButton.style.display = 'none'; // Hide button on fail
        } else {
             console.log("Initial load and processing complete.");
              // updateLoadMoreButtonVisibility() was called by the process
        }
    })().catch(error => {
        console.error("Error during initial setup:", error);
        container.innerHTML = '<p>An error occurred loading initial data.</p>';
        if(loadMoreButton) loadMoreButton.style.display = 'none';
    });

}); // End of DOMContentLoaded