const express = require('express')
const dotenv = require('dotenv')
const mongoose = require('mongoose')
const userRoutes = require('./routes/userRoutes')
const visitorRoutes = require('./routes/visitorRoutes')
const cors = require("cors");

const app = express();

dotenv.config();

app.use(cors());

app.use(express.json())

app.use('/api/user', userRoutes)
app.use('/api/visitor', visitorRoutes)


app.get('/', (req, res) => {
    res.send("Home");
})




mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running http://localhost:${PORT} & connect DB`);

        })
    }).catch((error) => {
        console.log(error);

    })

const PORT = process.env.PORT || 4000;

