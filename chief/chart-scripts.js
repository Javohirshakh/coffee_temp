async function fetchGoogleSheetData(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
    }
    return await response.json();
}

const googleSheetUrl = 'https://script.google.com/macros/s/AKfycbzgiqEkCF3qdWJgRI6zAPzoBTwVSNU_HYm75VoFGDyzSQCj6vwxe3VQ0WkL_ncfZy0D/exec?route=diagrams';

let currentData = [];
let firstChart;
let secondChart;
let deliveryChart;

function dataHasChanged(newData) {
    return JSON.stringify(newData) !== JSON.stringify(currentData);
}

function calculateMaxY(data, percentageIncrease) {
    const maxDataValue = Math.max(...data);
    return Math.ceil(maxDataValue + (maxDataValue * percentageIncrease));
}

function updateHeader(dates) {
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];
    const headerTitle = document.getElementById('header-title');
    headerTitle.textContent = `Apexpizza Oshpazlar Statistikasi (oxirgi 7 kun: ${firstDate} - ${lastDate})`;
}

async function updateData() {
    try {
        const newData = await fetchGoogleSheetData(googleSheetUrl);

        if (!dataHasChanged(newData)) {
            return;
        }

        currentData = newData;

        const dates = newData.map(record => {
            const date = new Date(record.date);
            return date.toLocaleDateString('ru-RU');
        });
        const ironData = newData.map(record => record.iron);
        const stateData = newData.map(record => record.state);
        const totalData = newData.map(record => record.total);
        const onTimeData = newData.map(record => record.onTimeEmployees);
        const lateData = newData.map(record => record.lateEmployees);
        const absentData = newData.map(record => record.absentEmployees);
        const vacationData = newData.map(record => record.vacations);
        const onTimeDeliveries = newData.map(record => record.onTimeDeliveries);
        const lateDeliveries = newData.map(record => record.lateDeliveries);
        const avgDeliveryTime = newData.map(record => record.averageTimeofDeliveries);

        updateHeader(dates);

        const maxYFirstChart = calculateMaxY([...ironData, ...stateData, ...totalData], 0.3);
        const maxYSecondChart = calculateMaxY([...onTimeData, ...lateData, ...absentData, ...vacationData], 0.3);
        const maxYDeliveryChart = calculateMaxY([...onTimeDeliveries, ...lateDeliveries, ...avgDeliveryTime], 0.3);

        if (firstChart && typeof firstChart.destroy === 'function') firstChart.destroy();
        if (secondChart && typeof secondChart.destroy === 'function') secondChart.destroy();
        if (deliveryChart && typeof deliveryChart.destroy === 'function') deliveryChart.destroy();

        firstChart = new Chart(document.getElementById('firstChart'), {
            type: 'bar',
            data: {
                labels: dates,
                datasets: [
                    {
                        label: 'Jelezniy grafik',
                        data: ironData,
                        backgroundColor: 'rgba(54, 162, 235, 0.8)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Shtat',
                        data: stateData,
                        backgroundColor: 'rgba(255, 206, 86, 0.8)',
                        borderColor: 'rgba(255, 206, 86, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Ishga chiqqanlar',
                        data: totalData,
                        backgroundColor: 'rgba(75, 192, 192, 0.8)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: maxYFirstChart,
                        grid: {
                            drawOnChartArea: true,
                        }
                    }
                },
                layout: {
                    padding: {
                        bottom: 20
                    }
                },
                plugins: {
                    datalabels: {
                        anchor: 'end',
                        align: 'end',
                        formatter: (value) => Math.round(value),
                        color: '#000',
                        padding: {
                            top: 10
                        }
                    }
                }
            },
            plugins: [ChartDataLabels]
        });

        secondChart = new Chart(document.getElementById('secondChart'), {
            type: 'bar',
            data: {
                labels: dates,
                datasets: [
                    {
                        label: 'Vaqtida kelganlar',
                        data: onTimeData,
                        backgroundColor: 'rgba(34, 139, 34, 0.8)',
                        borderColor: 'rgba(34, 139, 34, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Kechikkanlar',
                        data: lateData,
                        backgroundColor: 'rgba(255, 0, 0, 0.8)',
                        borderColor: 'rgba(220, 20, 60, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Ishga chiqmaganlar',
                        data: absentData,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        borderColor: 'rgba(0, 0, 0, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Dam olganlar',
                        data: vacationData,
                        backgroundColor: 'rgba(255, 165, 0, 0.8)',
                        borderColor: 'rgba(255, 165, 0, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: maxYSecondChart,
                        grid: {
                            drawOnChartArea: true,
                        }
                    }
                },
                layout: {
                    padding: {
                        bottom: 20
                    }
                },
                plugins: {
                    datalabels: {
                        anchor: 'end',
                        align: 'end',
                        formatter: (value) => Math.round(value),
                        color: '#000',
                        padding: {
                            top: 10
                        }
                    }
                }
            },
            plugins: [ChartDataLabels]
        });

        deliveryChart = new Chart(document.getElementById('deliveryChart'), {
            type: 'bar',
            data: {
                labels: dates,
                datasets: [
                    {
                        label: 'Vaqtida tayyor bo\'lgan',
                        data: onTimeDeliveries,
                        backgroundColor: 'rgba(34, 139, 34, 0.8)',
                        borderColor: 'rgba(34, 139, 34, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Kech tayyor bo\'lgan',
                        data: lateDeliveries,
                        backgroundColor: 'rgba(255, 0, 0, 0.8)',
                        borderColor: 'rgba(220, 20, 60, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Oʻrtacha tayyorlanish vaqti',
                        data: avgDeliveryTime,
                        backgroundColor: 'rgba(75, 192, 192, 0.8)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: maxYDeliveryChart,
                        grid: {
                            drawOnChartArea: true,
                        }
                    }
                },
                layout: {
                    padding: {
                        bottom: 20
                    }
                },
                plugins: {
                    datalabels: {
                        anchor: 'end',
                        align: 'end',
                        formatter: (value) => Math.round(value),
                        color: '#000',
                        padding: {
                            top: 10
                        }
                    }
                }
            },
            plugins: [ChartDataLabels]
        });

        document.querySelector('.loader').style.display = 'none';
    } catch (error) {
        console.error('Error updating data:', error);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    updateData();
    setInterval(updateData, 10000); // Refresh data every 10 seconds
});
