import Enmap from "enmap"
import * as app from "../app"

export const cache = new Enmap<string, any>()

export const globals = new Enmap<string, any>({
  name: "globals",
})

export const customCommands = new Enmap<string, string>({
  name: "cc",
})

export const money = new Enmap<string, Money>({ name: "money" })
export async function transaction(
  taxed: string,
  paid: string[],
  amount: number,
  callback?: (missing: number) => unknown
): Promise<boolean> {
  const account = money.ensure(taxed, {
    money: 0,
    history: []
  })

  const total = paid.length * amount

  if (account.money < total) {
    await callback?.(total - account.money)
    return false
  }
  money.set(taxed, account.money - total, "money")
  

  paid.forEach((id) => {
    money.math(id, "+", amount, "money")
    money.push(id, {from: taxed, amount: amount, date: Date.now()}, "history")
    money.push(taxed, {from: id, amount: -amount, date: Date.now()}, "history")
  })

  await callback?.(0)
  return true
}

export const scores = new Enmap<string, Score>({
  name: "scores",
})

export const daily = new Enmap<string, Daily>({ name: "daily" })

export const counters = new Enmap<string, Counter>({
  name: "counters",
})

export const snippets = new Enmap<string, string>({
  name: "snippets",
})

export const companies = new Enmap<string, Company>({
  name: "companies",
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

export interface Score {
  [key: string]: number
}

export interface Counter {
  target: string
  name: string
  type: "match" | "react"
}

export interface Company {
  name: string
  ownerID: app.Discord.Snowflake
  description: string
}

export interface Daily {
  last: number
  combo: number
}

export interface MoneyLogEntry {
  from: string
  amount: number
  date: number
}

export interface Money {
  money: number
  history: MoneyLogEntry[]
}