const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path'); // Importe o módulo 'path'
const session = require('express-session');

const app = express();
const port = 3000; // Porta em que o servidor será executado

// Configuração do Express.js
app.use(session({ 
  secret: 'sua-chave-secreta', 
  resave: false, 
  saveUninitialized: false,
  cookie: {
        maxAge: 1800000 // 30 minutos em milissegundos
    }
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Conexão com o MongoDB Atlas
const mongoUser = 'app_consumer';
const mongoPass = 'H0FjeayqRwRZweOp';
const dbName = 'clinicaveterinaria';

mongoose.connect(
  `mongodb+srv://${mongoUser}:${mongoPass}@cluster0.w3ezdmv.mongodb.net/${dbName}?retryWrites=true&w=majority`,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
).then(() => {
    console.log('Conexão com o MongoDB estabelecida.');
}).catch((err) => {
    console.error('Erro ao conectar ao MongoDB:', err);
});

// Definição do modelo de Pet
const Pet = mongoose.model('pet', {
  codigoPet: String,
  nome: String,
  tipo: String,
  especie: String,
  raca: String,
  idade: Number,
  nomeDono: String,
  contatoDono: String
});

// Definição do modelo de Servico
const Servico = mongoose.model('servico', {
  codigoPet: String,
  tipoServico: String,
  dataAgendamento: String,
  horarioAgendamento: String
});

// Definição do modelo de User
const User = mongoose.model('User', {
    username: String,
    password: String
});

// Dados de usuários (substitua por um banco de dados real)
const users = [{ id: 1, username: 'usuario', password: 'senha' }];

// Configuração para servir o arquivo index.html
app.use(express.static(__dirname)); // Usando __dirname para o diretório atual

// Rotas para a página inicial (index.html)
app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html')); // Não é necessário incluir "public" aqui
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username, password });

        if (user) {
            req.session.authenticated = true;
            req.session.user = user;
            return res.redirect('/agendar');
        } else {
            return res.send({status: 401, message: 'Credenciais inválidas.'});
        }
    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        return res.status(500).send('Erro interno do servidor.');
    }
});

// Rota de logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

app.get('/pesquisar', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'pesquisar.html')); // Não é necessário incluir "public" aqui
});

app.get('/cadastrar', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'cadastrar.html')); // Não é necessário incluir "public" aqui
});

app.get('/agendar', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'agendar.html')); // Não é necessário incluir "public" aqui
});

app.get('/cadastrarvet', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'cadastrarvet.html')); // Não é necessário incluir "public" aqui
});

app.get('/consultaragendamentos', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'consultarservicos.html')); // Não é necessário incluir "public" aqui
});

// Rotas CRUD para a coleção "pet"
// Create (Criação de um novo pet)
app.post('/pets', isAuthenticated, async (req, res) => {
  try {
    const novoPet = new Pet(req.body);
    await novoPet.save();
    res.status(201).json(novoPet);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar o pet' });
  }
});

// Read (Listagem de todos os pets)
app.get('/pets', isAuthenticated, async (req, res) => {
  try {
    const pets = await Pet.find({});
    res.json(pets);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar os pets' });
  }
});

// Update (Atualização de um pet por ID)
app.put('/pets/:id', isAuthenticated, async (req, res) => {
  try {
    const pet = await Pet.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(pet);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar o pet' });
  }
});

// Delete (Exclusão de um pet por ID)
app.delete('/pets/:id', isAuthenticated, async (req, res) => {
  try {
    await Pet.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir o pet' });
  }
});

// Rota para buscar um pet por código
app.get('/pets/:codigoPet', isAuthenticated, async (req, res) => {
    const codigoPet = req.params.codigoPet;
    
    try {
        const pet = await Pet.findOne({ codigoPet }).exec();
        res.json(pet);
    } catch (error) {
        console.error('Erro ao buscar o pet:', error);
        res.status(500).json({ error: 'Erro ao buscar o pet.' });
    }
});

// Rotas CRUD para a coleção "servicos"
// Create (Criação de um novo servico)
app.post('/agendar', isAuthenticated, async (req, res) => {
  try {
    const novoServico = new Servico(req.body);
    await novoServico.save();
    res.status(201).json(novoServico);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar o servico' });
  }
});

// Read (Listagem de todos os servicos)
app.get('/agendamentos', isAuthenticated, async (req, res) => {
  try {
    const servicos = await Servico.find({});
    res.json(servicos);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar os servicos' });
  }
});

// Delete (Exclusão de um pet por ID)
app.delete('/agendamentos/:id', isAuthenticated, async (req, res) => {
  try {
    await Servico.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir o agendamento' });
  }
});

// Middleware para verificar a autenticação
function isAuthenticated(req, res, next) {
    if (req.session.authenticated) {
        next();
    } else {
        res.redirect('/login');
    }
}

// Inicie o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
