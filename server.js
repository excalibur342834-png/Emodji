const express = require('express');  
const http = require('http');  
const { Server } = require('socket.io'); // Используем современный импорт  
const path = require('path');  
const cors = require('cors');  
  
const app = express();  
const server = http.createServer(app);  
const io = new Server(server, {  
  cors: { origin: "*", methods: ["GET", "POST"] }  
});  
  
app.use(cors());  
app.use(express.static(path.join(__dirname, 'public')));  
  
app.get('/', (req, res) => {  
  res.sendFile(path.join(__dirname, 'public', 'index.html'));  
});  
  
// --- ХРАНИЛИЩЕ ДАННЫХ ---  
const rooms = new Map();  
const players = new Map();  
  
io.on('connection', (socket) => {  
  console.log('User connected:', socket.id);  
  
  // --- 1. УПРАВЛЕНИЕ КОМНАТОЙ ---  
  
  socket.on('create_room', ({ playerName }) => {  
    const roomId = 'room_' + Math.random().toString(36).substr(2, 6).toUpperCase(); // ID покороче и капсом  
      
    rooms.set(roomId, {  
      id: roomId,  
      players: new Map(),  
      host: socket.id,  
      currentMovie: null,  
      gameState: 'waiting',  
      gameObjects: []  
    });  
  
    const room = rooms.get(roomId);  
    const playerData = { id: socket.id, name: playerName, score: 0, isHost: true };  
      
    room.players.set(socket.id, playerData);  
    players.set(socket.id, { id: socket.id, name: playerName, roomId });  
  
    socket.join(roomId);  
    socket.emit('room_created', { roomId, player: playerData });  
  });  
  
  socket.on('join_room', ({ roomId, playerName }) => {  
    // Приводим к одному регистру для удобства ввода  
    const normalizedRoomId = roomId.trim();   
    const room = rooms.get(normalizedRoomId);  
      
    if (!room) {  
      socket.emit('join_error', { message: 'Комната не найдена' });  
      return;  
    }  
  
    const playerData = { id: socket.id, name: playerName, score: 0, isHost: false };  
    room.players.set(socket.id, playerData);  
    players.set(socket.id, { id: socket.id, name: playerName, roomId: normalizedRoomId });  
  
    socket.join(normalizedRoomId);  
  
    // Отправляем данные: игроку (без спойлера фильма) и всем остальным  
    socket.emit('room_state', {  
      movie: room.host === socket.id ? room.currentMovie : null,  
      gameObjects: room.gameObjects,  
      players: Array.from(room.players.values())  
    });  
  
    io.to(normalizedRoomId).emit('player_joined', {  
      player: playerData,  
      players: Array.from(room.players.values())  
    });  
  });  
  
  // --- 2. ИГРОВОЙ ПРОЦЕСС ---  
  
  socket.on('start_game', () => {  
    const player = players.get(socket.id);  
    if (!player) return;  
    const room = rooms.get(player.roomId);  
    if (!room || room.host !== socket.id) return;  
  
    // Список фильмов (можно расширить)  
    const movies = [  
      { title: "Титаник", year: "1997" }, { title: "Матрица", year: "1999" },  
      { title: "Властелин Колец", year: "2001" }, { title: "Гарри Поттер", year: "2001" },  
      { title: "Звездные Войны", year: "1977" }, { title: "Аватар", year: "2009" },  
      { title: "Король Лев", year: "1994" }, { title: "Шрек", year: "2001" },  
      { title: "Назад в будущее", year: "1985" }, { title: "Оно", year: "2017" }  
    ];  
  
    room.currentMovie = movies[Math.floor(Math.random() * movies.length)];  
    room.gameState = 'playing';  
  
    // Хосту показываем фильм, остальным - уведомление  
    socket.emit('movie_reveal', room.currentMovie);  
    socket.to(player.roomId).emit('game_started', {  
      message: "Игра началась! Ведущий загадал фильм."  
    });  
  });  
  
  // --- 3. ОБЪЕКТЫ НА ПОЛЕ ---  
    
  // Используем socket.to(...), чтобы не слать данные обратно отправителю (оптимизация)  
  socket.on('game_object_added', (data) => {  
    const player = players.get(socket.id);  
    if (player && rooms.has(player.roomId)) {  
      rooms.get(player.roomId).gameObjects.push(data.object);  
      socket.to(player.roomId).emit('game_object_added', data);  
    }  
  });  
  
  socket.on('game_object_removed', (data) => {  
    const player = players.get(socket.id);  
    if (player && rooms.has(player.roomId)) {  
      const room = rooms.get(player.roomId);  
      room.gameObjects = room.gameObjects.filter(obj => obj.id !== data.objectId);  
      socket.to(player.roomId).emit('game_object_removed', data);  
    }  
  });  
  
  socket.on('game_object_updated', (data) => {  
    const player = players.get(socket.id);  
    if (player && rooms.has(player.roomId)) {  
      const room = rooms.get(player.roomId);  
      const idx = room.gameObjects.findIndex(obj => obj.id === data.object.id);  
      if (idx !== -1) room.gameObjects[idx] = data.object;  
      socket.to(player.roomId).emit('game_object_updated', data);  
    }  
  });  
  
  socket.on('clear_game_field', (data) => {  
    const player = players.get(socket.id);  
    if (player && rooms.has(player.roomId)) {  
      rooms.get(player.roomId).gameObjects = [];  
      socket.to(player.roomId).emit('clear_game_field', data);  
    }  
  });  
  
  // --- 4. ЧАТ И ОТВЕТЫ ---  
  
  // Ручное подтверждение ответа хостом (FIXED)  
  socket.on('correct_answer', ({ playerId }) => {  
    const host = players.get(socket.id);  
    if (!host) return;  
    const room = rooms.get(host.roomId);  
      
    if (room && room.host === socket.id) {  
      const targetPlayer = room.players.get(playerId);  
      if (targetPlayer) {  
        targetPlayer.score += 1;  
        io.to(room.id).emit('player_scored', {  
          playerId,  
          playerName: targetPlayer.name,  
          newScore: targetPlayer.score,  
          message: "Ведущий засчитал правильный ответ!"  
        });  
      }  
    }  
  });  
  
  socket.on('chat_message', ({ message }) => {  
    const player = players.get(socket.id);  
    if (!player) return;  
    const room = rooms.get(player.roomId);  
    if (!room) return;  
  
    const msgData = {  
      playerId: socket.id,  
      playerName: player.name,  
      message,  
      isCorrect: false  
    };  
  
    // Автоматическая проверка (FIXED: строгая проверка)  
    if (room.currentMovie && room.gameState === 'playing' && socket.id !== room.host) {  
      const cleanUser = message.trim().toLowerCase().replace(/[^а-яa-z0-9]/gi, '');  
      const cleanCorrect = room.currentMovie.title.toLowerCase().replace(/[^а-яa-z0-9]/gi, '');  
        
      if (cleanUser === cleanCorrect) {  
        msgData.isCorrect = true;  
        const pData = room.players.get(socket.id);  
        pData.score += 1;  
          
        io.to(room.id).emit('player_scored', {  
          playerId: socket.id,  
          playerName: player.name,  
          newScore: pData.score  
        });  
      }  
    }  
  
    io.to(player.roomId).emit('chat_message', msgData);  
  });  
  
  // --- 5. ОТКЛЮЧЕНИЕ ---  
  
  socket.on('disconnect', () => {  
    const player = players.get(socket.id);  
    if (player) {  
      const room = rooms.get(player.roomId);  
      if (room) {  
        room.players.delete(socket.id);  
          
        // Передача прав хоста  
        if (room.host === socket.id && room.players.size > 0) {  
          const newHostId = Array.from(room.players.keys())[0];  
          room.host = newHostId;  
          const newHost = room.players.get(newHostId);  
          newHost.isHost = true;  
            
          io.to(player.roomId).emit('new_host', {   
            newHostId,   
            newHostName: newHost.name   
          });  
            
          // Показываем новому хосту текущий фильм  
          if (room.currentMovie) {  
            io.to(newHostId).emit('movie_reveal', room.currentMovie);  
          }  
        }  
  
        io.to(player.roomId).emit('player_left', {  
          playerId: socket.id,  
          players: Array.from(room.players.values())  
        });  
  
        if (room.players.size === 0) {  
          rooms.delete(player.roomId);  
        }  
      }  
      players.delete(socket.id);  
    }  
  });  
});  
  
server.listen(3000, () => console.log('Server running on port 3000'));  
