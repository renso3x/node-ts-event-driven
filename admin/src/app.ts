import "reflect-metadata"

import { AppDataSource } from "./data-source"
import { Product } from "./entity/product"
import cors from 'cors'
import { createConnection } from 'typeorm'
import express from 'express'

const app = express()
const PORT = process.env.PORT || 9090

const main = async () => {
    app.use(cors({
        origin: ['http://localhost:3000'] 
    }))
    
    await AppDataSource.initialize()

    app.listen(PORT, () => {
        console.log(`Lisetening to port: ${PORT}`)
    })
}

main().catch(err => console.error(err))