import express, { Request } from 'express'

import { AppDataSource } from "./data-source"
import { Product } from "./entity/product"
import amqplib from 'amqplib/callback_api'
import cors from 'cors'

const PORT = process.env.PORT || 9090


const main = async () => {
    amqplib.connect('amqps://gohyeisp:aZx2UEmca6k15j6fEXCYCf60D5Wz-jlj@gerbil.rmq.cloudamqp.com/gohyeisp', (err, connection) => {
        if (err) {
            throw err
        }

        connection.createChannel(async (err, channel) => {
            if (err) throw err
            
            const app= express()
            app.use(cors({
                origin: ['http://localhost:3000'] 
            }))
            app.use(express.json());
            
            const db = await AppDataSource.initialize()
            const productRepository = db.getRepository(Product)

            channel.assertQueue('admin_post_like', { durable: false })

            app.post("/api/products", async (req, res) => {
                const product = await productRepository.create(req.body)
                const result = await productRepository.save(product)
                channel.sendToQueue('product_created', Buffer.from(JSON.stringify(result)))
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
                await productRepository.save(result)
                channel.sendToQueue('product_updated', Buffer.from(JSON.stringify(result))) 
                res.json(result)
            })

            app.delete('/api/products/:id', async(req: Request<{ id: number }, {}, {}>, res)=> {
                const product = await productRepository.findOneBy({ id: req.params.id }) 
                
                if (!product) 
                    return res.json({ message: 'Can not find product.' })
                    
                channel.sendToQueue('product_deleted', Buffer.from(JSON.stringify(product))) 
                
                const result = await productRepository.remove(product)
                
                res.json(result)
            })

            app.post('/api/products/:id/like', async(req: Request<{ id: number }, {}, {}>, res) {
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

            process.on('beforeExit', () => {
                console.log('closing')
                connection.close()
            })
        })
    })
}

main().catch(err => console.error(err))