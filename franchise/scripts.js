const BASE_API_URL = 'https://script.google.com/macros/s/AKfycbzeJmNGzBJE5kebDGRDEVIkxETo8toNEHEI5vEDJ164BiQBSNUmz9Dzja_zKVROtS87ug/exec?route=';

const chart1Url = `${BASE_API_URL}reports`;
const chart2Url = `${BASE_API_URL}requests`;
const chart3Url = `${BASE_API_URL}processed`;
const cardsUrl = `${BASE_API_URL}cards`;
const actualDateUrl = `${BASE_API_URL}actual`;
const dailyUrl = `${BASE_API_URL}daily`;

let dailyChartInstance = null;
let previousDailyData = null;

async function fetchGoogleSheetData(url) {
    const response = await fetch(url);
    if (!response.ok) {
        console.error('Failed to fetch data from:', url);
        throw new Error('Network response was not ok ' + response.statusText);
    }
    return await response.json();
}

function isDataChanged(newData, previousData) {
    if (!previousData) return true;
    return JSON.stringify(newData) !== JSON.stringify(previousData);
}

async function createCharts() {
    try {
        const actualDateData = await fetchGoogleSheetData(actualDateUrl);
        const actualDate = new Date(actualDateData[0].actualDate).toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        document.getElementById('actualDate').innerText = actualDate;

        // Chart 1
        const data1 = await fetchGoogleSheetData(chart1Url);
        const numberOfMonths = data1.length;
        document.getElementById('chartTitle').innerText = `ADS reports (последние ${numberOfMonths} месяцев)`;

        const chart1Data = {
            labels: data1.map(item => `${item.month}\n(1 заявка - $${item.requestPrice?.toFixed(2) || 0})`),
            datasets: [{
                label: 'Просмотры в месяц',
                data: data1.map(item => item.viewsPerMonth / 1000),
                backgroundColor: '#42A5F5',
                stack: 'Stack 0'
            }, {
                label: 'Потраченная сумма (Таргет)',
                data: data1.map(item => item.amountSpentTarget || 0),
                backgroundColor: '#66BB6A',
                stack: 'Stack 1'
            }, {
                label: 'Потраченная сумма (Услуга)',
                data: data1.map(item => item.amountSpentCompany || 0),
                backgroundColor: '#FF7043',
                stack: 'Stack 2'
            }, {
                label: 'Количество заявок',
                data: data1.map(item => item.numOfRequests || 0),
                backgroundColor: '#29B6F6',
                stack: 'Stack 3'
            }, {
                label: 'Обработанные заявки',
                data: data1.map(item => item.numOfProcessedRequests || 0),
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
                            return value?.toLocaleString() || '';
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

        // Daily Chart
        const dailyData = await fetchGoogleSheetData(dailyUrl);
        // console.log("Daily Data:", dailyData); // Логирование данных для проверки

        if (isDataChanged(dailyData, previousDailyData)) {
            previousDailyData = dailyData;

            const dailyChartData = {
                labels: dailyData.map(item => new Date(item.date).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'short'
                })),
                datasets: [{
                    label: 'Новые заявки',
                    data: dailyData.map(item => item.newReqs || 0),
                    backgroundColor: '#26C6DA',
                    stack: 'Stack 0'
                }, {
                    label: 'Квалифицировано',
                    data: dailyData.map(item => item.qualifiedReqs || 0),
                    backgroundColor: '#66BB6A',
                    stack: 'Stack 1'
                }, {
                    label: 'Повторные звонки',
                    data: dailyData.map(item => item.repeatedCalls || 0),
                    backgroundColor: '#FFCA28',
                    stack: 'Stack 2'
                }, {
                    label: 'Клиент не ответил',
                    data: dailyData.map(item => item.clientNotRespond || 0),
                    backgroundColor: '#FFA500',
                    stack: 'Stack 3'
                }, {
                    label: 'Необработанные заявки',
                    data: dailyData.map(item => item.notProcessedReqs || 0),
                    backgroundColor: '#EF5350',
                    stack: 'Stack 4'
                }]
            };

            const dailyCtx = document.getElementById('dailyChart').getContext('2d');

            // Уничтожаем старый график, если он существует
            if (dailyChartInstance) {
                dailyChartInstance.destroy();
            }

            // Calculate the maximum Y-axis value
            const allDailyValues = dailyData.flatMap(item => [
                item.newReqs, 
                item.qualifiedReqs, 
                item.repeatedCalls, 
                item.clientNotRespond, 
                item.notProcessedReqs
            ]);
            const maxDailyValue = Math.max(...allDailyValues);
            const yAxisMax = maxDailyValue * 1.2; // Increase by 20%

            dailyChartInstance = new Chart(dailyCtx, {
                type: 'bar',
                data: dailyChartData,
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: true,
                            labels: {
                                generateLabels: function(chart) {
                                    const originalLabels = Chart.defaults.plugins.legend.labels.generateLabels(chart);
                                    return originalLabels.map(label => {
                                        if (label.text === 'Клиент не ответил') {
                                            label.boxWidth = 20;
                                            label.boxHeight = 20;
                                        }
                                        return label;
                                    });
                                },
                            },
                        },
                        title: {
                            display: true,
                            text: 'Ежедневная статистика за последние 10 дней',
                            font: {
                                size: 18,
                            }
                        },
                        datalabels: {
                            display: true,
                            color: 'black',
                            anchor: 'end',
                            align: 'top',
                            font: {
                                weight: 'bold'
                            },
                            formatter: function(value) {
                                return value ? value.toLocaleString() : '';
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
                            max: yAxisMax
                        }
                    }
                },
                plugins: [{
                    id: 'crossInLegend',
                    afterDraw: (chart) => {
                        const ctx = chart.ctx;
                        const legend = chart.legend;
                        const items = legend.legendItems;

                        items.forEach((item) => {
                            if (item.text === 'Клиент не ответил') {
                                const box = legend.legendHitBoxes[items.indexOf(item)];
                                const x = box.left + 4;
                                const y = box.top + 4;

                                ctx.save();
                                ctx.fillStyle = '#FFA500';
                                ctx.fillRect(x, y, 7, 7);

                                ctx.strokeStyle = '#FFFFFF';
                                ctx.lineWidth = 2;
                                ctx.beginPath();
                                ctx.moveTo(x + -3, y + -3);
                                ctx.lineTo(x + 7, y + 7);
                                ctx.moveTo(x + 7, y + -3);
                                ctx.lineTo(x + -3, y + 7);
                                ctx.stroke();
                                ctx.restore();
                            }
                        });
                    }
                }, ChartDataLabels]
            });

            // console.log("Daily Chart Instance:", dailyChartInstance); // Логирование объекта диаграммы
        }

        // Chart 3
        const data3 = await fetchGoogleSheetData(chart3Url);
        const chart3Data = {
            labels: data3.map(item => item.month),
            datasets: [{
                label: 'Новые заявки',
                data: data3.map(item => item.newReqs || 0),
                backgroundColor: '#26C6DA',
                stack: 'Stack 0'
            }, {
                label: 'Обработанные заявки',
                data: data3.map(item => item.processedReqs || 0),
                backgroundColor: '#66BB6A',
                stack: 'Stack 1'
            }, {
                label: 'В процессе',
                data: data3.map(item => item.onProcess || 0),
                backgroundColor: '#FFCA28',
                stack: 'Stack 2'
            }, {
                label: 'Необработанные заявки',
                data: data3.map(item => item.notProcessed || 0),
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
                            return value?.toLocaleString() || '';
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

        // Chart 2
        const data2 = await fetchGoogleSheetData(chart2Url);
        const chart2Data = {
            labels: data2.map(item => `${item.month}\nКоличество встреч: ${item.numOfMeets || 0}`),
            datasets: [{
                label: 'Средняя стоимость встречи',
                data: data2.map(item => item.avarageReq || 0),
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
                            return `$${value?.toLocaleString() || '0'}`;
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

        // Cards
        const cardData = await fetchGoogleSheetData(cardsUrl);

        document.getElementById('finalViews').innerText = cardData[0].finalViews?.toLocaleString() || '0';
        document.getElementById('finalSpentTarget').innerText = `$${cardData[0].finalSpentTarget?.toLocaleString() || '0'}`;
        document.getElementById('finalSpentCompany').innerText = `$${cardData[0].finalSpentCompany?.toLocaleString() || '0'}`;
        document.getElementById('finalReqs').innerText = cardData[0].finalReqs?.toLocaleString() || '0';
        document.getElementById('finalProcessedReqs').innerText = cardData[0].finalProcessedReqs?.toLocaleString() || '0';
        document.getElementById('finalAvaragePriceOfReq').innerText = `$${cardData[0].finalAvaragePriceOfReq?.toFixed(2) || '0.00'}`;
        document.getElementById('finalNumOfMeets').innerText = cardData[0].finalNumOfMeets?.toLocaleString() || '0';
        document.getElementById('finalSuccessMeets').innerText = cardData[0].finalSuccessMeets?.toLocaleString() || '0';
        document.getElementById('finalAvaragePriceOfMeets').innerText = `$${cardData[0].finalAvaragePriceOfMeets?.toFixed(2) || '0.00'}`;

        const totalSpent = (cardData[0].finalSpentTarget || 0) + (cardData[0].finalSpentCompany || 0);
        document.getElementById('totalSpent').innerText = `$${totalSpent.toLocaleString()}`;

        const costPerSale = totalSpent / (cardData[0].finalSuccessMeets || 1);
        document.getElementById('costPerSale').innerText = `$${costPerSale.toFixed(2)}`;

        document.querySelector('.loader').style.display = 'none';
    } catch (error) {
        console.error('Error creating charts:', error);
        document.querySelector('.loader').style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', createCharts);
