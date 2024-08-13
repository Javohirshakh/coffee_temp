const BASE_API_URL = 'https://script.google.com/macros/s/AKfycbwh0b5RIwftF9Fph7cX7E0cFOxnNSK78JjxrZtKDiZoA5w-Zse6sPy2G-W4x1L1aj-HWg/exec?route=';

const chart1Url = `${BASE_API_URL}reports`;
const chart2Url = `${BASE_API_URL}requests`;
const chart3Url = `${BASE_API_URL}processed`;
const cardsUrl = `${BASE_API_URL}cards`;
const actualDateUrl = `${BASE_API_URL}actual`;
const dailyUrl = `${BASE_API_URL}daily`;

async function fetchGoogleSheetData(url) {
    const response = await fetch(url);
    if (!response.ok) {
        console.error('Failed to fetch data from:', url);
        throw new Error('Network response was not ok ' + response.statusText);
    }
    return await response.json();
}

async function createCharts() {
    try {
        // Fetch data for the actual date
        const actualDateData = await fetchGoogleSheetData(actualDateUrl);
        const actualDate = new Date(actualDateData[0].actualDate).toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        document.getElementById('actualDate').innerText = actualDate;

        // Fetch data for the first chart
        const data1 = await fetchGoogleSheetData(chart1Url);
        const numberOfMonths = data1.length;
        document.getElementById('chartTitle').innerText = `ADS reports (последние ${numberOfMonths} месяцев)`;

        const chart1Data = {
            labels: data1.map(item => `${item.month}\n(1 заявка - $${item.requestPrice.toFixed(2)})`),
            datasets: [{
                label: 'Просмотры в месяц',
                data: data1.map(item => item.viewsPerMonth / 1000),
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
                backgroundColor: '#FF7043',
                stack: 'Stack 2'
            }, {
                label: 'Количество заявок',
                data: data1.map(item => item.numOfRequests),
                backgroundColor: '#29B6F6',
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
                    title: {
                        display: true,
                        text: 'Общая статистика таргета',
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
                        formatter: function(value, context) {
                            if (context.dataset.label === 'Просмотры в месяц') {
                                return (value * 1000).toLocaleString();
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

        // Fetch data for the daily chart (new chart)
        const dailyData = await fetchGoogleSheetData(dailyUrl);

        const dailyChartData = {
            labels: dailyData.map(item => new Date(item.date).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'short'
            })),
            datasets: [{
                label: 'Новые заявки',
                data: dailyData.map(item => item.newReqs),
                backgroundColor: '#26C6DA',
                stack: 'Stack 0'
            }, {
                label: 'Обработанные заявки',
                data: dailyData.map(item => item.processedReqs),
                backgroundColor: '#66BB6A',
                stack: 'Stack 1'
            }, {
                label: 'В процессе',
                data: dailyData.map(item => item.onProcessReqs),
                backgroundColor: '#FFCA28',
                stack: 'Stack 2'
            }, {
                label: 'Необработанные заявки',
                data: dailyData.map(item => item.notProcessedReqs),
                backgroundColor: '#EF5350',
                stack: 'Stack 3'
            }]
        };

        const dailyCtx = document.getElementById('dailyChart').getContext('2d');

        // Calculate the maximum Y-axis value
        const allDailyValues = dailyData.flatMap(item => [item.newReqs, item.processedReqs, item.onProcessReqs, item.notProcessedReqs]);
        const maxDailyValue = Math.max(...allDailyValues);
        const yAxisMax = maxDailyValue * 1.2; // Increase by 20%

        new Chart(dailyCtx, {
            type: 'bar',
            data: dailyChartData,
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Ежедневная статистика за последние 10 дней',
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
                        },
                        max: yAxisMax // Set the maximum value for the Y-axis
                    }
                }
            },
            plugins: [ChartDataLabels]
        });

        // Fetch data for the processed chart (second chart)
        const data3 = await fetchGoogleSheetData(chart3Url);

        const chart3Data = {
            labels: data3.map(item => item.month),
            datasets: [{
                label: 'Новые заявки',
                data: data3.map(item => item.newReqs),
                backgroundColor: '#26C6DA',
                stack: 'Stack 0'
            }, {
                label: 'Обработанные заявки',
                data: data3.map(item => item.processedReqs),
                backgroundColor: '#66BB6A',
                stack: 'Stack 1'
            }, {
                label: 'В процессе',
                data: data3.map(item => item.onProcess),
                backgroundColor: '#FFCA28',
                stack: 'Stack 2'
            }, {
                label: 'Необработанные заявки',
                data: data3.map(item => item.notProcessed),
                backgroundColor: '#EF5350',
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

        // Fetch data for the third chart
        const data2 = await fetchGoogleSheetData(chart2Url);

        const chart2Data = {
            labels: data2.map(item => `${item.month}\nКоличество встреч: ${item.numOfMeets}`),
            datasets: [{
                label: 'Средняя стоимость встречи',
                data: data2.map(item => item.avarageReq),
                backgroundColor: '#AB47BC',
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
                    title: {
                        display: true,
                        text: 'Средняя стоимость встречи',
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

        // Calculate total spent and cost per sale
        const totalSpent = cardData[0].finalSpentTarget + cardData[0].finalSpentCompany;
        document.getElementById('totalSpent').innerText = `$${totalSpent.toLocaleString()}`;

        const costPerSale = totalSpent / cardData[0].finalSuccessMeets;
        document.getElementById('costPerSale').innerText = `$${costPerSale.toFixed(2)}`;

        document.querySelector('.loader').style.display = 'none';
    } catch (error) {
        console.error('Error creating charts:', error);
        document.querySelector('.loader').style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', createCharts);
