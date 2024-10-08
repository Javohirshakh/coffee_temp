async function fetchGoogleSheetData(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
    }
    return await response.json();
}

const googleSheetUrl = 'https://script.googleusercontent.com/macros/echo?user_content_key=y17k_DfYaeAEc1HBpCRM9ffn7i_SejNO3H5VXQ1uQgJhutlX-Di2eCOZ9qak0oYTvspdbaD3Bmb8pCst5_U0TlBD0NXZaeBym5_BxDlH2jW0nuo2oDemN9CCS2h10ox_1xSncGQajx_ryfhECjZEnHJDQVpaATL4h5a76uZ7FkIY7uUjskcnAUDhdmEV5-ymh8qf9t_bYnezyJKcnV3HuEXArVX0mpvP9niIksjnwrgCgbe6w284t9z9Jw9Md8uu&lib=MxCcr65cCiDZFciAQak0wvD5qD2GCOdkK';

let currentFilter = 'attendance';
let data = [];
let branchChart;
let percentageChart;
let pieChart;

async function updateData(startDate, endDate) {
    try {
        data = await fetchGoogleSheetData(googleSheetUrl);
        console.log(data);

        // Filter data by selected date range
        const filteredData = data.filter(record => {
            const date = new Date(record.date);
            return date >= startDate && date <= endDate;
        });

        // Data preparation for percentage chart
        const branches = Array.from(new Set(filteredData.map(record => record.branch)));
        const branchPercentages = branches.map(branch => {
            const branchRecords = filteredData.filter(record => record.branch === branch);
            const totalOnTime = branchRecords.reduce((sum, record) => sum + record.onTimeEmployees, 0);
            const totalEmployees = branchRecords.reduce((sum, record) => sum + record.ironAttendance, 0);
            return totalEmployees ? (totalOnTime / totalEmployees) * 100 : 0;
        });

        const sortedBranches = branches.map((branch, index) => ({
            branch,
            percentage: branchPercentages[index]
        })).sort((a, b) => b.percentage - a.percentage);

        const sortedBranchLabels = sortedBranches.map(item => item.branch);
        const sortedBranchData = sortedBranches.map(item => item.percentage);

        // Destroy previous chart if it exists
        if (percentageChart && typeof percentageChart.destroy === 'function') {
            percentageChart.destroy();
        }

        // Create percentage chart
        percentageChart = new Chart(document.getElementById('percentageChart'), {
            type: 'bar',
            data: {
                labels: sortedBranchLabels,
                datasets: [{
                    label: '(%) foiz ko\'rsatkichida',
                    data: sortedBranchData,
                    backgroundColor: sortedBranchData.map(value => {
                        const hue = ((100 - value) / 100) * 120; // Green to red
                        return `hsl(${hue}, 100%, 50%)`;
                    }),
                    borderColor: 'rgba(0, 0, 0, 0.1)',
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 100
                    }
                },
                plugins: {
                    datalabels: {
                        anchor: 'end',
                        align: 'end',
                        formatter: (value) => value % 1 === 0 ? value : value.toFixed(2),
                        color: '#000'
                    }
                }
            },
            plugins: [ChartDataLabels]
        });

        // Data preparation for pie chart
        const totalOnTime = filteredData.reduce((sum, record) => sum + record.onTimeEmployees, 0);
        const totalLate = filteredData.reduce((sum, record) => sum + record.lateEmployees, 0);
        const totalAbsent = filteredData.reduce((sum, record) => sum + record.absentEmployees, 0);

        // Destroy previous chart if it exists
        if (pieChart && typeof pieChart.destroy === 'function') {
            pieChart.destroy();
        }

        // Create pie chart
        pieChart = new Chart(document.getElementById('pieChart'), {
            type: 'pie',
            data: {
                labels: ['Vaqtida', 'Kechikkan', 'Kelmagan'],
                datasets: [{
                    data: [totalOnTime, totalLate, totalAbsent],
                    backgroundColor: [
                        'rgba(75, 192, 192, 0.8)',
                        'rgba(255, 206, 86, 0.8)',
                        'rgba(255, 99, 132, 0.8)'
                    ],
                    borderColor: [
                        'rgba(75, 192, 192, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(255, 99, 132, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    datalabels: {
                        formatter: (value) => value % 1 === 0 ? value : value.toFixed(2),
                        color: '#fff'
                    }
                }
            },
            plugins: [ChartDataLabels]
        });

        // Data preparation for branch chart
        const ironAttendance = branches.map(branch => {
            const branchRecords = filteredData.filter(record => record.branch === branch);
            return branchRecords.reduce((sum, record) => sum + record.ironAttendance, 0);
        });
        const factAttendance = branches.map(branch => {
            const branchRecords = filteredData.filter(record => record.branch === branch);
            return branchRecords.reduce((sum, record) => sum + record.factAttendance, 0);
        });
        const restingEmployee = branches.map(branch => {
            const branchRecords = filteredData.filter(record => record.branch === branch);
            return branchRecords.reduce((sum, record) => sum + record.restingEmployee, 0);
        });

        const onTimeEmployees = branches.map(branch => {
            const branchRecords = filteredData.filter(record => record.branch === branch);
            return branchRecords.reduce((sum, record) => sum + record.onTimeEmployees, 0);
        });
        const lateEmployees = branches.map(branch => {
            const branchRecords = filteredData.filter(record => record.branch === branch);
            return branchRecords.reduce((sum, record) => sum + record.lateEmployees, 0);
        });
        const absentEmployees = branches.map(branch => {
            const branchRecords = filteredData.filter(record => record.branch === branch);
            return branchRecords.reduce((sum, record) => sum + record.absentEmployees, 0);
        });

        const branchSelect = document.getElementById('branchSelect');
        branchSelect.innerHTML = '<option value="">Select Branch</option>';
        branches.forEach(branch => {
            const option = document.createElement('option');
            option.value = branch;
            option.textContent = branch;
            branchSelect.appendChild(option);
        });

        const branchChartConfig = {
            type: 'bar',
            data: {
                labels: branches,
                datasets: [{
                    label: 'Jelezniy grafik bo\'yicha',
                    data: ironAttendance,
                    backgroundColor: 'rgba(54, 162, 235, 0.8)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }, {
                    label: 'Xodimlar (fakt)',
                    data: factAttendance,
                    backgroundColor: 'rgba(255, 206, 86, 0.8)',
                    borderColor: 'rgba(255, 206, 86, 1)',
                    borderWidth: 1
                }, {
                    label: 'Dam olgan',
                    data: restingEmployee,
                    backgroundColor: 'rgba(153, 102, 255, 0.8)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    datalabels: {
                        anchor: 'end',
                        align: 'end',
                        formatter: (value) => value > 0 ? (value % 1 === 0 ? value : value.toFixed(2)) : '',
                        color: '#000'
                    }
                }
            },
            plugins: [ChartDataLabels]
        };

        if (branchChart) {
            branchChart.destroy();
        }
        branchChart = new Chart(document.getElementById('branchChart'), branchChartConfig);

        document.getElementById('attendanceFilter').addEventListener('click', () => {
            if (currentFilter !== 'attendance') {
                branchChart.destroy();
                branchChartConfig.data.datasets = [{
                    label: 'Jelezniy grafik bo\'yicha',
                    data: ironAttendance,
                    backgroundColor: 'rgba(54, 162, 235, 0.8)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }, {
                    label: 'Xodimlar (fakt)',
                    data: factAttendance,
                    backgroundColor: 'rgba(255, 206, 86, 0.8)',
                    borderColor: 'rgba(255, 206, 86, 1)',
                    borderWidth: 1
                }, {
                    label: 'Dam olgan',
                    data: restingEmployee,
                    backgroundColor: 'rgba(153, 102, 255, 0.8)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 1
                }];
                currentFilter = 'attendance';
                document.getElementById('attendanceFilter').classList.add('active');
                document.getElementById('presenceFilter').classList.remove('active');
                document.getElementById('branchFilter').classList.remove('active');
                document.getElementById('branchSelect').style.display = 'none';
                branchChart = new Chart(document.getElementById('branchChart'), branchChartConfig);
            }
        });

        document.getElementById('presenceFilter').addEventListener('click', () => {
            if (currentFilter !== 'presence') {
                branchChart.destroy();
                branchChartConfig.data.datasets = [{
                    label: 'Vaqtida kelgan',
                    data: onTimeEmployees,
                    backgroundColor: 'rgba(75, 192, 192, 0.8)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }, {
                    label: 'Kechikkan',
                    data: lateEmployees,
                    backgroundColor: 'rgba(255, 206, 86, 0.8)',
                    borderColor: 'rgba(255, 206, 86, 1)',
                    borderWidth: 1
                }, {
                    label: 'Kelmagan',
                    data: absentEmployees,
                    backgroundColor: 'rgba(255, 99, 132, 0.8)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }];
                currentFilter = 'presence';
                document.getElementById('attendanceFilter').classList.remove('active');
                document.getElementById('presenceFilter').classList.add('active');
                document.getElementById('branchFilter').classList.remove('active');
                document.getElementById('branchSelect').style.display = 'none';
                branchChart = new Chart(document.getElementById('branchChart'), branchChartConfig);
            }
        });

        document.getElementById('branchFilter').addEventListener('click', () => {
            if (currentFilter !== 'branch') {
                branchChart.destroy();
                document.getElementById('branchSelect').value = ''; // Reset the branch select value
                currentFilter = 'branch';
                document.getElementById('attendanceFilter').classList.remove('active');
                document.getElementById('presenceFilter').classList.remove('active');
                document.getElementById('branchFilter').classList.add('active');
                document.getElementById('branchSelect').style.display = 'inline';
                branchChartConfig.data.datasets = [];
                branchChart = new Chart(document.getElementById('branchChart'), branchChartConfig);
            }
        });

        branchSelect.addEventListener('change', () => {
            if (currentFilter === 'branch') {
                branchChart.destroy();
                const selectedBranch = branchSelect.value;
                if (!selectedBranch) {
                    branchChartConfig.data.labels = [];
                    branchChartConfig.data.datasets.forEach(dataset => dataset.data = []);
                    branchChart = new Chart(document.getElementById('branchChart'), branchChartConfig);
                    return;
                }
                const branchRecords = filteredData.filter(record => record.branch === selectedBranch);
                const dates = Array.from(new Set(branchRecords.map(record => record.date)));

                const branchOnTimeEmployees = dates.map(date => {
                    const records = branchRecords.filter(record => record.date === date);
                    return records.reduce((sum, record) => sum + record.onTimeEmployees, 0);
                });
                const branchLateEmployees = dates.map(date => {
                    const records = branchRecords.filter(record => record.date === date);
                    return records.reduce((sum, record) => sum + record.lateEmployees, 0);
                });
                const branchAbsentEmployees = dates.map(date => {
                    const records = branchRecords.filter(record => record.date === date);
                    return records.reduce((sum, record) => sum + record.absentEmployees, 0);
                });

                branchChartConfig.data.labels = dates;
                branchChartConfig.data.datasets = [{
                    label: 'Vaqtida kelgan',
                    data: branchOnTimeEmployees,
                    backgroundColor: 'rgba(75, 192, 192, 0.8)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }, {
                    label: 'Kechikkan',
                    data: branchLateEmployees,
                    backgroundColor: 'rgba(255, 206, 86, 0.8)',
                    borderColor: 'rgba(255, 206, 86, 1)',
                    borderWidth: 1
                }, {
                    label: 'Kelmagan',
                    data: branchAbsentEmployees,
                    backgroundColor: 'rgba(255, 99, 132, 0.8)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }];
                branchChart = new Chart(document.getElementById('branchChart'), branchChartConfig);
            }
        });

        document.querySelector('.loader').style.display = 'none';
    } catch (error) {
        console.error('Error updating data:', error);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    $('#daterange').daterangepicker({
        opens: 'left',
        startDate: moment(),
        endDate: moment()
    }, function (start, end, label) {
        updateData(start.toDate(), end.toDate());
        if (end.diff(start, 'days') > 0) {
            document.getElementById('attendanceFilter').disabled = true;
            document.getElementById('presenceFilter').disabled = true;
            document.getElementById('branchFilter').click(); // Auto-select branch filter
        } else {
            document.getElementById('attendanceFilter').disabled = false;
            document.getElementById('presenceFilter').disabled = false;
        }
    });

    const initialStartDate = moment();
    const initialEndDate = moment();

    $('#daterange').data('daterangepicker').setStartDate(initialStartDate);
    $('#daterange').data('daterangepicker').setEndDate(initialEndDate);

    updateData(initialStartDate.toDate(), initialEndDate.toDate());
});
