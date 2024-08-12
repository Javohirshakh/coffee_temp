async function fetchGoogleSheetData(url) {
    const response = await fetch(url);
    if (!response.ok) {
        console.error('Failed to fetch data from:', url);
        throw new Error('Network response was not ok ' + response.statusText);
    }
    return await response.json();
}

const chart1Url = 'https://script.google.com/macros/s/AKfycbyI0zy06moFV6uYwVfe_zKSs9AMx01dAusGpjLnhcSVc2l6pYP2uO7yLVSpIan7eaA42w/exec?route=reports';
const chart2Url = 'https://script.google.com/macros/s/AKfycbyI0zy06moFV6uYwVfe_zKSs9AMx01dAusGpjLnhcSVc2l6pYP2uO7yLVSpIan7eaA42w/exec?route=requests';
const chart3Url = 'https://script.google.com/macros/s/AKfycbyI0zy06moFV6uYwVfe_zKSs9AMx01dAusGpjLnhcSVc2l6pYP2uO7yLVSpIan7eaA42w/exec?route=processed';
const cardsUrl = 'https://script.google.com/macros/s/AKfycbyI0zy06moFV6uYwVfe_zKSs9AMx01dAusGpjLnhcSVc2l6pYP2uO7yLVSpIan7eaA42w/exec?route=cards';
const actualDateUrl = 'https://script.google.com/macros/s/AKfycbyI0zy06moFV6uYwVfe_zKSs9AMx01dAusGpjLnhcSVc2l6pYP2uO7yLVSpIan7eaA42w/exec?route=actual';

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
        const startDate = data1[0].month;
        const endDate = data1[data1.length - 1].month;

        const chart1Data = {
            labels: data1.map(item => `${item.month}\n(1 заявка - $${item.requestPrice.toFixed(2)})`),
            datasets: [{
                label: 'Просмотры в месяц',
                data: data1.map(item => item.viewsPerMonth / 1000), // делим на 1000 для упрощения масштаба
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
                            if (context.dataset.label === 'Просмотры в месяц ') {
                                return (value * 1000).toLocaleString(); // Возвращаем исходное значение
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

        // Fetch data for the processed chart (second chart)
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

        // Fetch data for the third chart
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
                    title: {
                        display: true,
                        text: 'Средняя стоимость заявок',
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

        // Calculate total spent and cost per sale
        const totalSpent = cardData[0].finalSpentTarget + cardData[0].finalSpentCompany;
        document.getElementById('totalSpent').innerText = `$${totalSpent.toLocaleString()}`;

        const costPerSale = totalSpent / cardData[0].finalSuccessMeets;
        document.getElementById('costPerSale').innerText = `$${costPerSale.toFixed(2)}`;

        // Update title with date range
        document.getElementById('chartTitle').innerText = `ADS reports (${startDate} - ${endDate})`;

        document.querySelector('.loader').style.display = 'none';
    } catch (error) {
        console.error('Error creating charts:', error);
        document.querySelector('.loader').style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', createCharts);

