async function fetchGoogleSheetData(url) {
    const response = await fetch(url);
    if (!response.ok) {
        console.error('Failed to fetch data from:', url);
        throw new Error('Network response was not ok ' + response.statusText);
    }
    return await response.json();
}

const chart3Url = 'https://script.google.com/macros/s/AKfycbyI0zy06moFV6uYwVfe_zKSs9AMx01dAusGpjLnhcSVc2l6pYP2uO7yLVSpIan7eaA42w/exec?route=processed';
const cardsUrl = 'https://script.google.com/macros/s/AKfycbyI0zy06moFV6uYwVfe_zKSs9AMx01dAusGpjLnhcSVc2l6pYP2uO7yLVSpIan7eaA42w/exec?route=cards';
const actualUrl = 'https://script.google.com/macros/s/AKfycbyI0zy06moFV6uYwVfe_zKSs9AMx01dAusGpjLnhcSVc2l6pYP2uO7yLVSpIan7eaA42w/exec?route=actual';

async function createCharts() {
    try {
        // Fetch data for the processed chart
        const data3 = await fetchGoogleSheetData(chart3Url);

        const chart3Data = {
            labels: data3.map(item => item.month),
            datasets: [{
                label: 'Новые заявки',
                data: data3.map(item => item.newReqs),
                backgroundColor: '#26C6DA', // Новый цвет
                stack: 'Stack 0'
            }, {
                label: 'Обработанные заявки',
                data: data3.map(item => item.processedReqs),
                backgroundColor: '#66BB6A', // Новый цвет
                stack: 'Stack 1'
            }, {
                label: 'В процессе',
                data: data3.map(item => item.onProcess),
                backgroundColor: '#FFCA28', // Новый цвет
                stack: 'Stack 2'
            }, {
                label: 'Необработанные заявки',
                data: data3.map(item => item.notProcessed),
                backgroundColor: '#EF5350', // Новый цвет
                stack: 'Stack 3'
            }]
        };

        const ctx3 = document.getElementById('chart3').getContext('2d');
        new Chart(ctx3, {
            type: 'bar',
            data: chart3Data,
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Статус обработки заявок',
                        font: {
                            size: 18,
                        }
                    },
                    datalabels: {
                        display: true,
                        align: 'end',
                        anchor: 'end',
                        color: 'black',
                        font: {
                            weight: 'bold'
                        },
                        formatter: function(value) {
                            return value.toLocaleString();
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                    },
                    y: {
                        display: true,
                        grid: {
                            drawOnChartArea: true,
                        }
                    }
                }
            },
            plugins: [ChartDataLabels]
        });

        // Fetch data for the cards
        const cardData = await fetchGoogleSheetData(cardsUrl);

        // Update card values
        document.getElementById('finalViews').innerText = cardData[0].finalViews.toLocaleString();
        document.getElementById('finalSpentTarget').innerText = `$${cardData[0].finalSpentTarget.toLocaleString()}`;
        document.getElementById('finalSpentCompany').innerText = `$${cardData[0].finalSpentCompany.toLocaleString()}`;
        document.getElementById('finalReqs').innerText = cardData[0].finalReqs.toLocaleString();
        document.getElementById('finalProcessedReqs').innerText = cardData[0].finalProcessedReqs.toLocaleString();
        document.getElementById('finalAvaragePriceOfReq').innerText = `$${cardData[0].finalAvaragePriceOfReq.toFixed(2)}`;
        document.getElementById('finalNumOfMeets').innerText = cardData[0].finalNumOfMeets.toLocaleString();
        document.getElementById('finalSuccessMeets').innerText = cardData[0].finalSuccessMeets.toLocaleString();
        document.getElementById('finalAvaragePriceOfMeets').innerText = `$${cardData[0].finalAvaragePriceOfMeets.toFixed(2)}`;

        // Fetch and display actual date
        const actualData = await fetchGoogleSheetData(actualUrl);
        const date = new Date(actualData[0].actualDate);
        document.getElementById('actualDate').innerText = `Актуально на: ${date.toLocaleDateString('ru-RU')}`;

        document.querySelector('.loader').style.display = 'none';
    } catch (error) {
        console.error('Error creating charts:', error);
        document.querySelector('.loader').style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', createCharts);
