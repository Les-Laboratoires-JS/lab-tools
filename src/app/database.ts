import knex, { Knex } from "knex"
import path from "path"
import chalk from "chalk"

import * as logger from "./logger"
import * as handler from "./handler"

export const tableHandler = new handler.Handler(
  process.env.BOT_TABLES_PATH ?? path.join(process.cwd(), "dist", "tables")
)

tableHandler.once("finish", async (pathList) => {
  const tables = await Promise.all(
    pathList.map(async (filepath) => {
      const tableFile = await import(filepath)
      return tableFile.default
    })
  )
  return Promise.all(
    tables
      .sort((a, b) => {
        return (b.options.priority ?? 0) - (a.options.priority ?? 0)
      })
      .map((table) => table.make())
  )
})

/**
 * Welcome to the database file!
 * You can get the docs of **knex** [here](http://knexjs.org/)
 */

export const db = knex({
  client: "pg",
  useNullAsDefault: true,
  connection: {
    port: +(process.env.DB_PORT ?? 5432),
    host: process.env.DB_HOST ?? "localhost",
    user: process.env.DB_USER ?? "postgres",
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE ?? "postgres",
  },
})

export interface TableOptions {
  name: string
  priority?: number
  setup: (table: Knex.CreateTableBuilder) => void
}

export class Table<Type> {
  constructor(public readonly options: TableOptions) {}

  get query() {
    return db<Type>(this.options.name)
  }

  async make(): Promise<this> {
    try {
      await db.schema.createTable(this.options.name, this.options.setup)
      logger.log(
        `created table ${chalk.blueBright(this.options.name)}`,
        "database"
      )
    } catch (error) {
      logger.log(
        `loaded table ${chalk.blueBright(this.options.name)}`,
        "database"
      )
    }
    return this
  }
}

export const tables = new Map<string, Table<any>>()
