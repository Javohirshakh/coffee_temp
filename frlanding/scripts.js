const BASE_API_URL = 'https://script.google.com/macros/s/AKfycby-Fnt1tiOaZ7WOR23RJYFTaQrdCnwLPCyEya-TyBxGC0oNJgfACGUMIM4Ma3L8QlpnZg/exec?route=';

const dailyUrl = `${BASE_API_URL}daily`;
const processedUrl = `${BASE_API_URL}processed`;
const reportsUrl = `${BASE_API_URL}reports`; // Добавлено определение переменной
const actualDateUrl = `${BASE_API_URL}actual`;
const meetsUrl = `${BASE_API_URL}meets`;

let dailyChartInstance = null;
let processedChartInstance = null;
let meetsChartInstance = null;
let previousDailyData = null;
let previousProcessedData = null;
let previousMeetsData = null;

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

        // Daily Chart
        const dailyData = await fetchGoogleSheetData(dailyUrl);

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
                    backgroundColor: '#8000FF',
                    stack: 'Stack 3'
                }, {
                    label: 'Необработанные заявки',
                    data: dailyData.map(item => item.notProcessedReqs || 0),
                    backgroundColor: '#EF5350',
                    stack: 'Stack 4'
                }]
            };

            const dailyCtx = document.getElementById('dailyChart').getContext('2d');

            if (dailyChartInstance) {
                dailyChartInstance.destroy();
            }

            const allDailyValues = dailyData.flatMap(item => [
                item.newReqs || 0, 
                item.qualifiedReqs || 0, 
                item.repeatedCalls || 0, 
                item.clientNotRespond || 0, 
                item.notProcessedReqs || 0
            ]);
            const maxDailyValue = Math.max(...allDailyValues);
            const yAxisMax = maxDailyValue * 1.2;

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
                                }
                            }
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
                                return value ? value.toLocaleString() : '0';
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
                                ctx.fillStyle = '#8000FF';
                                ctx.fillRect(x, y, 7, 7);

                                ctx.strokeStyle = '#FFFFFF';
                                ctx.lineWidth = 2;
                                ctx.beginPath();
                                ctx.moveTo(x - 3, y - 3);
                                ctx.lineTo(x + 7, y + 7);
                                ctx.moveTo(x + 7, y - 3);
                                ctx.lineTo(x - 3, y + 7);
                                ctx.stroke();
                                ctx.restore();
                            }
                        });
                    }
                }, ChartDataLabels]
            });
        }

        // Meets Chart
        const meetsData = await fetchGoogleSheetData(meetsUrl);

        if (isDataChanged(meetsData, previousMeetsData)) {
            previousMeetsData = meetsData;

            const meetsChartData = {
                labels: meetsData.map(item => new Date(item.date).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'short'
                })),
                datasets: [{
                    label: 'Назначенные встречи',
                    data: meetsData.map(item => item.appointedMeets || 0),
                    backgroundColor: '#42A5F5',
                    stack: 'Stack 0'
                }, {
                    label: 'Проведенные встречи',
                    data: meetsData.map(item => item.heldMeets || 0),
                    backgroundColor: '#66BB6A',
                    stack: 'Stack 1'
                }, {
                    label: 'Готовы к встрече',
                    data: meetsData.map(item => item.readyForMeets || 0),
                    backgroundColor: '#FF5733',
                    stack: 'Stack 2'
                }]
            };

            const meetsCtx = document.getElementById('meetsChart').getContext('2d');

            if (meetsChartInstance) {
                meetsChartInstance.destroy();
            }

            const allMeetsValues = meetsData.flatMap(item => [item.appointedMeets || 0, item.heldMeets || 0, item.readyForMeets || 0]);

            const maxMeetsValue = Math.max(...allMeetsValues);
            const meetsYAxisMax = maxMeetsValue * 1.2;

            meetsChartInstance = new Chart(meetsCtx, {
                type: 'bar',
                data: meetsChartData,
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Встречи за последние 10 дней',
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
                                return value ? value.toLocaleString() : '0';
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
                            max: meetsYAxisMax
                        }
                    }
                },
                plugins: [ChartDataLabels]
            });
        }

        // Processed Chart
        const processedData = await fetchGoogleSheetData(processedUrl);

        if (isDataChanged(processedData, previousProcessedData)) {
            previousProcessedData = processedData;

            const processedChartData = {
                labels: processedData.map(item => item.month),
                datasets: [{
                    label: 'Новые заявки',
                    data: processedData.map(item => item.newReqs || 0),
                    backgroundColor: '#26C6DA',
                    stack: 'Stack 0'
                }, {
                    label: 'Квалифицировано',
                    data: processedData.map(item => item.processedReqs || 0),
                    backgroundColor: '#66BB6A',
                    stack: 'Stack 1'
                }, {
                    label: 'Повторные звонки',
                    data: processedData.map(item => item.onProcess || 0),
                    backgroundColor: '#FFCA28',
                    stack: 'Stack 2'
                }, {
                    label: 'Необработанные заявки',
                    data: processedData.map(item => item.notProcessed || 0),
                    backgroundColor: '#EF5350',
                    stack: 'Stack 3'
                }]
            };

            const processedCtx = document.getElementById('processedChart').getContext('2d');

            if (processedChartInstance) {
                processedChartInstance.destroy();
            }

            processedChartInstance = new Chart(processedCtx, {
                type: 'bar',
                data: processedChartData,
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
                            color: 'black',
                            anchor: 'end',
                            align: 'top',
                            font: {
                                weight: 'bold'
                            },
                            formatter: function(value) {
                                return value ? value.toLocaleString() : '0';
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
        }

        document.querySelector('.loader').style.display = 'none';
    } catch (error) {
        console.error('Error creating charts:', error);
        document.querySelector('.loader').style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', createCharts);
setInterval(createCharts, 10000); // Update data every 10 seconds
