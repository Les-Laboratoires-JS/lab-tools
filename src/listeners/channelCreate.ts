import * as app from "../app"

const listener: app.Listener<"channelCreate"> = {
  event: "channelCreate",
  async call(channel) {
    if (channel.isText()) {
      await channel.send(
        "Stop créer des chan pour rien Nono <:derp:749360539943174194>"
      )
    }
  },
}

module.exports = listener
