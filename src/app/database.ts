import Enmap from "enmap"
import { ShopItem } from "./utils.ts"

export const cache = new Enmap<string, any>()

export const globals = new Enmap<string, any>({
  name: "globals",
})

export const profiles = new Enmap<string, Profile>({ name: "profiles" })

export const shop = new Enmap<string, ShopItem>({ name: "shopItems" })

export const customCommands = new Enmap<string, string>({
  name: "cc",
})

export const counters = new Enmap<string, Counter>({
  name: "counters",
})

export const snippets = new Enmap<string, string>({
  name: "snippets",
})

export const coolDowns = new Enmap<string, CoolDown>()

// /** Enmap[Guild, Prefix] */
// export const prefixes = new Enmap<Discord.Snowflake, string>({
//   name: "prefixes",
// })
//
// /** Enmap[Guild, Member[]] */
// export const muted = new Enmap<Discord.Snowflake, Discord.Snowflake[]>({
//  name: "muted"
// })

export interface CoolDown {
  time: number
  trigger: boolean
}

export interface Counter {
  target: string
  name: string
  type: "match" | "react"
}

export interface Profile {
  id: string
  money: number
  daily: Daily
  scores: Scores
  moneyLogs: MoneyLog[]
  inventory: ShopItem[]
}

export interface MoneyLog {
  at: number
  diff: number
  state: number
}

export interface Scores {
  [key: string]: number
}

export interface Daily {
  last: number
  combo: number
}
