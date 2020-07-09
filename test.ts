import { Master } from "./mod.ts";

const master = new Master();

const data = await master
    .ask("age", "How old are you?")
    .confirm("yes", "Do you really want to yes?")
    .radio("line", "Select line?", [
      { title: "first", value: 1 },
      { title: "second", value: 2 },
    ])
    .checkbox("lines", "Select lines?", [
      { title: "first", value: 1 },
      { title: "second", value: 2 },
      { title: "third", value: 3 },
    ])
    .execute();

console.log(data);
