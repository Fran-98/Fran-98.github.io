document.addEventListener('DOMContentLoaded', function() {
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('tradeups-container');
            data.forEach(tradeup => {
                const tradeupDiv = document.createElement('div');
                tradeupDiv.className = 'tradeup-item';

                const image = document.createElement('img');
                image.src = tradeup.image;
                image.alt = tradeup.name;

                const detailsDiv = document.createElement('div');
                detailsDiv.className = 'tradeup-details';

                const nameHeading = document.createElement('h2');
                nameHeading.textContent = tradeup.name;

                const floatParagraph = document.createElement('p');
                floatParagraph.textContent = `Float: ${tradeup.float}`;

                const priceParagraph = document.createElement('p');
                priceParagraph.textContent = `Price: ${tradeup.price}`;

                detailsDiv.appendChild(nameHeading);
                detailsDiv.appendChild(floatParagraph);
                detailsDiv.appendChild(priceParagraph);

                tradeupDiv.appendChild(image);
                tradeupDiv.appendChild(detailsDiv);

                container.appendChild(tradeupDiv);
            });
        })
        .catch(error => console.error('Error fetching data:', error));
});