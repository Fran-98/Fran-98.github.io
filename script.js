document.addEventListener('DOMContentLoaded', function() {
    // Array global para acumular los datos cargados
    let allTradeupData = [];
    // Índice del siguiente tradeup a renderizar
    let currentBatchIndex = 0;
    // Índice del siguiente archivo JSON a cargar
    let currentJsonIndex = 0;
    // Tamaño del lote (batch) a renderizar
    const batchSize = 20;
    
    // Lista de archivos JSON a cargar (ajusta según necesites)
    const jsonFiles = [
        'tradeups_data/tradeups_chunk_0.json',
        'tradeups_data/tradeups_chunk_1.json',
        'tradeups_data/tradeups_chunk_2.json',
        'tradeups_data/tradeups_chunk_3.json',
        // Agrega más rutas de archivos JSON si es necesario
    ];

    // Función para cargar el siguiente archivo JSON (por demanda)
    function loadNextJsonFile() {
        if (currentJsonIndex >= jsonFiles.length) {
            return Promise.resolve(false); // No quedan archivos
        }
        const file = jsonFiles[currentJsonIndex];
        currentJsonIndex++;
        return fetch(file)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status} for ${file}`);
                }
                return response.json();
            })
            .catch(error => {
                console.error(`Error loading ${file}:`, error);
                return []; // Devuelve arreglo vacío si falla la carga
            })
            .then(data => {
                // Concatenamos los datos cargados al array global
                allTradeupData = allTradeupData.concat(data);
                return true;
            });
    }

    // Función para renderizar un lote (batch) de tradeups
    function renderTradeupsBatch() {
        const container = document.getElementById('tradeups-container');
        const fragment = document.createDocumentFragment();
        // Extraemos el lote actual
        const batch = allTradeupData.slice(currentBatchIndex, currentBatchIndex + batchSize);
        if (batch.length === 0) return;
        batch.forEach((tradeup, index) => {
            fragment.appendChild(createTradeupElement(tradeup, currentBatchIndex + index));
        });
        container.appendChild(fragment);
        currentBatchIndex += batchSize;
    }

    // Función para crear el elemento de cada tradeup (manteniendo el formato)
    function createTradeupElement(tradeup, index) {
        const tradeupDiv = document.createElement('div');
        tradeupDiv.className = 'tradeup-item';

        // Nombre del Tradeup (Tradeup-N°X)
        const nameHeading = document.createElement('h2');
        nameHeading.textContent = `Tradeup-N°${index + 1}`;

        // Detalles generales: Odds, Cost, Profitability, Profit per trade
        const detailsDiv = document.createElement('div');
        detailsDiv.className = 'tradeup-details';
        detailsDiv.innerHTML = `        
            <p><strong>Odds:</strong> ${tradeup.odds_to_profit.toFixed(2)} %</p>
            <p><strong>Cost:</strong> $${tradeup.tradeup_cost.toFixed(2)}</p>
            <p><strong>Profitability:</strong> ${(tradeup.profitability + 100).toFixed(2)} %</p>
            <p><strong>Profit per trade:</strong> $${tradeup.tradeup_profit.toFixed(2)}</p>
        `;

        // Secciones de skins: inputs y outputs
        const inputsDiv = createSkinsSection(tradeup.input_skins, 'Inputs', false);
        const outputsDiv = createSkinsSection(tradeup.output_skins, 'Outputs', true, tradeup.tradeup_cost);

        // Cabecera del tradeup: nombre y detalles
        const tradeupHeader = document.createElement('div');
        tradeupHeader.className = 'tradeup-header';
        tradeupHeader.appendChild(nameHeading);
        tradeupHeader.appendChild(detailsDiv);
        tradeupDiv.appendChild(tradeupHeader);

        // Secciones de inputs y outputs, dispuestas lado a lado
        const sectionsContainer = document.createElement('div');
        sectionsContainer.style.display = 'flex';
        sectionsContainer.style.gap = '20px';
        sectionsContainer.appendChild(inputsDiv);
        sectionsContainer.appendChild(outputsDiv);

        tradeupDiv.appendChild(sectionsContainer);

        return tradeupDiv;
    }

    // Función para crear la sección de skins (mantiene la repetición según "times")
    function createSkinsSection(skins, title, isOutput = false, tradeupCost = 0) {
        const sectionContainer = document.createElement('div');
        sectionContainer.className = 'tradeup-section-container';

        // Título de la sección
        const titleHeading = document.createElement('h3');
        titleHeading.className = 'section-title';
        titleHeading.textContent = title;
        sectionContainer.appendChild(titleHeading);

        const sectionDiv = document.createElement('div');
        sectionDiv.className = `tradeup-section ${isOutput ? 'outputs' : 'inputs'}`; 

        skins.forEach(skin => {
            // Para skins de entrada se utiliza "times"; para salida, siempre 1
            let quantity = isOutput ? 1 : (skin.times || 1);
            for (let i = 0; i < quantity; i++) {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'item';
                let price = isOutput ? skin.sell_price : skin.buy_price;
                let additionalInfo = '';

                if (isOutput && skin.chance) {
                    additionalInfo = `<p>Chance: ${(skin.chance * 100).toFixed(2)}%</p>`;
                }

                let frameBackground = '';
                if (isOutput && tradeupCost !== 0) {
                    frameBackground = (skin.sell_price > tradeupCost) 
                                      ? 'rgba(144, 238, 144, 0.3)' 
                                      : 'rgba(250, 128, 114, 0.3)';
                }

                itemDiv.innerHTML = `
                    <div class="skin-frame" style="background-color: ${frameBackground};">
                        <img src="${skin.image}" alt="${skin.name}" loading="lazy">
                        <p>${skin.name}</p>
                        <p>Collection: ${skin.collection_name}</p>
                        <p>Float: ${skin.float.toFixed(8)}</p>
                        <p>Price: $${price.toFixed(2)}</p>
                        ${additionalInfo}
                    </div>
                `;
                sectionDiv.appendChild(itemDiv);
            }
        });

        sectionContainer.appendChild(sectionDiv);
        return sectionContainer;
    }

    // Función para ordenar los tradeups según el criterio seleccionado
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
        // Reinicia el renderizado tras la ordenación
        currentBatchIndex = 0;
        document.getElementById('tradeups-container').innerHTML = '';
        renderTradeupsBatch();
    }

    // Manejador para cargar más datos
    async function loadMoreHandler() {
        // Si quedan pocos elementos para completar el próximo batch, intenta cargar el siguiente JSON
        if (allTradeupData.length - currentBatchIndex < batchSize && currentJsonIndex < jsonFiles.length) {
            await loadNextJsonFile();
        }
        // Si ya no hay más datos, se oculta el botón
        if (allTradeupData.length - currentBatchIndex <= 0 && currentJsonIndex >= jsonFiles.length) {
            document.getElementById('load-more-btn').style.display = 'none';
            return;
        }
        renderTradeupsBatch();
    }

    // Evento para el botón "Load More"
    document.getElementById('load-more-btn').addEventListener('click', loadMoreHandler);

    // Opcional: usar IntersectionObserver para disparar la carga cuando el botón sea visible
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            loadMoreHandler();
        }
    });
    observer.observe(document.getElementById('load-more-btn'));

    // Evento para el select de ordenación
    document.getElementById('sort-by').addEventListener('change', function() {
        sortTradeups(allTradeupData, this.value);
    });

    // Carga inicial: carga solamente el primer JSON para mostrar un primer batch rápido
    loadNextJsonFile().then(() => {
        renderTradeupsBatch();
    });
});
