async function fetchGoogleSheetData(url) {
    const response = await fetch(url);
    if (!response.ok) {
        console.error('Failed to fetch data from:', url);
        throw new Error('Network response was not ok ' + response.statusText);
    }
    return await response.json();
}

const chart1Url = 'https://script.google.com/macros/s/AKfycbyuj66s-C_F-8SOQpDbX46A0hxWt4wavcGl7QTk1LhxeE8tfpJ-xVXpEjMfYUzwpx6eBA/exec?route=reports';
const chart2Url = 'https://script.google.com/macros/s/AKfycbyuj66s-C_F-8SOQpDbX46A0hxWt4wavcGl7QTk1LhxeE8tfpJ-xVXpEjMfYUzwpx6eBA/exec?route=requests';
const cardsUrl = 'https://script.google.com/macros/s/AKfycbyuj66s-C_F-8SOQpDbX46A0hxWt4wavcGl7QTk1LhxeE8tfpJ-xVXpEjMfYUzwpx6eBA/exec?route=cards';

async function createCharts() {
    try {
        // Fetch data for the first chart
        const data1 = await fetchGoogleSheetData(chart1Url);

        const chart1Data = {
            labels: data1.map(item => `${item.month}\n(1 заявка - $${item.requestPrice.toFixed(2)})`),
            datasets: [{
                label: 'Просмотры в месяц (в тысячах)',
                data: data1.map(item => item.viewsPerMonth / 2000), // делим на 1000 для упрощения масштаба
                backgroundColor: '#42A5F5',
                stack: 'Stack 0'
            }, {
                label: 'Потраченная сумма (Таргет)',
                data: data1.map(item => item.amountSpentTarget),
                backgroundColor: '#66BB6A',
                stack: 'Stack 1'
            }, {
                label: 'Потраченная сумма (Услуга)',
                data: data1.map(item => item.amountSpentCompany),
                backgroundColor: '#FF7043', // Новый цвет
                stack: 'Stack 2'
            }, {
                label: 'Количество заявок',
                data: data1.map(item => item.numOfRequests),
                backgroundColor: '#29B6F6', // Новый цвет
                stack: 'Stack 3'
            }, {
                label: 'Обработанные заявки',
                data: data1.map(item => item.numOfProcessedRequests),
                backgroundColor: '#8D6E63',
                stack: 'Stack 4'
            }]
        };

        const ctx1 = document.getElementById('chart1').getContext('2d');
        new Chart(ctx1, {
            type: 'bar',
            data: chart1Data,
            options: {
                responsive: true,
                plugins: {
                    datalabels: {
                        display: true,
                        align: 'end',
                        anchor: 'end',
                        color: 'black',
                        font: {
                            weight: 'bold'
                        },
                        formatter: function(value, context) {
                            if (context.dataset.label === 'Просмотры в месяц (в тысячах)') {
                                return (value * 2000).toLocaleString(); // Возвращаем исходное значение
                            }
                            if (context.dataset.label.includes('Потраченная сумма')) {
                                return `$${value.toLocaleString()}`;
                            }
                            return value.toLocaleString();
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        ticks: {
                            callback: function(value) {
                                // Разбиваем строку с использованием '\n'
                                const tick = this.getLabelForValue(value);
                                return tick.split('\n');
                            }
                        }
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

        // Fetch data for the second chart
        const data2 = await fetchGoogleSheetData(chart2Url);

        const chart2Data = {
            labels: data2.map(item => `${item.month}\nКоличество встреч: ${item.numOfMeets}`),
            datasets: [{
                label: 'Средняя стоимость заявки',
                data: data2.map(item => item.avarageReq),
                backgroundColor: '#AB47BC', // Новый цвет
                stack: 'Stack 1'
            }]
        };

        const ctx2 = document.getElementById('chart2').getContext('2d');
        new Chart(ctx2, {
            type: 'bar',
            data: chart2Data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    datalabels: {
                        display: true,
                        align: 'end',
                        anchor: 'end',
                        color: 'black',
                        font: {
                            weight: 'bold'
                        },
                        formatter: function(value) {
                            return `$${value.toLocaleString()}`;
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        ticks: {
                            callback: function(value) {
                                const tick = this.getLabelForValue(value);
                                return tick.split('\n'); // Разбиваем строку с использованием '\n'
                            }
                        }
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

        document.querySelector('.loader').style.display = 'none';
    } catch (error) {
        console.error('Error creating charts:', error);
        document.querySelector('.loader').style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', createCharts);
