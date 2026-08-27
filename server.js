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
    detailedAnswers: Array, 
    score: Number,          
    createdAt: { type: Date, default: Date.now }
});

const Result = mongoose.model('Result', ResultSchema);

const correctAnswers = {
    1: 2, 2: 3, 3: 0, 4: 1, 5: 1, 6: 0, 7: 1, 8: 0, 9: 1, 10: 2,
    11: 1, 12: 7, 13: 1, 14: 0, 15: 3, 16: 5, 17: 1, 18: 4, 19: 4, 20: 1
};


// Эндпоинт мгновенной записи контактов в MongoDB
app.post('/api/register-candidate', async (req, res) => {
    try {
        const { name, email, phone } = req.body;
        
        const newResult = new Result({
            name,
            email,
            phone,
            detailedAnswers: [],
            score: 0
        });
        
        await newResult.save();
        
        res.status(200).json({ success: true, id: newResult._id });
    } catch (error) {
        console.error("Ошибка сохранения лида:", error);
        res.status(500).json({ error: "Internal Server Error" });
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

        if (candidateId) {
            await Result.findByIdAndUpdate(candidateId, {
                detailedAnswers,
                score
            });
            return res.status(200).json({ success: true });
        } 
        
        const fallbackResult = new Result({ 
            name: "Unknown (No ID Received)", 
            email: "-", 
            phone: "-", 
            detailedAnswers, 
            score 
        });
        await fallbackResult.save();
        res.status(200).json({ success: true });

    } catch (error) {
        console.error("Ошибка при финальной отправке:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});





app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
        return next();
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Сервер запущен`));
module.exports = app;
