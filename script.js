// Состояние игры
const gameState = {
    balance: 0,
    hashrate: 0,
    mined: 0,
    upgrades: {
        gpu: { owned: 0, price: 100, hashrate: 5 },
        farm: { owned: 0, price: 1000, hashrate: 50 },
        asic: { owned: 0, price: 10000, hashrate: 500 }
    },
    miningInterval: null,
    miningSpeed: 0,
    lastSave: null
};

// DOM элементы
const elements = {
    balance: document.getElementById('balance'),
    hashrate: document.getElementById('hashrate'),
    mined: document.getElementById('mined'),
    miningSpeed: document.getElementById('mining-speed'),
    mineBtn: document.getElementById('mine-btn'),
    miningProgress: document.getElementById('mining-progress'),
    withdrawAmount: document.getElementById('withdraw-amount'),
    walletAddress: document.getElementById('wallet-address'),
    withdrawBtn: document.getElementById('withdraw-btn'),
    withdrawStatus: document.getElementById('withdraw-status'),
    notification: document.getElementById('notification'),
    miningEffects: document.getElementById('mining-effects'),
    saveBtn: document.getElementById('save-btn'),
    particles: document.getElementById('particles'),
    clickSound: document.getElementById('clickSound'),
    miningSound: document.getElementById('miningSound'),
    upgradeSound: document.getElementById('upgradeSound')
};

// Инициализация игры
function initGame() {
    loadGame();
    createParticles();
    updateUI();
    setupEventListeners();
    startAutoMining();
    
    // Показываем уведомление о загрузке
    showNotification('Игра загружена!', 'success');
}

// Создание частиц для фона
function createParticles() {
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        // Случайные параметры
        const size = Math.random() * 5 + 2;
        const posX = Math.random() * 100;
        const posY = Math.random() * 100;
        const opacity = Math.random() * 0.5 + 0.1;
        const duration = Math.random() * 20 + 10;
        
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${posX}%`;
        particle.style.top = `${posY}%`;
        particle.style.opacity = opacity;
        particle.style.animation = `float ${duration}s linear infinite`;
        
        elements.particles.appendChild(particle);
    }
}

// Загрузка сохраненной игры
function loadGame() {
    const savedGame = localStorage.getItem('cryptoMinerProSimulator');
    if (savedGame) {
        try {
            const parsed = JSON.parse(savedGame);
            Object.assign(gameState, parsed);
            
            // Проверяем, когда было последнее сохранение
            if (gameState.lastSave) {
                const secondsPassed = Math.floor((Date.now() - gameState.lastSave) / 1000);
                if (secondsPassed > 0) {
                    // Добавляем оффлайн-доход
                    const offlineEarnings = calculateOfflineEarnings(secondsPassed);
                    if (offlineEarnings > 0) {
                        gameState.balance += offlineEarnings;
                        gameState.mined += offlineEarnings;
                        showNotification(`Оффлайн доход: ${offlineEarnings.toFixed(2)} CR (${formatTime(secondsPassed)})`, 'success');
                    }
                }
            }
        } catch (e) {
            console.error('Ошибка загрузки сохранения:', e);
        }
    }
}

// Расчет оффлайн дохода
function calculateOfflineEarnings(seconds) {
    if (gameState.hashrate === 0) return 0;
    
    // Максимум 24 часа оффлайн дохода
    const cappedSeconds = Math.min(seconds, 24 * 60 * 60);
    return (gameState.hashrate / 10000) * cappedSeconds;
}

// Форматирование времени
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours > 0 ? hours + 'ч ' : ''}${minutes > 0 ? minutes + 'м ' : ''}${secs}с`;
}

// Сохранение игры
function saveGame() {
    gameState.lastSave = Date.now();
    localStorage.setItem('cryptoMinerProSimulator', JSON.stringify(gameState));
}

// Сохранение в файл
function saveToFile() {
    playSound(elements.clickSound);
    
    const data = {
        ...gameState,
        saveTime: new Date().toLocaleString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `crypto_miner_save_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Сохранение экспортировано в файл!', 'success');
}

// Обновление интерфейса
function updateUI() {
    elements.balance.textContent = gameState.balance.toFixed(2);
    elements.hashrate.textContent = gameState.hashrate.toLocaleString();
    elements.mined.textContent = gameState.mined.toFixed(2);
    elements.miningSpeed.textContent = (gameState.hashrate / 10000).toFixed(6);
    
    // Обновляем цены улучшений
    document.querySelectorAll('[data-upgrade="gpu"]').forEach(el => {
        el.previousElementSibling.textContent = calculateUpgradePrice('gpu').toLocaleString();
        el.disabled = gameState.balance < calculateUpgradePrice('gpu');
    });
    
    document.querySelectorAll('[data-upgrade="farm"]').forEach(el => {
        el.previousElementSibling.textContent = calculateUpgradePrice('farm').toLocaleString();
        el.disabled = gameState.balance < calculateUpgradePrice('farm');
    });
    
    document.querySelectorAll('[data-upgrade="asic"]').forEach(el => {
        el.previousElementSibling.textContent = calculateUpgradePrice('asic').toLocaleString();
        el.disabled = gameState.balance < calculateUpgradePrice('asic');
    });
    
    // Анимация хешрейта
    animateHashrate();
}

// Анимация изменения хешрейта
function animateHashrate() {
    const hashrateElement = elements.hashrate;
    hashrateElement.style.transform = 'scale(1.1)';
    hashrateElement.style.color = '#ffcc00';
    
    setTimeout(() => {
        hashrateElement.style.transform = 'scale(1)';
        hashrateElement.style.color = '';
    }, 300);
}

// Расчет цены улучшения
function calculateUpgradePrice(type) {
    return Math.floor(gameState.upgrades[type].price * Math.pow(1.15, gameState.upgrades[type].owned));
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Ручной майнинг
    elements.mineBtn.addEventListener('click', manualMine);
    
    // Покупка улучшений
    document.querySelectorAll('.buy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            playSound(elements.clickSound);
            const upgradeType = btn.dataset.upgrade;
            buyUpgrade(upgradeType);
        });
    });
    
    // Вывод средств
    elements.withdrawBtn.addEventListener('click', withdrawFunds);
    
    // Сохранение в файл
    elements.saveBtn.addEventListener('click', saveToFile);
}

// Воспроизведение звука
function playSound(soundElement) {
    soundElement.currentTime = 0;
    soundElement.play().catch(e => console.log('Автовоспроизведение заблокировано'));
}

// Ручной майнинг
function manualMine() {
    playSound(elements.clickSound);
    
    const progressBar = elements.miningProgress;
    const flames = document.querySelectorAll('.flame');
    let progress = 0;
    
    elements.mineBtn.disabled = true;
    
    // Анимация пламени
    flames.forEach(flame => {
        flame.style.opacity = '0.8';
        flame.style.transform = 'scaleY(1)';
    });
    
    const interval = setInterval(() => {
        progress += 2;
        progressBar.style.width = `${progress}%`;
        
        if (progress >= 100) {
            clearInterval(interval);
            
            // Добыча криптовалюты
            const minedAmount = 1 + gameState.hashrate / 100;
            gameState.balance += minedAmount;
            gameState.mined += minedAmount;
            
            // Эффекты добычи
            createMiningEffects(minedAmount);
            playSound(elements.miningSound);
            
            // Сброс анимации
            progressBar.style.width = '0%';
            flames.forEach(flame => {
                flame.style.opacity = '0';
                flame.style.transform = 'scaleY(0)';
            });
            
            elements.mineBtn.disabled = false;
            updateUI();
            saveGame();
            showNotification(`Добыто: ${minedAmount.toFixed(2)} CR`, 'success');
        }
    }, 50);
}

// Создание эффектов при майнинге
function createMiningEffects(amount) {
    const coinsToCreate = Math.min(Math.floor(amount * 2), 10);
    
    for (let i = 0; i < coinsToCreate; i++) {
        const coin = document.createElement('div');
        coin.classList.add('coin');
        coin.innerHTML = 'CR';
        
        // Случайная позиция
        const left = Math.random() * 80 + 10;
        const delay = Math.random() * 1000;
        
        coin.style.left = `${left}%`;
        coin.style.bottom = '0';
        coin.style.animationDelay = `${delay}ms`;
        
        elements.miningEffects.appendChild(coin);
        
        // Удаление после анимации
        setTimeout(() => {
            coin.remove();
        }, 3000);
    }
}

// Автоматический майнинг
function startAutoMining() {
    if (gameState.miningInterval) {
        clearInterval(gameState.miningInterval);
    }
    
    gameState.miningInterval = setInterval(() => {
        if (gameState.hashrate > 0) {
            const minedAmount = gameState.hashrate / 10000;
            gameState.balance += minedAmount;
            gameState.mined += minedAmount;
            
            // Периодическое сохранение
            if (!gameState.lastSave || Date.now() - gameState.lastSave > 30000) {
                saveGame();
            }
            
            updateUI();
        }
    }, 100);
}

// Покупка улучшения
function buyUpgrade(type) {
    const upgrade = gameState.upgrades[type];
    const price = calculateUpgradePrice(type);
    
    if (gameState.balance >= price) {
        gameState.balance -= price;
        upgrade.owned += 1;
        gameState.hashrate += upgrade.hashrate;
        
        playSound(elements.upgradeSound);
        updateUI();
        saveGame();
        
        const upgradeNames = {
            gpu: 'Видеокарта',
            farm: 'Майнинг-ферма',
            asic: 'Асик'
        };
        
        showNotification(`Куплено: ${upgradeNames[type]} (+${upgrade.hashrate} H/s)`, 'success');
    } else {
        showNotification('Недостаточно средств', 'error');
    }
}

// Вывод средств
function withdrawFunds() {
    playSound(elements.clickSound);
    
    const amount = parseFloat(elements.withdrawAmount.value);
    const wallet = elements.walletAddress.value.trim();
    
    if (!wallet) {
        showNotification('Введите адрес кошелька', 'error');
        return;
    }
    
    if (isNaN(amount) || amount < 100) {
        showNotification('Минимальная сумма вывода - 100 CR', 'error');
        return;
    }
    
    if (amount > gameState.balance) {
        showNotification('Недостаточно средств на балансе', 'error');
        return;
    }
    
    // В реальном приложении здесь был бы запрос к серверу
    gameState.balance -= amount;
    updateUI();
    saveGame();
    
    elements.withdrawStatus.innerHTML = `
        <p><i class="fas fa-check-circle"></i> Запрос на вывод <strong>${amount.toFixed(2)} CR</strong> обрабатывается.</p>
        <p><i class="fas fa-wallet"></i> Кошелек: <strong>${wallet}</strong></p>
        <p><i class="fas fa-info-circle"></i> В реальном приложении средства были бы отправлены на указанный адрес.</p>
    `;
    
    elements.withdrawStatus.style.display = 'block';
    showNotification('Запрос на вывод отправлен!', 'success');
    
    // Очищаем поля
    elements.withdrawAmount.value = '';
    elements.walletAddress.value = '';
}

// Показать уведомление
function showNotification(message, type = 'success') {
    const notification = elements.notification;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    notification.className = 'notification';
    notification.classList.add(type === 'success' ? 'success' : 'error');
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Запуск игры при загрузке страницы
window.addEventListener('DOMContentLoaded', initGame);

// Сохранение при закрытии вкладки
window.addEventListener('beforeunload', () => {
    saveGame();
});