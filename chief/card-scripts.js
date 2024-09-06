async function fetchCardData(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
    }
    return await response.json();
}

const cardDataUrl = 'https://script.google.com/macros/s/AKfycbzgiqEkCF3qdWJgRI6zAPzoBTwVSNU_HYm75VoFGDyzSQCj6vwxe3VQ0WkL_ncfZy0D/exec?route=cards';

async function updateCards() {
    try {
        const cardData = await fetchCardData(cardDataUrl);
        const data = cardData[0]; // Предположим, что данные в массиве

        const cardsContainer = document.getElementById('cards-container');
        cardsContainer.innerHTML = '';

        const cards = [
            {
                title: 'Vaqtida tayyorlangan buyurtmalar',
                value: `${(data.onTimeDeliveryPercentage * 100).toFixed(2)}%`,
                previous: `${(data.pwOnTimeDeliveryPercentage * 100).toFixed(2)}%`,
                improvement: data.onTimeDeliveryPercentage >= data.pwOnTimeDeliveryPercentage,
                reverse: false
            },
            {
                title: 'O\'rtacha tayyorlanish vaqti',
                value: `${data.averageDeliveryTime.toFixed(1)} min`,
                previous: `${data.pwAverageDeliveryTime.toFixed(1)} min`,
                improvement: data.averageDeliveryTime <= data.pwAverageDeliveryTime,
                reverse: true
            },
            {
                title: 'Jelezniy bo\'yicha oshpazlar soni',
                value: `${(data.ironToStateRatio * 100).toFixed(2)}%`,
                previous: `${(data.pwIronToStateRatio * 100).toFixed(2)}%`,
                improvement: data.ironToStateRatio >= data.pwIronToStateRatio,
                reverse: false
            },
            {
                title: 'Oshpazlar ishga vaqtida kelishi',
                value: `${(data.onTimeArrivalPercentage * 100).toFixed(2)}%`,
                previous: `${(data.pwOnTimeArrivalPercentage * 100).toFixed(2)}%`,
                improvement: data.onTimeArrivalPercentage >= data.pwOnTimeArrivalPercentage,
                reverse: false
            }
        ];

        cards.forEach(card => {
            const improvementClass = card.reverse ? (card.improvement ? 'improvement' : 'decline') : (card.improvement ? 'improvement' : 'decline');
            const cardElement = document.createElement('div');
            cardElement.className = 'card p-4 bg-white rounded-lg shadow-lg flex flex-col items-center justify-between';
            cardElement.innerHTML = `
                <h4 class="font-bold text-base mb-2">${card.title}</h4>
                <div class="flex items-center justify-between w-full mt-1">
                    <p class="current text-sm/[16px] font-medium whitespace-normal ${improvementClass}">${card.value}</p>
                    <p class="previous text-sm/[8px] font-normal previous">${card.previous}</p>
                </div>`;
            cardsContainer.appendChild(cardElement);
        });

    } catch (error) {
        console.error('Error updating cards:', error);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    updateCards();
    setInterval(updateCards, 10000); // Refresh data every 10 seconds
});
