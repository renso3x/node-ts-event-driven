import express, { Request } from 'express'

import { AppDataSource } from "./data-source"
import { Product } from "./entity/product"
import cors from 'cors'

const PORT = process.env.PORT || 9090

const app = express()
app.use(cors({
    origin: ['http://localhost:3000'] 
}))
app.use(express.json());

const main = async () => {
    const db = await AppDataSource.initialize()
    const productRepository = db.getRepository(Product)

    app.post("/api/products", async (req, res) => {
        const product = await productRepository.create(req.body)
        const result = await productRepository.save(product)
        return res.send(result)
    })

    app.get('/api/products', async (req, res) => {
        const products = await productRepository.find({}) 
        res.json(products)
    })

    app.get('/api/products/:id', async (req: Request<{ id: number }, {}, {}>, res) => {
        const product = await productRepository.findOneBy({ id: req.params.id }) 
        res.json(product as Product)
    })

    app.put('/api/products/:id', async(req: Request<{ id: number }, {}, {}>, res) => {
        const product = await productRepository.findOneBy({ id: req.params.id }) 
        
        if (!product) 
            return res.json({ message: 'Can not find product. ' })
            
        const result = await productRepository.merge(product, req.body)
        res.json(result)
    })

    app.delete('/api/products/:id', async(req: Request<{ id: number }, {}, {}>, res)=> {
        const product = await productRepository.findOneBy({ id: req.params.id }) 
        
        if (!product) 
            return res.json({ message: 'Can not find product.' })
            
        const result = await productRepository.remove(product)
        res.json(result)
    })

    app.post('/api/products/:id/like',async(req: Request<{ id: number }, {}, {}>, res) => {
        const product = await productRepository.findOneBy({ id: req.params.id })
            
        if (!product) 
            return res.json({ message: 'Can not find product.' })

        product.likes!++
        const result = await productRepository.save(product)
        res.send(result)
    })

    app.listen(PORT, () => {
        console.log(`Lisetening to port: ${PORT}`)
    })
}

main().catch(err => console.error(err))