export class UIManager {  
    constructor() {  
        this.sectionsContainer = null;  
    }  
  
    initialize(sectionsContainer) {  
        this.sectionsContainer = sectionsContainer;  
    }  
  
    // --- 1. УПРАВЛЕНИЕ ЭКРАНАМИ И КНОПКАМИ (FIXED) ---  
  
    showScreen(screen) {  
        const modal = document.getElementById('modeModal');  
        const gameHeader = document.getElementById('gameHeader');  
        const gameContainer = document.getElementById('gameContainer');  
        const instructions = document.getElementById('instructions');  
  
        if (screen === 'game') {  
            modal.style.display = 'none';  
            gameHeader.style.display = 'block';  
            gameContainer.style.display = 'flex';  
            instructions.classList.add('active');  
        } else if (screen === 'menu') {  
            gameHeader.style.display = 'none';  
            gameContainer.style.display = 'none';  
            instructions.classList.remove('active');  
            modal.style.display = 'flex';  
  
            // ВАЖНО: Сбрасываем блокировку кнопок при выходе в меню  
            document.getElementById('createRoomBtn').disabled = false;  
            document.getElementById('joinRoomBtn').disabled = false;  
            const status = document.getElementById('networkStatus');  
            status.textContent = 'Выберите действие...';  
            status.className = 'status-message status-waiting';  
        }  
    }  
  
    // --- 2. ОТОБРАЖЕНИЕ ID КОМНАТЫ (NEW) ---  
  
    updateRoomIdDisplay(roomId) {  
        const badge = document.getElementById('roomInfoBadge');  
        const display = document.getElementById('currentRoomIdDisplay');  
          
        if (roomId) {  
            badge.style.display = 'inline-block';  
            display.textContent = roomId;  
              
            // Копирование по клику  
            badge.onclick = () => {  
                navigator.clipboard.writeText(roomId).then(() => {  
                    const old = display.textContent;  
                    display.textContent = "Скопировано!";  
                    setTimeout(() => display.textContent = old, 1000);  
                });  
            };  
        } else {  
            badge.style.display = 'none';  
        }  
    }  
  
    // --- 3. ИНИЦИАЛИЗАЦИЯ МЕНЮ ---  
  
    initModal(onCreate, onJoin, onSingle) {  
        const modeBtns = document.querySelectorAll('.mode-btn');  
        const serverSettings = document.getElementById('serverSettings');  
        const createBtn = document.getElementById('createRoomBtn');  
        const joinBtn = document.getElementById('joinRoomBtn');  
        const status = document.getElementById('networkStatus');  
  
        modeBtns.forEach(btn => {  
            btn.addEventListener('click', () => {  
                modeBtns.forEach(b => b.classList.remove('active'));  
                btn.classList.add('active');  
                const isNet = btn.dataset.mode === 'network';  
                serverSettings.classList.toggle('active', isNet);  
            });  
        });  
  
        createBtn.addEventListener('click', async () => {  
            const name = document.getElementById('playerName').value.trim();  
            if (!name) return status.textContent = 'Введите имя!';  
              
            status.textContent = 'Создание...';  
            createBtn.disabled = true;   
            joinBtn.disabled = true;  
  
            try {  
                await onCreate(name, status);  
            } catch (e) {  
                status.textContent = 'Ошибка!';  
                createBtn.disabled = false;   
                joinBtn.disabled = false;  
            }  
        });  
  
        joinBtn.addEventListener('click', async () => {  
            const roomId = document.getElementById('roomId').value.trim();  
            const name = document.getElementById('playerName').value.trim();  
            if (!roomId || !name) return status.textContent = 'Введите ID и имя!';  
  
            status.textContent = 'Подключение...';  
            createBtn.disabled = true;  
            joinBtn.disabled = true;  
  
            try {  
                await onJoin(roomId, name, status);  
            } catch (e) {  
                status.textContent = e.message || 'Ошибка входа';  
                createBtn.disabled = false;   
                joinBtn.disabled = false;  
            }  
        });  
  
        document.getElementById('startBtn').addEventListener('click', () => {  
            onSingle(document.getElementById('playerName').value || 'Игрок');  
        });  
    }  
  
    // --- 4. ЧАТ И СПИСКИ ---  
  
    initChat(onSend) {  
        const input = document.getElementById('chatInput');  
        const btn = document.getElementById('sendBtn');  
          
        const send = () => {  
            if (input.value.trim()) {  
                onSend(input.value.trim());  
                input.value = '';  
            }  
        };  
        btn.addEventListener('click', send);  
        input.addEventListener('keypress', e => e.key === 'Enter' && send());  
    }  
  
    addChatMessage(name, text, isCorrect) {  
        const box = document.getElementById('chatMessages');  
        const msg = document.createElement('div');  
        msg.className = `message ${isCorrect ? 'correct' : ''}`;  
        msg.innerHTML = `<strong>$${name}:</strong> $${text}`;  
        box.appendChild(msg);  
        box.scrollTop = box.scrollHeight;  
    }  
  
    updatePlayersList(players, isHost, onCorrectMark) {  
        const list = document.getElementById('playersList');  
        list.innerHTML = '';  
        players.forEach(p => {  
            const item = document.createElement('div');  
            item.className = 'player-item';  
            item.innerHTML = `<span>$${p.name} $${p.isHost ? '👑' : ''}</span> <span>${p.score}</span>`;  
              
            // Кнопка для хоста  
            if (isHost && !p.isHost && onCorrectMark) {  
                const btn = document.createElement('button');  
                btn.textContent = '✅';  
                btn.className = 'correct-btn';  
                btn.onclick = () => onCorrectMark(p.id);  
                item.appendChild(btn);  
            }  
            list.appendChild(item);  
        });  
    }  
  
    // --- 5. МЕНЮ ЭМОДЗИ ---  
  
    initSections(categories, dragHandler) {  
        this.sectionsContainer.innerHTML = '';  
        categories.forEach((cat, idx) => {  
            const section = document.createElement('div');  
            section.className = 'section';  
              
            const header = document.createElement('div');  
            header.className = 'section-header';  
            header.textContent = cat.title;  
            header.onclick = () => {  
                const content = header.nextElementSibling;  
                const wasExpanded = content.classList.contains('expanded');  
                document.querySelectorAll('.section-content').forEach(el => el.classList.remove('expanded'));  
                if (!wasExpanded) content.classList.add('expanded');  
            };  
  
            const content = document.createElement('div');  
            content.className = 'section-content';  
              
            cat.emojis.slice(0, 20).forEach(emoji => {  
                const item = document.createElement('div');  
                item.className = 'menu-item';  
                item.textContent = emoji;  
                item.draggable = true;  
                item.addEventListener('dragstart', e => {  
                    e.dataTransfer.setData('text/plain', emoji);  
                    item.classList.add('dragging');  
                });  
                item.addEventListener('dragend', () => item.classList.remove('dragging'));  
                content.appendChild(item);  
            });  
  
            section.append(header, content);  
            this.sectionsContainer.appendChild(section);  
        });  
    }  
  
    // --- 6. ВСПОМОГАТЕЛЬНЫЕ ---  
  
    toggleUIForHost(isHost) {  
        document.getElementById('emojiMenu').classList.toggle('hidden', !isHost);  
        document.getElementById('newMovieBtn').style.display = isHost ? 'block' : 'none';  
        document.getElementById('clearFieldBtn').style.display = isHost ? 'block' : 'none';  
        // Если не хост - скрываем информацию о фильме  
        if (!isHost) {  
            document.getElementById('movieTitle').textContent = '???';  
            document.getElementById('movieYear').textContent = '';  
        }  
    }  
}  
