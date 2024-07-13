async function fetchGoogleSheetData(url) {
    const response = await fetch(url);
    if (!response.ok) {
        console.error('Failed to fetch data from:', url);
        throw new Error('Network response was not ok ' + response.statusText);
    }
    return await response.json();
}

const dataUrl = 'https://script.google.com/macros/s/AKfycbwKBLizbuX30iCoyrby4lhOfUWRIFfdc3Xd63GaCViG2exJegVLqZ6yecdEKRFVQ32MSw/exec';

let chart1, chart2, allData, uniqueBranches;

async function createCharts() {
    document.querySelector('.loader').style.display = 'flex';
    try {
        allData = await fetchGoogleSheetData(dataUrl);
        uniqueBranches = [...new Set(allData.map(item => item.branch))];

        // Populate branch filter
        const branchFilter = document.getElementById('branchFilter');
        uniqueBranches.forEach(branch => {
            const option = document.createElement('option');
            option.value = branch;
            option.textContent = branch;
            branchFilter.appendChild(option);
        });

        const ctx1 = document.getElementById('chart1').getContext('2d');
        chart1 = new Chart(ctx1, {
            type: 'bar',
            data: {
                labels: [],
                datasets: []
            },
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

        const ctx2 = document.getElementById('chart2').getContext('2d');
        chart2 = new Chart(ctx2, {
            type: 'horizontalBar',
            data: {
                labels: uniqueBranches,
                datasets: [{
                    label: 'Процент присутствия',
                    data: uniqueBranches.map(branch => {
                        const branchData = allData.filter(item => item.branch === branch);
                        return (branchData.reduce((sum, item) => sum + item.branchPercentage, 0) / branchData.length) * 100;
                    }),
                    backgroundColor: uniqueBranches.map(branch => {
                        const branchData = allData.filter(item => item.branch === branch);
                        const branchPercentage = branchData.reduce((sum, item) => sum + item.branchPercentage, 0) / branchData.length;
                        return branchPercentage > 0.6 ? '#66BB6A' : '#FFA726';
                    }),
                }]
            },
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
                            return `${value.toFixed(2)}%`;
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

        document.querySelector('.loader').style.display = 'none';
    } catch (error) {
        console.error('Error creating charts:', error);
        document.querySelector('.loader').style.display = 'none';
    }
}

function updateCharts() {
    document.querySelector('.loader').style.display = 'flex';
    const dateRange = document.getElementById('dateRange').value.split(' to ');
    const filterType = document.getElementById('dataFilter').value;
    const selectedBranch = document.getElementById('branchFilter').value;

    const filteredData = allData.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= new Date(dateRange[0]) && itemDate <= new Date(dateRange[1]);
    });

    const branchFilteredData = selectedBranch === 'all' ? filteredData : filteredData.filter(item => item.branch === selectedBranch);
    const uniqueDates = [...new Set(branchFilteredData.map(item => item.date.split('T')[0]))];

    if (filterType === 'branch' && selectedBranch !== 'all') {
        chart1.data.labels = uniqueDates;
        chart1.data.datasets = [{
            label: 'Железный график',
            data: uniqueDates.map(date => {
                const dateData = branchFilteredData.filter(item => item.date.split('T')[0] === date);
                return dateData.reduce((sum, item) => sum + item.ironAttendance, 0);
            }),
            backgroundColor: '#42A5F5',
        }, {
            label: 'Фактическое присутствие',
            data: uniqueDates.map(date => {
                const dateData = branchFilteredData.filter(item => item.date.split('T')[0] === date);
                return dateData.reduce((sum, item) => sum + item.factAttendance, 0);
            }),
            backgroundColor: '#66BB6A',
        }, {
            label: 'Отдыхающие сотрудники',
            data: uniqueDates.map(date => {
                const dateData = branchFilteredData.filter(item => item.date.split('T')[0] === date);
                return dateData.reduce((sum, item) => sum + item.restingEmployee, 0);
            }),
            backgroundColor: '#FFA726',
        }];
    } else {
        chart1.data.labels = uniqueBranches;
        chart1.data.datasets = [{
            label: 'Железный график',
            data: uniqueBranches.map(branch => {
                const branchData = branchFilteredData.filter(item => item.branch === branch);
                return branchData.reduce((sum, item) => sum + item.ironAttendance, 0);
            }),
            backgroundColor: '#42A5F5',
        }, {
            label: 'Фактическое присутствие',
            data: uniqueBranches.map(branch => {
                const branchData = branchFilteredData.filter(item => item.branch === branch);
                return branchData.reduce((sum, item) => sum + item.factAttendance, 0);
            }),
            backgroundColor: '#66BB6A',
        }, {
            label: 'Отдыхающие сотрудники',
            data: uniqueBranches.map(branch => {
                const branchData = branchFilteredData.filter(item => item.branch === branch);
                return branchData.reduce((sum, item) => sum + item.restingEmployee, 0);
            }),
            backgroundColor: '#FFA726',
        }];
    }

    chart1.update();

    chart2.data.labels = uniqueBranches.sort((a, b) => {
        const aData = branchFilteredData.filter(item => item.branch === a);
        const bData = branchFilteredData.filter(item => item.branch === b);
        const aPercentage = aData.reduce((sum, item) => sum + item.branchPercentage, 0) / aData.length;
        const bPercentage = bData.reduce((sum, item) => sum + item.branchPercentage, 0) / bData.length;
        return bPercentage - aPercentage;
    });

    chart2.data.datasets[0].data = uniqueBranches.map(branch => {
        const branchData = branchFilteredData.filter(item => item.branch === branch);
        return (branchData.reduce((sum, item) => sum + item.branchPercentage, 0) / branchData.length) * 100;
    });

    chart2.data.datasets[0].backgroundColor = uniqueBranches.map(branch => {
        const branchData = branchFilteredData.filter(item => item.branch === branch);
        const branchPercentage = branchData.reduce((sum, item) => sum + item.branchPercentage, 0) / branchData.length;
        return branchPercentage > 0.6 ? '#66BB6A' : '#FFA726';
    });

    chart2.update();

    document.querySelector('.loader').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
    createCharts();
    flatpickr("#dateRange", {
        mode: "range",
        dateFormat: "Y-m-d",
        defaultDate: ["2024-07-01", "2024-07-10"],
        onChange: updateCharts
    });

    document.getElementById('dataFilter').addEventListener('change', (event) => {
        const branchFilterContainer = document.getElementById('branchFilterContainer');
        if (event.target.value === 'branch') {
            branchFilterContainer.style.display = 'block';
        } else {
            branchFilterContainer.style.display = 'none';
            document.getElementById('branchFilter').value = 'all';
        }
        updateCharts();
    });
    document.getElementById('branchFilter').addEventListener('change', updateCharts);
});
