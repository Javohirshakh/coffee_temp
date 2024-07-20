async function fetchCardData(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
    }
    return await response.json();
}

const cardDataUrl = 'https://script.googleusercontent.com/macros/echo?user_content_key=0mpA8Ze571hdOoUEzUNQJ73EYcbHKQcHtznps5WgOdUUyJU9WqFUUUjcLwmUaJJvyofF1y9dbz7CCbr6fbtreA9FE1x0pUwtm5_BxDlH2jW0nuo2oDemN9CCS2h10ox_1xSncGQajx_ryfhECjZEnE1xcZFJhvKpMpdpZf_TcYIYFJxe-Rt8j2Om6ir6ZGXzZjkoZOLCncilAlUPCoN1Batp9JymnDkDfQVFhMm94v5Szh5IoGA0-tz9Jw9Md8uu&lib=MxCcr65cCiDZFciAQak0wvD5qD2GCOdkK';

async function updateCards() {
    try {
        const cardData = await fetchCardData(cardDataUrl);
        const data = cardData[0]; // Предположим, что данные в массиве

        const cardsContainer = document.getElementById('cards-container');
        cardsContainer.innerHTML = '';

        const cards = [
            {
                title: 'Vaqtida yetkazilgan buyurtmalar (%)',
                value: `${(data.onTimeDeliveryPercentage * 100).toFixed(2)}%`,
                previous: `${(data.pwOnTimeDeliveryPercentage * 100).toFixed(2)}%`,
                improvement: data.onTimeDeliveryPercentage >= data.pwOnTimeDeliveryPercentage
            },
            {
                title: 'Yetkazib berish o\'rtacha vaqti',
                value: `${data.averageDeliveryTime.toFixed(2)} min`,
                previous: `${data.pwAverageDeliveryTime.toFixed(2)} min`,
                improvement: data.averageDeliveryTime <= data.pwAverageDeliveryTime
            },
            {
                title: 'Jelezniy bo\'yicha kuryerlar soni',
                value: `${(data.ironToStateRatio * 100).toFixed(2)}%`,
                previous: `${(data.pwIronToStateRatio * 100).toFixed(2)}%`,
                improvement: data.ironToStateRatio >= data.pwIronToStateRatio
            },
            {
                title: 'Kuryerlar ishga vaqtida kelishi (%)',
                value: `${(data.onTimeArrivalPercentage * 100).toFixed(2)}%`,
                previous: `${(data.pwOnTimeArrivalPercentage * 100).toFixed(2)}%`,
                improvement: data.onTimeArrivalPercentage >= data.pwOnTimeArrivalPercentage
            }
        ];

        cards.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card p-4 bg-white rounded-lg shadow-lg flex flex-col items-center justify-center';
            cardElement.innerHTML = `
                <h4 class="font-bold text-sm mb-2">${card.title}</h4>
                <div class="flex items-center justify-between w-full mt-1">
                    <p class="current text-sm/[16px] font-medium whitespace-normal">${card.value}</p>
                    <p class="previous text-sm/[8px] font-normal whitespace-normal ${card.improvement ? 'improvement' : 'decline'}">${card.previous}</p>
                </div>`;
            cardsContainer.appendChild(cardElement);
        });

    } catch (error) {
        console.error('Error updating cards:', error);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    updateCards();
});
