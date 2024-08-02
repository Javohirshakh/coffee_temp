async function fetchGoogleSheetData(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
    }
    return await response.json();
}

const googleSheetUrl = 'https://script.googleusercontent.com/macros/echo?user_content_key=GNeh0xbaKjCcSfKTH23nvocD6QFLqJqZAjU-JmDTCeqgGaKrx-bV_gdPFosyCaOi5JhOuX-3J0B4ZhJxIAsUmjAO31AccWfom5_BxDlH2jW0nuo2oDemN9CCS2h10ox_1xSncGQajx_ryfhECjZEnPUxTgVi1APz0VKbSVgf0-45OXfC-mt1XTs0wtnt9bDCF9AgjHtgnwPUW5-rY9ayp55zOwqhVUjCwF6xwQBPqSQla2ZX9DS17w&lib=MO__Nwa4xWfJmUFM5DPS0T-K7kHi6djVF';
const googlePeopleUrl = 'https://script.googleusercontent.com/macros/echo?user_content_key=17DXOipIb-OK7N9nODdlpkp4DlK_HbyCjX-SF-4VbAB279_c2ZL1bLI-JmXud4Gs6gM_hAWAX-23SOF7V8giaHOu5LO6o6Bdm5_BxDlH2jW0nuo2oDemN9CCS2h10ox_1xSncGQajx_ryfhECjZEnCWnETUP-vVlS3lVh1ahI0dPliBGqlWjPTGUoobFfTb1NkEWftUANc-69I1v2Sh5gif_AcmMMvS5rmH-Q70_DYGBmqR6UpUDVQ&lib=MO__Nwa4xWfJmUFM5DPS0T-K7kHi6djVF';
const googleDateAndBudgetUrl = 'https://script.google.com/macros/s/AKfycbxh3glzTbc5iq1NuAF3Lrs4oc25HoLUY2Otxh5u1zTICIqD-UwXD5BJITbsmbF8SSI/exec';

function getCurrentMonthUzbek() {
    const date = new Date();
    const options = { month: 'long' };
    return new Intl.DateTimeFormat('uz-UZ', options).format(date);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}

let previousData = null;

async function updateData() {
    try {
        let data = await fetchGoogleSheetData(googleSheetUrl);
        const peopleData = await fetchGoogleSheetData(googlePeopleUrl);
        const dateAndBudgetData = await fetchGoogleSheetData(googleDateAndBudgetUrl);

        const budget = dateAndBudgetData[0].budget;
        const prevMonth = dateAndBudgetData[0].prevMonth;
        const formattedDate = formatDate(dateAndBudgetData[0].actual);

        if (JSON.stringify(data) !== JSON.stringify(previousData)) {
            previousData = data;

            let collected = 0;

            data = data.filter((section) => section.amount > 0); // Filter sections with non-zero amount

            data.forEach((section) => {
                if (section.department !== 'ИТОГ') {
                    collected += section.amount;
                }
            });

            const progress = Math.min((collected / budget) * 100, 100); // Limit progress to 100%
            const remaining = budget - collected;


            // Display the budget with prevMonth and improvement
            document.getElementById('budget').innerHTML = `
                Coffee byudjeti: ${budget.toLocaleString()} 
                <span class="prev-month">(Oldingi oy: ${prevMonth.toLocaleString()})</span>
            `;
            document.getElementById('collected').innerText = `${collected.toLocaleString()} yig'ildi`;
            document.getElementById('progress').style.width = `${progress}%`;

            const month = getCurrentMonthUzbek();
            document.getElementById('month').innerText = `${month} (${formattedDate})`;

            document.getElementById('remaining').innerText = `Bossda qolgan summa: ${remaining.toLocaleString()}`;
            document.getElementById('total_collected').innerText = `Bizda jarima emas, shunchaki coffeeni yaxshi ko'ramiz :)`;

            // Sort sections by amount descending
            data.sort((a, b) => b.amount - a.amount);

            const sectionsContainer = document.getElementById('sections');
            sectionsContainer.innerHTML = ''; // Clear existing content
            data.forEach((section) => {
                if (section.department !== 'ИТОГ') {
                    const sectionElement = document.createElement('div');
                    sectionElement.classList.add(
                        'flex',
                        'items-center',
                        'gap-1',
                        'bg-white',
                        'h-[60px]',
                        'section-content',
                        'animate__animated',
                        'animate__fadeInUp',
                        'animate__delay-1s'
                    );

                    sectionElement.innerHTML = `
                        <div class="icon-container">
                            <img src="${section.icon}" alt="${section.department} icon">
                        </div>
                        <div class="flex flex-col justify-center">
                            <p class="text-[#181411] text-base font-medium leading-normal line-clamp-1">Ulush: ${section.amount.toLocaleString()}</p>
                            <p class="text-[#887263] text-sm font-normal leading-normal line-clamp-2">${section.department}</p>
                        </div>
                    `;
                    sectionsContainer.appendChild(sectionElement);
                }
            });

            // Fetch and display people data
            const personalListContainer = document.getElementById('personalList');
            personalListContainer.innerHTML = ''; // Clear existing content

            // Calculate total fines for each department
            const departmentTotals = {};
            data.forEach((dept) => {
                departmentTotals[dept.department] = dept.amount;
            });

            // Sort people data by amount descending
            peopleData.sort((a, b) => b.amount - a.amount);

            peopleData.forEach((person) => {
                if (person.amount > 0) {
                    const departmentIcon = data.find(
                        (dept) => dept.department === person.department
                    )?.icon;

                    const percentage = ((person.amount / departmentTotals[person.department]) * 100).toFixed(2);

                    let percentageClass;
                    if (percentage <= 10) {
                        percentageClass = 'percentage-0';
                    } else if (percentage <= 20) {
                        percentageClass = 'percentage-10';
                    } else if (percentage <= 30) {
                        percentageClass = 'percentage-20';
                    } else if (percentage <= 40) {
                        percentageClass = 'percentage-30';
                    } else if (percentage <= 50) {
                        percentageClass = 'percentage-40';
                    } else if (percentage <= 60) {
                        percentageClass = 'percentage-50';
                    } else if (percentage <= 70) {
                        percentageClass = 'percentage-60';
                    } else if (percentage <= 80) {
                        percentageClass = 'percentage-70';
                    } else if (percentage <= 90) {
                        percentageClass = 'percentage-80';
                    } else if (percentage <= 100) {
                        percentageClass = 'percentage-90';
                    } else {
                        percentageClass = 'percentage-100';
                    }

                    const personElement = document.createElement('div');
                    personElement.classList.add('person-card');

                    personElement.innerHTML = `
                        <div class="icon-container person-icon">
                            <img src="${departmentIcon}" alt="${person.department} icon">
                        </div>
                        <div>
                            <p class="person-name">${person.fullName}</p>
                            <p class="person-amount">${person.amount.toLocaleString()} so'm <span class="person-percentage ${percentageClass}">${percentage}%</span></p>
                        </div>
                    `;
                    personalListContainer.appendChild(personElement);
                }
            });

            // Hide the loader after data is loaded
            document.querySelector('.loader').style.display = 'none';
        }
    } catch (error) {
        console.error('Error updating data:', error);
    }
}

updateData(); // Initial load
setInterval(updateData, 10000); // Update data every 10 seconds
