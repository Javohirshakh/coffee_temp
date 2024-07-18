async function fetchGoogleSheetData(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
    }
    return await response.json();
}

const googleSheetUrl = 'https://script.googleusercontent.com/macros/echo?user_content_key=hHdEPmXnkjubZpRuFrzFEZTJPudBjJCIsEzgBq5xWBPt2ZCVoBxwyiSwZ4P7oPL-67C6bOaATi2e3CGTxIpFaPnbdf3fQnGlm5_BxDlH2jW0nuo2oDemN9CCS2h10ox_1xSncGQajx_ryfhECjZEnHGEJMJ50ZXFGYsIEc_Ov4oJXIcQERq4ZufpzIosqAcpgIS4d0RfbHXp8W9T2nWLfk4-YCcVgxLFHQE99CojF9lIpQFeFvvMAtz9Jw9Md8uu&lib=MxCcr65cCiDZFciAQak0wvD5qD2GCOdkK';

let currentData = [];
let firstChart;
let secondChart;

function dataHasChanged(newData) {
    return JSON.stringify(newData) !== JSON.stringify(currentData);
}

function calculateMaxY(data, percentageIncrease) {
    const maxDataValue = Math.max(...data);
    return Math.ceil(maxDataValue + (maxDataValue * percentageIncrease));
}

async function updateData() {
    try {
        const newData = await fetchGoogleSheetData(googleSheetUrl);

        if (!dataHasChanged(newData)) {
            return;
        }

        currentData = newData;

        // Data preparation for first chart
        const dates = newData.map(record => {
            const date = new Date(record.date);
            return date.toLocaleDateString('ru-RU'); // Format date as day.month.year
        });
        const ironData = newData.map(record => record.iron);
        const stateData = newData.map(record => record.state);
        const totalData = newData.map(record => record.total);

        const maxYFirstChart = calculateMaxY([...ironData, ...stateData, ...totalData], 0.3);

        // Destroy previous chart if it exists
        if (firstChart && typeof firstChart.destroy === 'function') {
            firstChart.destroy();
        }

        // Create first chart
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
                        max: maxYFirstChart
                    }
                },
                layout: {
                    padding: {
                        bottom: 20 // Добавляем нижний отступ
                    }
                },
                plugins: {
                    datalabels: {
                        anchor: 'end',
                        align: 'end',
                        formatter: (value) => Math.round(value),
                        color: '#000',
                        padding: {
                            top: 10 // Добавляем верхний отступ для меток данных
                        }
                    }
                }
            },
            plugins: [ChartDataLabels]
        });

        // Data preparation for second chart
        const onTimeData = newData.map(record => record.onTimeEmployees);
        const lateData = newData.map(record => record.lateEmployees);
        const absentData = newData.map(record => record.absentEmployees);

        const maxYSecondChart = calculateMaxY([...onTimeData, ...lateData, ...absentData], 0.3);

        // Destroy previous chart if it exists
        if (secondChart && typeof secondChart.destroy === 'function') {
            secondChart.destroy();
        }

        // Create second chart
        secondChart = new Chart(document.getElementById('secondChart'), {
            type: 'bar',
            data: {
                labels: dates,
                datasets: [
                    {
                        label: 'Vaqtida kelganlar',
                        data: onTimeData,
                        backgroundColor: 'rgba(75, 192, 192, 0.8)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Kechikkanlar',
                        data: lateData,
                        backgroundColor: 'rgba(255, 206, 86, 0.8)',
                        borderColor: 'rgba(255, 206, 86, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Ishga chiqmaganlar',
                        data: absentData,
                        backgroundColor: 'rgba(255, 99, 132, 0.8)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: maxYSecondChart
                    }
                },
                layout: {
                    padding: {
                        bottom: 20 // Добавляем нижний отступ
                    }
                },
                plugins: {
                    datalabels: {
                        anchor: 'end',
                        align: 'end',
                        formatter: (value) => Math.round(value),
                        color: '#000',
                        padding: {
                            top: 10 // Добавляем верхний отступ для меток данных
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
