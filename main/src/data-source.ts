import "reflect-metadata"

import { DataSource } from "typeorm";
import { Product } from "./entity/product";

export const AppDataSource = new DataSource({
    type: 'mongodb',
    host: 'localhost',
    database: 'youtube',
    logging: true,
    synchronize: true,
    port: 27017,
    entities: [Product, ],
})