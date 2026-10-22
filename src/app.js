console.log("executando")
const express = require('express');
const exphbs = require('express-handlebars');
require('dotenv').config();
const session = require('express-session');
const adminRoutes = require('./routes/admin.routes');
const path = require('path');
const helpers = require('./utils/helpers');

const app = express();

app.use(session({
    secret: process.env.SESSION_SECRET || "chave123",
    resave: false,
    saveUninitialized: false
}));

const hbs = exphbs.create({
    defaultLayout: false,
    extname: '.handlebars',
    layoutsDir: path.join(__dirname, 'views/layouts'),
    partialsDir: path.join(__dirname, 'views/partials'),
    helpers: helpers,
});

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.set('views', __dirname + '/views');

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

const adminLayout = (req, res, next) => {
    res.locals.layout = 'ADMIN-TEST';
    next();
};

// Rota raiz sempre cai direto no admin
app.get('/', (req, res) => res.redirect('/admin'));

app.use('/admin', adminLayout, adminRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta HTTP://localhost:${PORT}`);
});