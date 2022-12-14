import express, { Request } from 'express'

import { AppDataSource } from './data-source'
import { Product } from './entity/product'
import amqplib from 'amqplib/callback_api'
import axios from 'axios'
import cors from 'cors'

const PORT = process.env.PORT || 9091

const main = async () => {
    amqplib.connect('amqps://gohyeisp:aZx2UEmca6k15j6fEXCYCf60D5Wz-jlj@gerbil.rmq.cloudamqp.com/gohyeisp', (err, connection) => {
        if (err)  throw err
        connection.createChannel(async (err, channel) => {
            if (err) throw err
            
            const app = express()
            app.use(cors({
                origin: ['http://localhost:3000'] 
            }))
            app.use(express.json());

            try {
                const db = await AppDataSource.initialize()
                const productRepository = db.getRepository(Product)

                console.log('Connected to DB!')
                
                channel.assertQueue('product_created', { durable: false })
                channel.assertQueue('product_updated', { durable: false })
                channel.assertQueue('product_deleted', { durable: false })

                channel.consume('product_created', async (message) => {
                    const eventProduct: Product = JSON.parse(message!.content.toString())
                    const product = new Product()
                    product.admin_id = parseInt(eventProduct.id)
                    product.title = eventProduct.title
                    product.image = eventProduct.image
                    product.likes = eventProduct.likes
                    await productRepository.save(product)
                    console.log('Product Created')
                }, { noAck: true })

                channel.consume('product_updated', async (message) => {
                    const eventProduct: Product = JSON.parse(message!.content.toString())
                    await productRepository.update({ 
                        admin_id: parseInt(eventProduct.id) 
                    }, eventProduct)
                    console.log('Product Updated')
                }, { noAck: true })

                channel.consume('product_deleted', async (message) => {
                    const eventProduct: Product = JSON.parse(message!.content.toString())
                    await productRepository.delete({ 
                        admin_id: parseInt(eventProduct.id) 
                    })
                    console.log('Product Deleted')
                }, { noAck: true })
                
                app.get('/api/products', async (req, res) => {
                    const products = await productRepository.find({})
                    res.json(products)
                })

                app.post('/api/products/:id/like', async (req: Request<{ id: number }, {}, {}>, res) => {
                    const product = await productRepository.findOne({ where: { admin_id: 11 }}) 
                       
                    if (!product) 
                        return res.json({ message: 'Can not find product.' })
                    
                    const result = await axios.post(`http://localhost:9090/api/products/${product.admin_id}/like`, {})
                    
                    if (!result) return 
                    
                    const updated = await productRepository.update({ 
                        admin_id: parseInt(result.data.id)
                    }, {
                        likes: result.data.likes
                    })
                    res.send(updated)
                })
                
                app.listen(PORT, () => {
                    console.log(`Listening to port: ${PORT}`)
                })
                process.on('beforeExit', () => {
                    console.log('closing')
                    connection.close()
                })
            } catch (e) {
                console.error("Error connecting to DB")
            }
            
        })
    })
}

main().catch(e => console.error(e))
