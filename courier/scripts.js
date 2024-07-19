async function fetchGoogleSheetData(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
    }
    return await response.json();
}

const googleSheetUrl = 'https://script.googleusercontent.com/macros/echo?user_content_key=ku7mltm07rRj8Zq3BBufpH4HHyoG4zobdVhRx16hROG-Lt1fjVHwf1Twu54oB5hMmvA4f5Gp4v9II61X1ENty_hGwZReGxxJm5_BxDlH2jW0nuo2oDemN9CCS2h10ox_1xSncGQajx_ryfhECjZEnD1zAvpxYq6r2EMbOrZhm2N-l19A13J-j5l8KBlXdGYQpmrye8wfFofgPewgjubAog9rD9RAr18GNTvyxRgAqfy9I81qUcOFWdz9Jw9Md8uu&lib=MxCcr65cCiDZFciAQak0wvD5qD2GCOdkK';

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

function updateHeader(dates) {
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];
    const headerTitle = document.getElementById('header-title');
    headerTitle.textContent = `Apexpizza Kuryerlar statistikasi (oxirgi 7 kun: ${firstDate} - ${lastDate})`;
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

        updateHeader(dates);

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
        const vacationData = newData.map(record => record.vacations);

        const maxYSecondChart = calculateMaxY([...onTimeData, ...lateData, ...absentData, ...vacationData], 0.3);

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
                        backgroundColor: 'rgba(34, 139, 34, 0.8)',
                        borderColor: 'rgba(34, 139, 34, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Kechikkanlar',
                        data: lateData,
                        backgroundColor: 'rgb(255, 0, 0)',
                        borderColor: 'rgba(220, 20, 60, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Ishga chiqmaganlar',
                        data: absentData,
                        backgroundColor: 'rgb(0, 0, 0)',
                        borderColor: 'rgb(0, 0, 0)',
                        borderWidth: 1
                    },
                    {
                        label: 'Dam olganlar',
                        data: vacationData,
                        backgroundColor: 'rgba(255, 165, 0, 0.8)',
                        borderColor: 'rgba(255, 165, 0, 0.8)',
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