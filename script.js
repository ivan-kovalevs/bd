function scaleToFit() {
    const baseWidth = 1920;
    const baseHeight = 1080;
    
    const scaleX = window.innerWidth / baseWidth;
    const scaleY = window.innerHeight / baseHeight;
    const scale = Math.min(scaleX, scaleY);
    
    // Застосовуємо масштаб до всього body
    document.body.style.transform = `scale(${scale})`;
    document.body.style.transformOrigin = 'top left';
    
    // Центруємо екран по горизонталі та вертикалі
    const extraX = (window.innerWidth - (baseWidth * scale)) / 2;
    const extraY = (window.innerHeight - (baseHeight * scale)) / 2;
    
    document.body.style.position = 'absolute';
    document.body.style.left = `${extraX}px`;
    document.body.style.top = `${extraY}px`;
}

window.addEventListener('resize', scaleToFit);
document.addEventListener('DOMContentLoaded', scaleToFit);

// Посилання на ваш CSV
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQFnpl_W78r6T8lrNKLUuBHsRKjO3j5pkEeNSdR-T0phYKRqVoAz4n_gsBCJjJ2uSn1BnHYZAN-IgAa/pub?output=csv';

const MONTHS_UK = [
    "СІЧНЯ", "ЛЮТОГО", "БЕРЕЗНЯ", "КВІТНЯ", "ТРАВНЯ", "ЧЕРВНЯ", 
    "ЛИПНЯ", "СЕРПНЯ", "ВЕРЕСНЯ", "ЖОВТНЯ", "ЛИСТОПАДА", "ГРУДНЯ"
];

const DAYS_UK = [
    "НЕДІЛЯ", "ПОНЕДІЛОК", "ВІВТОРОК", "СЕРЕДА", "ЧЕТВЕР", "П'ЯТНИЦЯ", "СУБОТА"
];

// Оновлення дати в заголовку
function updateHeaderDate() {
    const today = new Date();
    const day = today.getDate();
    const month = MONTHS_UK[today.getMonth()];
    const weekDay = DAYS_UK[today.getDay()];
    
    document.getElementById('current-date').textContent = `${day} ${month}, ${weekDay}`;
}

async function initWidget() {
    try {
        updateHeaderDate();
        
        const response = await fetch(CSV_URL);
        const csvText = await response.text();
        
        const allPeople = parseCSV(csvText);
        console.log("Усі дані з таблиці:", allPeople);
        
        const today = new Date();
        
        // Гнучкий фільтр на сьогоднішню дату
        const birthdaysToday = allPeople.filter(person => {
            let dateVal = person.date || person.Date || person['дата'] || person['Дата'];
            if (!dateVal) return false;
            
            let d = dateVal.trim();
            let parts = d.split(/[\.\-\/]/);
            
            if (parts.length >= 2) {
                let p1 = parseInt(parts[0], 10);
                let p2 = parseInt(parts[1], 10);
                
                let isDayFirst = (p1 === today.getDate() && p2 === (today.getMonth() + 1));
                let isMonthFirst = (p2 === today.getDate() && p1 === (today.getMonth() + 1));
                
                return isDayFirst || isMonthFirst;
            }
            return false;
        });
        
        console.log("Знайдено іменинників на сьогодні:", birthdaysToday);

        if (birthdaysToday.length > 0) {
            startLoop(birthdaysToday);
        } else {
            console.log("Сьогодні немає іменинників у таблиці.");
            document.querySelector('.title').innerHTML = "СЬОГОДНІ НЕМАЄ<br>ІМЕНИННИКІВ";
            // Якщо немає іменинників, ховаємо вміст або залишаємо заголовок на хвилину
        }
    } catch (error) {
        console.error("Помилка завантаження даних:", error);
    }
}

// Проста функція для розбору CSV
function parseCSV(text) {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const headers = lines[0].split(',').map(h => h.trim());
    const result = [];
    
    for (let i = 1; i < lines.length; i++) {
        const currentline = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        let obj = {};
        for (let j = 0; j < headers.length; j++) {
            let val = currentline[j] ? currentline[j].trim().replace(/^"|"$/g, '') : '';
            obj[headers[j]] = val;
        }
        result.push(obj);
    }
    return result;
}

function getRank(person) {
    if (person.d && person.d.trim() !== '') return person.d;
    if (person.rank && person.rank.trim() !== '') return person.rank;
    if (person['звання'] && person['звання'].trim() !== '') return person['звання'];
    return '';
}

// Основна функція для циклічної зміни іменинників
// Основна функція для циклічної зміни іменинників
// Основна функція для циклічної зміни іменинників
function startLoop(people) {
    const wrapper = document.getElementById('cards-wrapper');
    wrapper.innerHTML = '';
    
    const stateCards = [...people];
    const totalCards = stateCards.length;
    let cardElements = [];

    function createCard(person) {
        const div = document.createElement('div');
        div.className = 'main-card';
        
        let rankStr = getRank(person);
        let nameParts = person.name.split(' ');
        let nameHtml = person.name;
        if (nameParts.length > 1) {
            const firstName = nameParts.shift();
            nameHtml = `${firstName}<br>${nameParts.join(' ')}`;
        }
        
        const photoUrl = (person.photo_url && person.photo_url.trim() !== "") 
            ? person.photo_url 
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}&size=800&background=c0c0c0&color=fff`;

        div.innerHTML = `
            <div class="photo-container">
                <div class="photo-overlay"></div>
                <img src="${photoUrl}" alt="Фото іменинника">
            </div>
            <div class="info-container">
                <div class="rank-row">
                    <span class="rank">${rankStr}</span>
                    <span class="trident-icon">
                        <img src="trident.svg" alt="Тризуб">
                    </span>
                </div>
                <div class="name">${nameHtml}</div>
            </div>
        `;
        return div;
    }

    stateCards.forEach((p) => {
        const el = createCard(p);
        wrapper.appendChild(el);
        cardElements.push(el);
    });

    function renderPositions() {
        cardElements.forEach((el, index) => {
            el.style.zIndex = totalCards - index;
            el.style.opacity = 1;
            
            let xOffset = index * -18;
            let yOffset = index * 18;
            
            let brightness = Math.max(1 - (index * 0.04), 0.4); 
            
            el.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
            el.style.filter = `brightness(${brightness})`;
        });
    }

    renderPositions();

    if (totalCards > 0) {
        // Виділяємо на анімацію вильоту останньої картки 2 секунди, 
        // тому весь цикл карток має завершитися за 58 секунд, щоб разом із вильотом вийшло рівно 60 сек.
        const targetTotalTimeMs = 58000; 
        const intervalTime = targetTotalTimeMs / totalCards;
        
        console.log(`Загальна кількість карток: ${totalCards}. Час показу однієї: ${intervalTime / 1000} сек.`);

        let currentIndex = 0;

        let intervalId = setInterval(() => {
            if (currentIndex >= totalCards) {
                clearInterval(intervalId);
                return;
            }

            const topCard = cardElements[0];
            
            // Запуск анімації вильоту праворуч (триває 2 секунди)
            topCard.style.transition = 'transform 2s cubic-bezier(0.25, 1, 0.5, 1), opacity 2s ease, filter 2s ease';
            topCard.style.transform = `translate(2000px, 0px)`;
            topCard.style.opacity = 0; 
            
            setTimeout(() => {
                cardElements.shift(); 
                topCard.remove(); 
                
                if (cardElements.length > 0) {
                    renderPositions();
                }
            }, 2000); 

            currentIndex++;
        }, intervalTime);
    }
}

document.addEventListener("DOMContentLoaded", initWidget);
