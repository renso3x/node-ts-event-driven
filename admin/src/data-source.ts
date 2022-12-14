import { DataSource } from "typeorm";
import { Product } from "./entity/product";

export const AppDataSource = new DataSource({
    host: "localhost",
    type: 'postgres',
    database: 'youtube',
    entities: [Product,],
    logging: true,
    synchronize: true,
    username: 'postgres',
    password: 'postgres',
    port: 5432,
    subscribers: [],
    migrations: [],
})