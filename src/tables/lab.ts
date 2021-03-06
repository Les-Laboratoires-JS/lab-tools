import * as app from "../app"

export interface Lab {
  id: string
  url: string
  title: string
}

const table = new app.Table<Lab>({
  name: "labs",
  setup: (table) => {
    table.string("id").unique().primary().notNullable()
    table.string("url").notNullable()
    table.string("title").notNullable()
  },
})

export default table
