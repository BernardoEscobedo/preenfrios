import 'dotenv/config'
import express from 'express'
import usuariosRouter from './routes/usuarios.route.js'
import empleadosRouter from './routes/empleados.route.js'

const app = express()
app.use(cors({
    origin: 'http://localhost:5173'
}))

app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(express.static('public'))

app.use('/api/preenfrio/usuarios', usuariosRouter)
app.use('/api/preenfrio/empleados', empleadosRouter)

const PORT = process.env.PORT || 3000

console.log('ENV:', {
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD ? '***' : 'Not set',
});

app.listen(PORT, () => console.log('Servidor corriendo en puerto ' + PORT))