async function fetchGoogleSheetData(url) {
    const response = await fetch(url);
    if (!response.ok) {
        console.error('Failed to fetch data from:', url);
        throw new Error('Network response was not ok ' + response.statusText);
    }
    return await response.json();
}

const chart1Url = 'https://script.googleusercontent.com/macros/echo?user_content_key=6jCG1IlSdZhPmb-uBJJ7Vwk7njoeIJuPOHkw3u_PfNrM5bUqKz-L4-QCKwdjMDbOqCN7vC37i03WQDHGTrsF_mPlYns0PrcSm5_BxDlH2jW0nuo2oDemN9CCS2h10ox_1xSncGQajx_ryfhECjZEnAd1_rFCfbkaCnKGOnGYayQCt3g9DgXB4aUPmJu-iDPeRNLwLKgVEjM0GjGEitR8gm9P8BBr8tA4LNZ430x1UnCWIw0IF3qkgdz9Jw9Md8uu&lib=MJFLTLCXp-xhR2ulkWT4jSMU_ovHKllUF';
const chart2Url = 'https://script.googleusercontent.com/macros/echo?user_content_key=uQXK_q6UvY-NjFvD-vOq2C7q4RwBslfX0ViAuEZiifJpEE-d2yhyHTrAMIDjFpX5Wdqk-WMCsWo9_Khs-1yxTFb9IuY9x4lem5_BxDlH2jW0nuo2oDemN9CCS2h10ox_1xSncGQajx_ryfhECjZEnC9HYAT-7P1Mjbkq5LxANOXRkVWB0yI8cPYatcNrsb_QOaD6APoocmkwlCdSVhGGAGxxkgkD570blVetz2JsbSzFe2DLABp2GNz9Jw9Md8uu&lib=MJFLTLCXp-xhR2ulkWT4jSMU_ovHKllUF';
const cardsUrl = 'https://script.googleusercontent.com/macros/echo?user_content_key=CZ2mR3Qlu8ITanwCKXzzHtfLaYYiuC0wLIoNj2Gj_YyX3ac6BrIMooeLSLMtKumsvmfQzdLPZrIknjnMZfXmpfL_Ccf2VQ84m5_BxDlH2jW0nuo2oDemN9CCS2h10ox_1xSncGQajx_ryfhECjZEnKNYCH09L0PXx9cgQiwMPoxvnDRcu8I3-8Sjv0Wnz5xK4NSZwOyOKiJKwDKaDRKcMd5-JxZjRsWazwrXrUpDqD6LJQP9n3sqc9z9Jw9Md8uu&lib=MJFLTLCXp-xhR2ulkWT4jSMU_ovHKllUF';

async function createCharts() {
    try {
        const data1 = await fetchGoogleSheetData(chart1Url);
        const data2 = await fetchGoogleSheetData(chart2Url);
        const cardData = await fetchGoogleSheetData(cardsUrl);

        const chart1Data = {
            labels: data1.map(item => `${item.month} (1-заявка ~ $${item.requestPrice.toFixed(2)})`),
            datasets: [{
                label: 'Просмотры в месяц',
                data: data1.map(item => item.viewsPerMonth / 2500),
                backgroundColor: '#42A5F5',
                stack: 'Stack 0'
            }, {
                label: 'Потраченная сумма',
                data: data1.map(item => item.amountSpent),
                backgroundColor: '#66BB6A',
                stack: 'Stack 1'
            }, {
                label: 'Количество запросов',
                data: data1.map(item => item.numOfRequests),
                backgroundColor: '#FFA726',
                stack: 'Stack 2'
            }]
        };

        const chart2Data = {
            labels: data2.map(item => `${item.month} (встречи: ${item.numOfMeets})`),
            datasets: [{
                label: 'Средняя стоимость встречи',
                data: data2.map(item => item.avarageReq),
                backgroundColor: '#FFA726',
                stack: 'Stack 0'
            }]
        };

        const ctx1 = document.getElementById('chart1').getContext('2d');
        new Chart(ctx1, {
            type: 'bar',
            data: chart1Data,
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
                        formatter: function(value, context) {
                            if (context.dataset.label === 'Просмотры в месяц') {
                                return (value * 2500).toLocaleString(); // Возвращаем исходное значение
                            }
                            if (context.dataset.label === 'Потраченная сумма') {
                                return `$${value.toLocaleString()}`;
                            }
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
        new Chart(ctx2, {
            type: 'bar',
            data: chart2Data,
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
                        formatter: function(value, context) {
                            return `$${value.toLocaleString()}`;
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

        // Update card values
        document.getElementById('finalViews').innerText = cardData[0].finalViews.toLocaleString();
        document.getElementById('finalSpent').innerText = `$${cardData[0].finalSpent.toLocaleString()}`;
        document.getElementById('finalReqs').innerText = cardData[0].finalReqs.toLocaleString();
        document.getElementById('finalAvaragePriceOfReq').innerText = `$${cardData[0].finalAvaragePriceOfReq.toFixed(2)}`;
        document.getElementById('finalNumOfMeets').innerText = cardData[0].finalNumOfMeets.toLocaleString();
        document.getElementById('finalAvaragePriceOfMeets').innerText = `$${cardData[0].finalAvaragePriceOfMeets.toFixed(2)}`;

        document.querySelector('.loader').style.display = 'none';
    } catch (error) {
        console.error('Error creating charts:', error);
        document.querySelector('.loader').style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', createCharts);
