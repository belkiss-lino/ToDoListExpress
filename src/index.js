const express = require('express')
const cors = require('cors')
const { Pool } = require('pg')
require('dotenv').config()

const PORT = process.env.PORT || 3333

//pool vai permitir fazer as consultas no banco de dados
const pool = new Pool({
    connectionString: process.env.POSTGRES_URL
})

const app = express()

app.use(express.json()) //para fazer a aplicação entender JSON
app.use(cors()) //para depurar no heroku
 
app.get('/', (req, res)=> {console.log('Olá, mundo!')})

app.get('/users', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM users')
        return res.status(200).send(rows)
    } catch(err) {
        return res.status(400).send(err)
    }
})

//LOGIN
app.post('/session', async (req, res) =>  {
    const { username } = req.body
    let user = ''
    try {
        //verificando se o user já existe
        user = await pool.query('SELECT * FROM users WHERE user_name = ($1)', [username])
        if (!user.rows[0]) {
            user = await pool.query('INSERT INTO users(user_name) VALUES($1) RETURNING *', [username])
        }
        return res.status(200).send(user.rows)
    } catch(err) {
        return res.status(400).send(err)
    }
})
//ADICIONANDO NOTAS
app.post('/todo/:user_id', async (req, res) => {
    const { description, done } = req.body
    const { user_id } = req.params
    try {
        const newTodo = await pool.query('INSERT INTO todos (todo_description, todo_done, user_id) VALUES ($1, $2, $3) RETURNING *', [description, done, user_id])
        return res.status(200).send(newTodo.rows)
    } catch (err) {
        return res.status(400).send(err)
    }
})
//LISTAR TODOS OS TODO DO USUÁRIO
app.get('/todo/:user_id', async (req, res) => {
    const { user_id } = req.params
    try {
        const allTodo = await pool.query('SELECT * FROM todos WHERE user_id = ($1)', [user_id])
        return res.status(200).send(allTodo.rows)
    } catch (err) {
        return res.status(400).send(err)
    }
})
//ATUALIZAR A TODO
app.patch('/todo/:user_id/:todo_id', async (req, res) => {
    const { todo_id, user_id } = req.params
    const data = req.body
    try {
        const belongToUser = await pool.query('SELECT * FROM todos WHERE user_id = ($1) AND todo_id = ($2)', [user_id, todo_id])
        if (!belongToUser.rows[0]) return res.status(400).send('Operation not allowed!')
        const updatedTodo = await pool.query('UPDATE todos SET todo_description = ($1),todo_done = ($2) WHERE todo_id = ($3) RETURNING *', 
        [data.description, data.done, todo_id])
        return res.status(200).res(updatedTodo.rows)
    } catch (err) {
        return res.status(400).send(err)
    }
})
//DELETANDO TODOS
app.delete('/todo/:user_id/:todo_id', async (req, res) => {
    const { user_id, todo_id } = req.params
    try {
        //VERIFICANDO SE A TODO PERTENCE AO USUARIO
        const belongToUser = await pool.query('SELECT * FROM todos WHERE user_id = ($1) AND todo_id = ($2)', [user_id, todo_id])
        if (!belongToUser.rows[0]) return res.status(400).send('Operation not allowed!')
        const deletedTodo = await pool.query('DELETE FROM todos WHERE todo_id = ($1) RETURNING *',[todo_id])
        return res.status(200).send({
            message: 'Todo successfully deleted!',
            deletedTodo: deletedTodo.rows
        })
    } catch (err) {
        return res.status(400).send(err)
    }
})

app.listen(PORT, () => console.log(`Server running on port ${PORT}`))