import * as app from "../app"

const table = new app.Table<{
  user_id: string
  channel_id: string
  period: string
  name: string
  content: string
}>({
  name: "cron",
  setup: (table) => {
    table
      .string("user_id")
      .index()
      .references("id")
      .inTable("user")
      .onDelete("CASCADE")
      .notNullable()
    table.string("channel_id").notNullable()
    table.string("period").notNullable()
    table.string("content", 2048).notNullable()
    table.string("name").notNullable()
  },
})

export default table
