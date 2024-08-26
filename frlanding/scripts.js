const BASE_API_URL = 'https://script.google.com/macros/s/AKfycbzeJmNGzBJE5kebDGRDEVIkxETo8toNEHEI5vEDJ164BiQBSNUmz9Dzja_zKVROtS87ug/exec?route=';

const dailyUrl = `${BASE_API_URL}daily`;
const processedUrl = `${BASE_API_URL}processed`;
const reportsUrl = `${BASE_API_URL}reports`;
const actualDateUrl = `${BASE_API_URL}actual`;

let dailyChartInstance = null;
let processedChartInstance = null;
let previousDailyData = null;
let previousProcessedData = null;

async function fetchGoogleSheetData(url) {
    const response = await fetch(url);
    if (!response.ok) {
        console.error('Failed to fetch data from:', url);
        throw new Error('Network response was not ok ' + response.statusText);
    }
    return await response.json();
}

function isDataChanged(newData, previousData) {
    if (!previousData) return true; // Если предыдущих данных нет, значит они изменились
    return JSON.stringify(newData) !== JSON.stringify(previousData);
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

        // Fetch data for the daily chart
        const dailyData = await fetchGoogleSheetData(dailyUrl);

        if (!isDataChanged(dailyData, previousDailyData)) {
            // console.log('Daily data has not changed, skipping chart update.');
        } else {
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
                    backgroundColor: '#FFA500', // Оранжевый цвет
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
                                // Настройки легенды
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
                                weight: 'bold' // Делает текст жирным
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
                            max: yAxisMax // Установка максимального значения для оси Y
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
                                const x = box.left + 4; // Корректируем позицию по X
                                const y = box.top + 4; // Корректируем позицию по Y

                                // Рисуем оранжевый прямоугольник
                                ctx.save();
                                ctx.fillStyle = '#FFA500';
                                ctx.fillRect(x, y, 7, 7);

                                // Рисуем белый крестик
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
        }

        // Fetch data for the processed chart
        const processedData = await fetchGoogleSheetData(processedUrl);

        if (!isDataChanged(processedData, previousProcessedData)) {
            // console.log('Processed data has not changed, skipping chart update.');
        } else {
            previousProcessedData = processedData;

            // Fetch data from the reports route to get total spent and views
            const reportsData = await fetchGoogleSheetData(reportsUrl);

            // Update the title to show the number of months
            const numberOfMonths = reportsData.length;
            document.getElementById('chartTitle').innerText = `ADS reports (последние ${numberOfMonths} месяцев)`;

            // Create a map for easy lookup of views and total spent by month
            const reportsMap = reportsData.reduce((map, item) => {
                const totalSpent = item.amountSpentTarget + item.amountSpentCompany;
                map[item.month] = {
                    totalSpent,
                    views: item.viewsPerMonth
                };
                return map;
            }, {});

            const processedChartData = {
                labels: processedData.map(item => {
                    const report = reportsMap[item.month];
                    if (report) {
                        return `${item.month}\n$${report.totalSpent?.toLocaleString() || '0'} - ${report.views?.toLocaleString() || '0'}`;
                    }
                    return item.month;
                }),
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

            // Уничтожаем старый график, если он существует
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
                                weight: 'bold' // Делает текст жирным
                            },
                            formatter: function(value) {
                                return value ? value.toLocaleString() : '';
                            }
                        }
                    },
                    scales: {
                        x: {
                            display: true,
                            ticks: {
                                callback: function(value) {
                                    const tick = this.getLabelForValue(value);
                                    return tick.split('\n'); // Разделение меток для лучшего отображения
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
