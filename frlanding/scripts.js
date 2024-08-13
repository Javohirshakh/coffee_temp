const BASE_API_URL = 'https://script.google.com/macros/s/AKfycbwh0b5RIwftF9Fph7cX7E0cFOxnNSK78JjxrZtKDiZoA5w-Zse6sPy2G-W4x1L1aj-HWg/exec?route=';

const dailyUrl = `${BASE_API_URL}daily`;
const processedUrl = `${BASE_API_URL}processed`;
const reportsUrl = `${BASE_API_URL}reports`;
const actualDateUrl = `${BASE_API_URL}actual`;

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

        // Fetch data for the daily chart
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

        // Fetch data for the processed chart
        const processedData = await fetchGoogleSheetData(processedUrl);

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
                    return `${item.month}\n$${report.totalSpent.toLocaleString()} - ${report.views.toLocaleString()}`;
                }
                return item.month;
            }),
            datasets: [{
                label: 'Новые заявки',
                data: processedData.map(item => item.newReqs),
                backgroundColor: '#26C6DA',
                stack: 'Stack 0'
            }, {
                label: 'Обработанные заявки',
                data: processedData.map(item => item.processedReqs),
                backgroundColor: '#66BB6A',
                stack: 'Stack 1'
            }, {
                label: 'В процессе',
                data: processedData.map(item => item.onProcess),
                backgroundColor: '#FFCA28',
                stack: 'Stack 2'
            }, {
                label: 'Необработанные заявки',
                data: processedData.map(item => item.notProcessed),
                backgroundColor: '#EF5350',
                stack: 'Stack 3'
            }]
        };

        const processedCtx = document.getElementById('processedChart').getContext('2d');
        new Chart(processedCtx, {
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
                        ticks: {
                            callback: function(value) {
                                const tick = this.getLabelForValue(value);
                                return tick.split('\n'); // Split label for better display
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

        document.querySelector('.loader').style.display = 'none';
    } catch (error) {
        console.error('Error creating charts:', error);
        document.querySelector('.loader').style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', createCharts);
setInterval(createCharts, 10000); // Update data every 10 seconds
