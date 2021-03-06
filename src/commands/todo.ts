import * as app from "../app"

import todoTable, { ToDo } from "../tables/todo"

function todoId(todo: ToDo) {
  return `\`[ ${app.forceTextSize(todo.id, 3, true)} ]\``
}

function todoItem(todo: ToDo) {
  return `${todoId(todo)} ${todo.content
    .replace(/[`*_~]/g, "")
    .replace(/[\s\n]+/g, " ")
    .slice(0, 40)}`
}

async function showTodoList(message: app.Message, user: app.User) {
  const todoList = await todoTable.query.where("user_id", user.id)

  new app.Paginator({
    customEmojis: {
      start: app.Emotes.LEFT,
      previous: app.Emotes.MINUS,
      next: app.Emotes.PLUS,
      end: app.Emotes.RIGHT,
    },
    placeHolder: new app.MessageEmbed().setTitle("No todo task found."),
    channel: message.channel,
    filter: (reaction, user) => user.id === message.author.id,
    pages: app.Paginator.divider(todoList.map(todoItem), 10).map(
      (page, i, pages) =>
        new app.MessageEmbed()
          .setTitle(`Todo list of ${user.tag} (${todoList.length} items)`)
          .setDescription(page.join("\n"))
          .setFooter(`Page ${i + 1} / ${pages.length}`)
    ),
  })
}

async function insertTodo(message: app.NormalMessage) {
  if (message.rest.startsWith("-")) message.rest = message.rest.slice(1).trim()

  const count = await todoTable.query
    .where("user_id", message.author.id)
    .count({ count: "*" })
    .first()
    .then((data) => {
      return data ? Number(data.count ?? 0) : 0
    })

  if (count > 999)
    return message.channel.send(
      `${app.emote(
        message,
        "DENY"
      )} You have too many todo tasks, please remove some first.`
    )

  try {
    const todoData: Omit<ToDo, "id"> = {
      user_id: message.author.id,
      content: message.rest,
    }

    await todoTable.query.insert(todoData)

    const todo = await todoTable.query.where(todoData).first()

    if (!todo) throw new Error()

    return message.channel.send(
      `${app.emote(message, "CHECK")} Saved with ${todoId(todo)} as identifier.`
    )
  } catch (error) {
    app.error(error)
    return message.channel.send(
      `${app.emote(message, "DENY")} An error has occurred.`
    )
  }
}

module.exports = new app.Command({
  name: "todo",
  aliases: ["td"],
  channelType: "all",
  description: "Manage todo tasks",
  async run(message) {
    return message.rest.length === 0
      ? showTodoList(message, message.author)
      : message.channel.send(
          `${app.emote(
            message,
            "DENY"
          )} Bad command usage. Show command detail with \`${
            message.usedPrefix
          }todo -h\``
        )
  },
  subs: [
    new app.Command({
      name: "add",
      description: "Add new todo task",
      aliases: ["new", "+=", "++", "+"],
      channelType: "all",
      run: insertTodo,
    }),
    new app.Command({
      name: "list",
      description: "Show todo list",
      aliases: ["ls"],
      channelType: "all",
      positional: [
        {
          name: "target",
          description: "The target member",
          default: (message) => message?.author.id ?? "no default",
        },
      ],
      async run(message) {
        return showTodoList(message, message.args.target)
      },
    }),
    new app.Command({
      name: "clear",
      description: "Clean todo list",
      aliases: ["clean"],
      channelType: "all",
      async run(message) {
        await todoTable.query.delete().where("user_id", message.author.id)

        return message.channel.send(
          `${app.emote(message, "CHECK")} Successfully deleted todo list`
        )
      },
    }),
    new app.Command({
      name: "get",
      aliases: ["show"],
      description: "Get a todo task",
      channelType: "all",
      positional: [
        {
          name: "id",
          castValue: "number",
          required: true,
          description: "Id of todo task",
        },
      ],
      async run(message) {
        const todo = await todoTable.query
          .select()
          .where("id", message.args.id)
          .and.where("user_id", message.author.id)
          .first()

        if (!todo)
          return message.channel.send(
            `${app.emote(message, "DENY")} Unknown todo task id.`
          )

        return message.channel.send(
          new app.MessageEmbed()
            .setTitle(`Todo task of ${message.author.tag}`)
            .setDescription(`${todoId(todo)} ${todo.content}`)
        )
      },
    }),
    new app.Command({
      name: "remove",
      description: "Remove a todo task",
      aliases: ["delete", "del", "rm", "-=", "--", "-"],
      channelType: "all",
      positional: [
        {
          name: "id",
          castValue: "number",
          required: true,
          description: "Id of todo task",
        },
      ],
      async run(message) {
        const todo = await todoTable.query
          .select()
          .where("id", message.args.id)
          .first()

        if (!todo)
          return message.channel.send(
            `${app.emote(message, "DENY")} Unknown todo task id.`
          )

        if (todo.user_id !== message.author.id)
          return message.channel.send(
            `${app.emote(message, "DENY")} This is not your own task.`
          )

        await todoTable.query.delete().where("id", message.args.id)

        return message.channel.send(
          `${app.emote(message, "CHECK")} Successfully deleted todo task`
        )
      },
    }),
    new app.Command({
      name: "filter",
      description: "Find some todo task",
      aliases: ["find", "search", "q", "query", "all"],
      channelType: "all",
      positional: [
        {
          name: "search",
          required: true,
          description: "Searching query",
        },
      ],
      async run(message) {
        const todoList = (await todoTable.query.select())
          .filter((todo) => {
            return todo.content
              .toLowerCase()
              .includes(message.args.search.toLowerCase())
          })
          .map(todoItem)

        new app.Paginator({
          customEmojis: {
            start: app.Emotes.LEFT,
            previous: app.Emotes.MINUS,
            next: app.Emotes.PLUS,
            end: app.Emotes.RIGHT,
          },
          channel: message.channel,
          placeHolder: new app.MessageEmbed().setTitle("No todo task found."),
          filter: (reaction, user) => user.id === message.author.id,
          pages: app.Paginator.divider(todoList, 10).map((page, i, pages) =>
            new app.MessageEmbed()
              .setTitle(
                `Result of "${message.args.search}" search (${todoList.length} items)`
              )
              .setDescription(page.join("\n"))
              .setFooter(`Page ${i + 1} / ${pages.length}`)
          ),
        })
      },
    }),
  ],
})
