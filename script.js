document.addEventListener('DOMContentLoaded', function() {
    // ... (keep the rest of your existing variables and functions) ...

    // Array global para acumular los datos cargados
    let allTradeupData = [];
    // Índice del siguiente tradeup a renderizar
    let currentBatchIndex = 0;
    // Índice del siguiente archivo JSON a cargar
    let currentJsonIndex = 0;
    // Tamaño del lote (batch) a renderizar
    const batchSize = 20;
    // Estado para evitar cargas múltiples mientras una está en progreso
    let isLoading = false;

    // Lista de archivos JSON a cargar (ajusta según necesites)
    const jsonFiles = [
        'tradeups_data/tradeups_chunk_0.json',
        // 'tradeups_data/tradeups_chunk_1.json',
        // 'tradeups_data/tradeups_chunk_2.json',
        // 'tradeups_data/tradeups_chunk_3.json',
        // Agrega más rutas de archivos JSON si es necesario
    ];

    const container = document.getElementById('tradeups-container');
    const loadMoreButton = document.getElementById('load-more-btn');
    const sortBySelect = document.getElementById('sort-by');

    // Función para cargar el siguiente archivo JSON (por demanda)
    async function loadNextJsonFile() {
        if (currentJsonIndex >= jsonFiles.length) {
            console.log("No more JSON files to load.");
            return false; // No quedan archivos
        }
        const file = jsonFiles[currentJsonIndex];
        currentJsonIndex++; // Incrementa antes de la carga para evitar re-intentos fallidos
        try {
            const response = await fetch(file);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} for ${file}`);
            }
            const data = await response.json();
            console.log(`Successfully loaded ${file} with ${data.length} items.`);
            // Aplica la ordenación actual a los nuevos datos antes de concatenar si es necesario
            // O, más simple, reordena todo después de cargar (depende del rendimiento deseado)
            allTradeupData = allTradeupData.concat(data);
            // Si el select tiene un valor diferente al predeterminado, reordenar todo
            if (sortBySelect.value !== 'profitability') {
                sortTradeups(allTradeupData, sortBySelect.value, false); // false = no reiniciar renderizado aquí
            }
            return true;
        } catch (error) {
            console.error(`Error loading ${file}:`, error);
            currentJsonIndex--; // Decrementa si falla para poder reintentar (opcional)
            return false; // Devuelve false si falla la carga
        }
    }

    // Función para renderizar un lote (batch) de tradeups
    function renderTradeupsBatch() {
        const fragment = document.createDocumentFragment();
        // Calcula el final del lote actual
        const batchEndIndex = currentBatchIndex + batchSize;
        // Extraemos el lote actual, asegurándose de no exceder la longitud del array
        const batch = allTradeupData.slice(currentBatchIndex, batchEndIndex);
        console.log(`Rendering batch from ${currentBatchIndex} to ${batchEndIndex - 1}, batch size: ${batch.length}`);

        if (batch.length === 0) {
            console.log("No more items to render in current batch.");
            // Ocultar el botón si no hay más items Y no hay más archivos por cargar
            if (currentJsonIndex >= jsonFiles.length) {
                if (loadMoreButton) loadMoreButton.style.display = 'none';
                console.log("All data loaded and rendered.");
            }
            return; // No hay nada que renderizar en este lote
        }

        batch.forEach((tradeup, index) => {
            // El índice global es currentBatchIndex + index local del batch
            fragment.appendChild(createTradeupElement(tradeup, currentBatchIndex + index));
        });
        container.appendChild(fragment);
        currentBatchIndex += batch.length; // Incrementa por el tamaño real del lote renderizado
        console.log(`Next batch starts at index: ${currentBatchIndex}`);

        // Comprueba si hemos renderizado todo lo cargado actualmente
        if (currentBatchIndex >= allTradeupData.length) {
            // Si además no quedan más archivos JSON, oculta el botón
            if (currentJsonIndex >= jsonFiles.length) {
                if (loadMoreButton) loadMoreButton.style.display = 'none';
                console.log("All data loaded and rendered.");
            } else {
                // Si quedan archivos, asegúrate que el botón está visible (puede haber sido ocultado por error)
                if (loadMoreButton) loadMoreButton.style.display = 'block';
            }
        } else {
            // Si quedan items por renderizar, asegúrate que el botón está visible
             if (loadMoreButton) loadMoreButton.style.display = 'block';
        }
    }

    // --- createTradeupElement y createSkinsSection sin cambios ---
    // ... (pega tus funciones createTradeupElement y createSkinsSection aquí) ...
        // Función para crear el elemento de cada tradeup (manteniendo el formato)
        function createTradeupElement(tradeup, index) {
                const tradeupDiv = document.createElement('div');
                tradeupDiv.className = 'tradeup-item';

                // Cabecera del tradeup: nombre y detalles
                const tradeupHeader = document.createElement('div');
                tradeupHeader.className = 'tradeup-header';

                const nameHeading = document.createElement('h2');
                nameHeading.textContent = `Tradeup-N°${index + 1}`;

                const detailsDiv = document.createElement('div');
                detailsDiv.className = 'tradeup-details';
                detailsDiv.innerHTML = `         
                    <p><strong>Odds:</strong> ${tradeup.odds_to_profit ? tradeup.odds_to_profit.toFixed(2) : 'N/A'} %</p>
                    <p><strong>Cost:</strong> $${tradeup.tradeup_cost ? tradeup.tradeup_cost.toFixed(2) : 'N/A'}</p>
                    <p><strong>Profitability:</strong> ${tradeup.profitability ? (tradeup.profitability + 100).toFixed(2) : 'N/A'} %</p>
                    <p><strong>Profit per trade:</strong> $${tradeup.mean_profit ? tradeup.mean_profit.toFixed(2) : 'N/A'}</p>
                `;

                tradeupHeader.appendChild(detailsDiv);
                tradeupHeader.appendChild(nameHeading);

                tradeupDiv.appendChild(tradeupHeader);

                // Secciones de skins: inputs y outputs
                const inputsDiv = createSkinsSection(tradeup.input_skins, 'Inputs', false);
                const outputsDiv = createSkinsSection(tradeup.output_skins, 'Outputs', true, tradeup.tradeup_cost);

                // Contenedor para las secciones de inputs y outputs (flex)
                const sectionsContainer = document.createElement('div');
                sectionsContainer.className = 'sections-container'; // Nuevo contenedor
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
                            frameBackground = (skin.sell_price > (tradeupCost / 10))
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
    // --- Fin de createTradeupElement y createSkinsSection ---

    // Función para ordenar los tradeups (con opción de no reiniciar renderizado)
    function sortTradeups(tradeups, sortBy, shouldRender = true) {
        tradeups.sort((a, b) => {
            let valA, valB;
            switch (sortBy) {
                case 'odds':
                    valA = a.odds_to_profit ?? -Infinity;
                    valB = b.odds_to_profit ?? -Infinity;
                    break;
                case 'cost':
                     // Ordenar por costo ascendente (más barato primero)
                     valA = a.tradeup_cost ?? Infinity;
                     valB = b.tradeup_cost ?? Infinity;
                     return valA - valB; // Cambio aquí para ascendente
                case 'profitPerTrade':
                    valA = a.mean_profit ?? -Infinity;
                    valB = b.mean_profit ?? -Infinity;
                    break;
                case 'profitability':
                default:
                    valA = a.profitability ?? -Infinity;
                    valB = b.profitability ?? -Infinity;
                    break;
            }
             // Orden descendente por defecto (excepto costo)
             return valB - valA;
        });

        if (shouldRender) {
            // Reinicia el renderizado tras la ordenación
            currentBatchIndex = 0;
            container.innerHTML = ''; // Limpia el contenedor
            if (loadMoreButton) loadMoreButton.style.display = 'block'; // Asegura que el botón sea visible
            renderTradeupsBatch(); // Renderiza el primer lote ordenado
            // Puede ser necesario cargar más si el primer lote no llena la pantalla
            // Opcionalmente, llamar a loadMoreHandler() aquí si se desea precargar más
        }
    }

    // Manejador para cargar más datos (invocado por botón o observer)
    async function loadMoreHandler() {
        // Evita ejecuciones concurrentes
        if (isLoading) {
            console.log("Already loading...");
            return;
        }
        isLoading = true;
        if(loadMoreButton) loadMoreButton.disabled = true; // Deshabilita el botón durante la carga

        console.log("Load more handler triggered.");

        // Comprobar si necesitamos cargar más datos JSON
        // Carga si quedan menos items que un batch completo Y si hay más archivos
        let needsMoreData = (allTradeupData.length - currentBatchIndex < batchSize) && (currentJsonIndex < jsonFiles.length);

        if (needsMoreData) {
            console.log("Attempting to load next JSON file.");
            const loaded = await loadNextJsonFile();
            // Si la carga falló o no había más archivos, y no hay NADA renderizado aún, mostrar mensaje
             if (!loaded && currentBatchIndex === 0 && allTradeupData.length === 0) {
                 container.innerHTML = '<p>Error loading initial data or no data available.</p>';
                 if (loadMoreButton) loadMoreButton.style.display = 'none'; // Oculta el botón si falla la carga inicial
                 isLoading = false;
                 if(loadMoreButton) loadMoreButton.disabled = false;
                 return; // Salir si falla la carga inicial
             }
        }

        // Renderiza el siguiente lote disponible (con los datos recién cargados o los existentes)
        renderTradeupsBatch();

        isLoading = false; // Marca la carga como completa
        if(loadMoreButton) loadMoreButton.disabled = false; // Rehabilita el botón

         // Vuelve a verificar si el botón debe estar oculto después de renderizar
         if (currentBatchIndex >= allTradeupData.length && currentJsonIndex >= jsonFiles.length) {
             if (loadMoreButton) loadMoreButton.style.display = 'none';
             console.log("All data loaded and rendered after loadMoreHandler.");
         }
    }

    // --- IntersectionObserver Setup ---
    const observerOptions = {
        root: null, // relative to document viewport
        rootMargin: '0px',
        threshold: 0.1 // Trigger when 10% of the target is visible
    };

    const observerCallback = (entries) => {
        entries.forEach(entry => {
            // Llama a loadMoreHandler SOLO si el botón está visible Y no estamos ya al final de los datos
            if (entry.isIntersecting && !isLoading) {
                 // Verifica si realmente hay más por cargar o renderizar
                 const moreToRender = currentBatchIndex < allTradeupData.length;
                 const moreToLoad = currentJsonIndex < jsonFiles.length;
                 if (moreToRender || moreToLoad) {
                     console.log("Observer triggered loadMoreHandler.");
                     loadMoreHandler();
                 } else {
                     console.log("Observer detected button, but no more data to load or render.");
                     // Opcional: Desconectar el observer si ya no hay más datos
                     // observer.unobserve(entry.target);
                     // if(loadMoreButton) loadMoreButton.style.display = 'none';
                 }
            }
        });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // --- Event Listeners ---

    // Evento para el botón "Load More" (como fallback o si el observer falla)
    if (loadMoreButton) {
        loadMoreButton.addEventListener('click', () => {
             console.log("Manual button click.");
             loadMoreHandler();
        });
        // Start observing the button
        observer.observe(loadMoreButton); // <<< OBSERVE THE BUTTON
    } else {
        console.error("Load More button not found!");
    }


    // Evento para el select de ordenación
    if (sortBySelect) {
        sortBySelect.addEventListener('change', function() {
            sortTradeups(allTradeupData, this.value, true); // true = reiniciar renderizado
        });
    }

    // --- Initial Load ---
    console.log("Starting initial load...");
    // Carga el primer archivo JSON y luego renderiza el primer batch
    loadNextJsonFile().then((loaded) => {
        if (loaded) {
             // Ordena inicialmente por el valor por defecto del select ('profitability')
             sortTradeups(allTradeupData, sortBySelect.value, false); // Ordena sin renderizar aún
             renderTradeupsBatch(); // Renderiza el primer batch ordenado
        } else {
            // Maneja el fallo de carga inicial
            container.innerHTML = '<p>Failed to load initial tradeup data.</p>';
            if (loadMoreButton) loadMoreButton.style.display = 'none';
        }
    }).catch(error => {
         console.error("Error during initial load:", error);
         container.innerHTML = '<p>Error loading initial data.</p>';
         if (loadMoreButton) loadMoreButton.style.display = 'none';
    });

}); // End of DOMContentLoaded