const express = require('express');  
const http = require('http');  
const { Server } = require('socket.io'); // Обновленный импорт  
const path = require('path');  
const cors = require('cors');  
  
const app = express();  
const server = http.createServer(app);  
  
// Настройка Socket.io с CORS  
const io = new Server(server, {  
  cors: {  
    origin: "*",  
    methods: ["GET", "POST"]  
  }  
});  
  
app.use(cors());  
app.use(express.static(path.join(__dirname, 'public'))); // Более надежный путь  
  
app.get('/', (req, res) => {  
  res.sendFile(path.join(__dirname, 'public', 'index.html'));  
});  
  
// Хранилище данных  
const rooms = new Map();  
const players = new Map();  
  
io.on('connection', (socket) => {  
  console.log('User connected:', socket.id);  
  
  // --- СОЗДАНИЕ КОМНАТЫ ---  
  socket.on('create_room', (data) => {  
    const { playerName } = data;  
    const roomId = 'room_' + Math.random().toString(36).substr(2, 8);  
      
    rooms.set(roomId, {  
      id: roomId,  
      players: new Map(),  
      host: socket.id,  
      currentMovie: null,  
      gameState: 'waiting',  
      gameObjects: []  
    });  
  
    const room = rooms.get(roomId);  
      
    room.players.set(socket.id, {  
      id: socket.id,  
      name: playerName,  
      score: 0,  
      isHost: true  
    });  
  
    players.set(socket.id, {  
      id: socket.id,  
      name: playerName,  
      roomId: roomId  
    });  
  
    socket.join(roomId);  
    console.log(`Room $${roomId} created by $${playerName}`);  
  
    socket.emit('room_created', {  
      roomId: roomId,  
      player: room.players.get(socket.id)  
    });  
  });  
  
  // --- ПРИСОЕДИНЕНИЕ К КОМНАТЕ ---  
  socket.on('join_room', (data) => {  
    const { roomId, playerName } = data;  
      
    const room = rooms.get(roomId);  
    if (!room) {  
      socket.emit('join_error', { message: 'Комната не найдена' });  
      return;  
    }  
  
    room.players.set(socket.id, {  
      id: socket.id,  
      name: playerName,  
      score: 0,  
      isHost: false  
    });  
  
    players.set(socket.id, {  
      id: socket.id,  
      name: playerName,  
      roomId: roomId  
    });  
  
    socket.join(roomId);  
  
    // Отправляем текущее состояние комнаты новому игроку  
    socket.emit('room_state', {  
      movie: room.host === socket.id ? room.currentMovie : null, // Скрываем фильм от обычных игроков  
      gameObjects: room.gameObjects,  
      players: Array.from(room.players.values())  
    });  
  
    // Оповещаем всех остальных  
    io.to(roomId).emit('player_joined', {  
      player: room.players.get(socket.id),  
      players: Array.from(room.players.values())  
    });  
  
    console.log(`Player $${playerName} joined room $${roomId}`);  
  });  
  
  // --- УПРАВЛЕНИЕ ОБЪЕКТАМИ ---  
  socket.on('game_object_added', (data) => {  
    const player = players.get(socket.id);  
    if (!player) return;  
    const room = rooms.get(player.roomId);  
    if (!room) return;  
  
    room.gameObjects.push(data.object);  
    socket.to(player.roomId).emit('game_object_added', data); // Используем socket.to чтобы не слать обратно отправителю (опционально)  
  });  
  
  socket.on('game_object_removed', (data) => {  
    const player = players.get(socket.id);  
    if (!player) return;  
    const room = rooms.get(player.roomId);  
    if (!room) return;  
  
    room.gameObjects = room.gameObjects.filter(obj => obj.id !== data.objectId);  
    socket.to(player.roomId).emit('game_object_removed', data);  
  });  
  
  socket.on('game_object_updated', (data) => {  
    const player = players.get(socket.id);  
    if (!player) return;  
    const room = rooms.get(player.roomId);  
    if (!room) return;  
  
    const objIndex = room.gameObjects.findIndex(obj => obj.id === data.object.id);  
    if (objIndex !== -1) {  
      room.gameObjects[objIndex] = data.object;  
    }  
      
    socket.to(player.roomId).emit('game_object_updated', data);  
  });  
  
  socket.on('clear_game_field', (data) => {  
    const player = players.get(socket.id);  
    if (!player) return;  
    const room = rooms.get(player.roomId);  
    if (!room) return;  
  
    room.gameObjects = [];  
    socket.to(player.roomId).emit('clear_game_field', data);  
  });  
  
  // --- ЛОГИКА ИГРЫ ---  
  socket.on('start_game', (data) => {  
    const player = players.get(socket.id);  
    if (!player) return;  
  
    const room = rooms.get(player.roomId);  
    if (!room || room.host !== socket.id) return; // Только хост может менять фильм  
  
    // В реальности можно брать из API или большего списка  
    const movies = [  
      { title: "Титаник", year: "1997" },  
      { title: "Матрица", year: "1999" },  
      { title: "Властелин Колец", year: "2001" },  
      { title: "Гарри Поттер", year: "2001" },  
      { title: "Звездные Войны", year: "1977" },  
      { title: "Аватар", year: "2009" },  
      { title: "Король Лев", year: "1994" },  
      { title: "Пираты Карибского моря", year: "2003" },  
      { title: "Холодное Сердце", year: "2013" },  
      { title: "Назад в будущее", year: "1985" },  
      { title: "Шрек", year: "2001" },  
      { title: "Джокер", year: "2019" }  
    ];  
  
    room.currentMovie = movies[Math.floor(Math.random() * movies.length)];  
    room.gameState = 'playing';  
  
    // Хосту показываем фильм  
    socket.emit('movie_reveal', room.currentMovie);  
      
    // Остальным говорим, что игра началась  
    socket.to(player.roomId).emit('game_started', {  
      message: "Новый раунд! Создатель составляет сцену из фильма."  
    });  
  
    console.log(`Game started in room $${player.roomId} with movie: $${room.currentMovie.title}`);  
  });  
  
  // --- РУЧНОЕ ПОДТВЕРЖДЕНИЕ ПРАВИЛЬНОГО ОТВЕТА (ДОБАВЛЕНО) ---  
  socket.on('correct_answer', (data) => {  
    const hostPlayer = players.get(socket.id);  
    if (!hostPlayer) return;  
  
    const room = rooms.get(hostPlayer.roomId);  
    // Проверяем, что команду шлет хост  
    if (!room || room.host !== socket.id) return;  
  
    const targetPlayerId = data.playerId;  
    const targetPlayerData = room.players.get(targetPlayerId);  
  
    if (targetPlayerData) {  
      targetPlayerData.score += 1;  
  
      io.to(hostPlayer.roomId).emit('player_scored', {  
        playerId: targetPlayerId,  
        playerName: targetPlayerData.name,  
        newScore: targetPlayerData.score,  
        message: "Ответ принят ведущим!"  
      });  
    }  
  });  
  
  // --- ЧАТ И АВТО-ПРОВЕРКА ---  
  socket.on('chat_message', (data) => {  
    const player = players.get(socket.id);  
    if (!player) return;  
  
    const room = rooms.get(player.roomId);  
    if (!room) return;  
  
    const messageData = {  
      type: 'chat_message',  
      playerId: socket.id,  
      playerName: player.name,  
      message: data.message,  
      timestamp: Date.now(),  
      isCorrect: false  
    };  
  
    // Автоматическая проверка ответа  
    if (room.currentMovie && room.gameState === 'playing' && socket.id !== room.host) {  
        // Нормализация строк для сравнения  
        const userAnswer = data.message.trim().toLowerCase().replace(/["«»]/g, '');  
        const correctAnswer = room.currentMovie.title.toLowerCase().replace(/["«»]/g, '');  
          
        // Используем строгое сравнение или проверку на полное вхождение для защиты от ложных срабатываний  
        // (Например, чтобы "Оно" не сработало внутри слова "Звонок")  
        if (userAnswer === correctAnswer) {  
            messageData.isCorrect = true;  
              
            const playerData = room.players.get(socket.id);  
            if (playerData) {  
                playerData.score += 1;  
                  
                io.to(player.roomId).emit('player_scored', {  
                    playerId: socket.id,  
                    playerName: player.name,  
                    newScore: playerData.score,  
                    message: data.message  
                });  
            }  
        }  
    }  
  
    io.to(player.roomId).emit('chat_message', messageData);  
  });  
  
  // --- ОТКЛЮЧЕНИЕ ---  
  socket.on('disconnect', () => {  
    console.log('User disconnected:', socket.id);  
      
    const player = players.get(socket.id);  
    if (player) {  
      const room = rooms.get(player.roomId);  
      if (room) {  
        room.players.delete(socket.id);  
          
        // Если ушел хост, назначаем нового  
        if (room.host === socket.id && room.players.size > 0) {  
          const newHostId = Array.from(room.players.keys())[0];  
          room.host = newHostId;  
            
          const newHostPlayer = room.players.get(newHostId);  
          if (newHostPlayer) {  
            newHostPlayer.isHost = true;  
              
            io.to(player.roomId).emit('new_host', {  
              newHostId: newHostId,  
              newHostName: newHostPlayer.name  
            });  
              
            // Показываем новому хосту текущий фильм, если игра идет  
            if (room.currentMovie) {  
                io.to(newHostId).emit('movie_reveal', room.currentMovie);  
            }  
          }  
        }  
  
        io.to(player.roomId).emit('player_left', {  
          playerId: socket.id,  
          players: Array.from(room.players.values())  
        });  
  
        // Удаляем комнату, если пустая  
        if (room.players.size === 0) {  
          rooms.delete(player.roomId);  
          console.log(`Room ${player.roomId} deleted (empty)`);  
        }  
      }  
        
      players.delete(socket.id);  
    }  
  });  
});  
  
const PORT = process.env.PORT || 3000;  
server.listen(PORT, () => {  
  console.log(`Server running on port ${PORT}`);  
});  
