const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); 
const path = require('path');

const app = express();

app.use(cors()); 
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const cloudURI = process.env.MONGODB_URI || 'mongodb+srv://sanzharshoman2_db_user:v3qVlRxrjrUSU9zS@cluster0.wakytga.mongodb.net/?appName=Cluster0';

mongoose.connect(cloudURI)
  .then(() => console.log('=== УСПЕШНОЕ ПОДКЛЮЧЕНИЕ К ОБЛАЧНОЙ MONGODB ATLAS! ==='))
  .catch(err => console.error('Ошибка подключения к облаку:', err));

const ResultSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    detailedAnswers: { type: Array, default: [] }, 
    score: { type: Number, default: 0 },          
    createdAt: { type: Date, default: Date.now }
}, { strict: false });

const Result = mongoose.model('Result', ResultSchema);

const correctAnswers = {
    1: 2, 2: 3, 3: 0, 4: 1, 5: 1, 6: 0, 7: 1, 8: 0, 9: 1, 10: 2,
    11: 1, 12: 7, 13: 1, 14: 0, 15: 3, 16: 5, 17: 1, 18: 4, 19: 4, 20: 1
};

// 1. ЭНДПОИНТ ДЛЯ МГНОВЕННОГО СОХРАНЕНИЯ КОНТАКТОВ
app.post('/api/register-candidate', async (req, res) => {
    try {
        const { name, email, phone } = req.body;
        
        // Создаем запись только с контактами — без лишних полей, чтобы не вызывать ошибку базы
        const newResult = new Result({ name, email, phone });
        await newResult.save();
        
        // Возвращаем фронтенду текстовый ID созданной записи
        return res.status(200).json({ success: true, id: newResult._id.toString() });
    } catch (error) {
        console.error("Ошибка сохранения лида:", error);
        return res.status(500).json({ error: "Internal Server Error", message: error.message });
    }
});

app.post('/api/submit-quiz', async (req, res) => {
    try {
        const { candidateId, answers } = req.body;
        let detailedAnswers = [];
        let score = 0;

        for (let qId in correctAnswers) {
            const numId = parseInt(qId);
            const userAnswer = answers[numId];
            const isCorrect = userAnswer === correctAnswers[numId];
            if (isCorrect) score++;

            detailedAnswers.push({
                questionId: numId,
                theme: numId <= 10 ? "Критическое мышление" : "Математика",
                userAnswer: userAnswer !== undefined ? userAnswer : null,
                correctAnswer: correctAnswers[numId],
                isCorrect: isCorrect
            });
        }

        // Если с фронтенда пришел ID кандидата — обновляем его запись
        if (candidateId) {
            const objectId = new mongoose.Types.ObjectId(candidateId);
            
            await Result.findByIdAndUpdate(objectId, {
                $set: {
                    detailedAnswers: detailedAnswers,
                    score: score
                }
            });
            return res.status(200).json({ success: true });
        } 
        
        // Резервный случай: если ID потерялся, создаем новую запись
        const fallbackResult = new Result({ 
            name: "Unknown (Late Submit)", 
            email: "-", 
            phone: "-", 
            detailedAnswers, 
            score 
        });
        await fallbackResult.save();
        return res.status(200).json({ success: true });

    } catch (error) {
        console.error("Ошибка при финальной отправке:", error);
        return res.status(500).json({ error: "Internal Server Error", message: error.message });
    }
});

app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
        return next();
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`Сервер запущен`));
}

module.exports = app;
