import * as app from "../app"

const command: app.Command = {
  name: "shop",
  async run(message) {
    const itemsSorted = app.shop.array().sort((a,b) => {
        if(a.category === "builtin" && b.category === "builtin) {
            return a.name.toUpperCase() > b.name.toUpperCase() ? 1 : -1
        }
        else if (a.category === "builtin") return -1;
        else if (b.category == "builtin") return 1
        else {
            return a.name.toUpperCase() > b.name.toUpperCase() ? 1 : -1
        }
    })
  }
}
