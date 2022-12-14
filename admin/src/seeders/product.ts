import "reflect-metadata";

import { AppDataSource } from "../data-source"
import { Product } from '../entity/product'

const generate = async () => {
    const product = new Product()
    product.title = 'Event Driven Architecture'
    product.likes = 1
    product.image = ''
    
    try {
        const db = await AppDataSource.initialize()
        db.manager.save(product)
        console.log("Product has been saved. ", product.id)
    } catch(e) {
        console.error(e)
    }
}

generate()