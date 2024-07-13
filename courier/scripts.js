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

        // Create percentage chart
        new Chart(document.getElementById('percentageChart'), {
            type: 'bar',
            data: {
                labels: sortedBranchLabels,
                datasets: [{
                    label: 'Percentage',
                    data: sortedBranchData,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                scales: {
                    x: {
                        beginAtZero: true
                    }
                }
            }
        });

        // Data preparation for pie chart
        const totalOnTime = filteredData.reduce((sum, record) => sum + record.onTimeEmployees, 0);
        const totalLate = filteredData.reduce((sum, record) => sum + record.lateEmployees, 0);
        const totalAbsent = filteredData.reduce((sum, record) => sum + record.absentEmployees, 0);

        // Create pie chart
        new Chart(document.getElementById('pieChart'), {
            type: 'pie',
            data: {
                labels: ['On Time', 'Late', 'Absent'],
                datasets: [{
                    data: [totalOnTime, totalLate, totalAbsent],
                    backgroundColor: [
                        'rgba(75, 192, 192, 0.2)',
                        'rgba(255, 206, 86, 0.2)',
                        'rgba(255, 99, 132, 0.2)'
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
                responsive: true
            }
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

        // Create branch chart
        const branchChartConfig = {
            type: 'bar',
            data: {
                labels: branches,
                datasets: [{
                    label: 'Iron Attendance',
                    data: ironAttendance,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }, {
                    label: 'Fact Attendance',
                    data: factAttendance,
                    backgroundColor: 'rgba(255, 206, 86, 0.2)',
                    borderColor: 'rgba(255, 206, 86, 1)',
                    borderWidth: 1
                }, {
                    label: 'Resting Employee',
                    data: restingEmployee,
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
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
                }
            }
        };

        if (branchChart) {
            branchChart.destroy();
        }
        branchChart = new Chart(document.getElementById('branchChart'), branchChartConfig);

        document.getElementById('attendanceFilter').addEventListener('click', () => {
            if (currentFilter !== 'attendance') {
                branchChart.destroy();
                branchChartConfig.data.datasets = [{
                    label: 'Iron Attendance',
                    data: ironAttendance,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }, {
                    label: 'Fact Attendance',
                    data: factAttendance,
                    backgroundColor: 'rgba(255, 206, 86, 0.2)',
                    borderColor: 'rgba(255, 206, 86, 1)',
                    borderWidth: 1
                }, {
                    label: 'Resting Employee',
                    data: restingEmployee,
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 1
                }];
                currentFilter = 'attendance';
                document.getElementById('attendanceFilter').classList.add('active');
                document.getElementById('presenceFilter').classList.remove('active');
                branchChart = new Chart(document.getElementById('branchChart'), branchChartConfig);
            }
        });

        document.getElementById('presenceFilter').addEventListener('click', () => {
            if (currentFilter !== 'presence') {
                branchChart.destroy();
                branchChartConfig.data.datasets = [{
                    label: 'On Time Employees',
                    data: onTimeEmployees,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }, {
                    label: 'Late Employees',
                    data: lateEmployees,
                    backgroundColor: 'rgba(255, 206, 86, 0.2)',
                    borderColor: 'rgba(255, 206, 86, 1)',
                    borderWidth: 1
                }, {
                    label: 'Absent Employees',
                    data: absentEmployees,
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }];
                currentFilter = 'presence';
                document.getElementById('attendanceFilter').classList.remove('active');
                document.getElementById('presenceFilter').classList.add('active');
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
        opens: 'left'
    }, function (start, end, label) {
        updateData(start.toDate(), end.toDate());
    });

    const initialStartDate = moment().subtract(29, 'days');
    const initialEndDate = moment();

    $('#daterange').data('daterangepicker').setStartDate(initialStartDate);
    $('#daterange').data('daterangepicker').setEndDate(initialEndDate);

    updateData(initialStartDate.toDate(), initialEndDate.toDate());
    setInterval(() => {
        const start = $('#daterange').data('daterangepicker').startDate;
        const end = $('#daterange').data('daterangepicker').endDate;
        updateData(start.toDate(), end.toDate());
    }, 60000);
});
