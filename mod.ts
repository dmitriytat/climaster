import {
  bold,
  clearDown,
  goLeft,
  goUp,
  green,
  hideCursor,
  readKeypress,
  red,
  showCursor,
  yellow,
} from "./dep.ts";

export async function print(message: string) {
  await Deno.stdout.write(new TextEncoder().encode(message));
}

export async function printLines(message: string) {
  const lines = message.split("\n");
  const numberOfLines = lines.length;
  const lengthOfLastLine = lines[numberOfLines - 1].length;

  await clearDown();
  await print(message);
  await goLeft(lengthOfLastLine);

  if (numberOfLines > 1) {
    await goUp(numberOfLines - 1);
  }
}

export async function readLine(): Promise<string> {
  const buffer = new Uint8Array(1024);
  const length = <number> await Deno.stdin.read(buffer);
  return new TextDecoder().decode(buffer.subarray(0, length - 1));
}

export async function ask({ question }: Params): Promise<string> {
  await clearDown();
  const q = question + " ";
  await print(q);
  await showCursor();
  const answer = await readLine();
  await hideCursor();
  await goLeft(q.length + answer.length);
  await goUp(1);

  return answer;
}

export async function confirm({ question }: Params): Promise<boolean> {
  await clearDown();
  const q = question + " [y/n] ";
  await print(q);
  let answer = false;

  await showCursor();

  for await (const keypress of readKeypress()) {
    if (keypress.key === "y") {
      answer = true;
    } else if (keypress.ctrlKey && keypress.key === "c") {
      Deno.exit(0);
    }

    break;
  }

  await hideCursor();

  await goLeft(q.length + 1);

  return answer;
}

export function formatRadioList(
  question: RadioParams["question"],
  items: RadioParams["items"],
  currentIndex: number,
  activeIndex: number,
): string {
  const list = items.map((item, index) => {
    const isActive = activeIndex === index;
    const checkbox = isActive ? green("(*)") : red("( )");
    const isCurrent = currentIndex === index;
    const title = isCurrent ? bold(yellow(item.title)) : item.title;

    return `${checkbox} ${title}`;
  });

  let lines = question ? [question] : [];

  return lines.concat(list).join("\n");
}

export function formatCheckboxList(
  question: RadioParams["question"],
  items: RadioParams["items"],
  currentIndex: number,
  checked: any[],
): string {
  const list = items.map((item, index) => {
    const isActive = checked.indexOf(item.value) !== -1;
    const checkbox = isActive ? green("[*]") : red("[ ]");
    const isCurrent = currentIndex === index;
    const title = isCurrent ? bold(yellow(item.title)) : item.title;

    return `${checkbox} ${title}`;
  });

  let lines = question ? [question] : [];

  return lines.concat(list).join("\n");
}

export async function radio(
  { question, items }: RadioParams,
): Promise<boolean> {
  await clearDown();
  let answer: any;
  let activeIndex = 0;
  let currentIndex = 0;

  await printLines(formatRadioList(question, items, currentIndex, activeIndex));

  for await (const keypress of readKeypress()) {
    if (keypress.key === "up") {
      currentIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
    } else if (keypress.key === "down") {
      currentIndex = currentIndex === items.length - 1 ? 0 : currentIndex + 1;
    } else if (keypress.key === "space") {
      activeIndex = currentIndex;
    } else if (keypress.key === "return") {
      answer = items[activeIndex].value;
      break;
    } else if (keypress.ctrlKey && keypress.key === "c") {
      Deno.exit(0);
    }

    await printLines(
      formatRadioList(question, items, currentIndex, activeIndex),
    );
  }

  return answer;
}

export async function checkbox(
  { question, items }: RadioParams,
): Promise<boolean> {
  await clearDown();
  let answer: any;
  let checked: any[] = [];
  let currentIndex = 0;

  await printLines(formatCheckboxList(question, items, currentIndex, checked));

  for await (const keypress of readKeypress()) {
    if (keypress.key === "up") {
      currentIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
    } else if (keypress.key === "down") {
      currentIndex = currentIndex === items.length - 1 ? 0 : currentIndex + 1;
    } else if (keypress.key === "space") {
      const index = checked.indexOf(items[currentIndex].value);
      if (index !== -1) {
        checked.splice(index, 1);
      } else {
        checked.push(items[currentIndex].value);
      }
    } else if (keypress.key === "return") {
      answer = checked;
      break;
    } else if (keypress.ctrlKey && keypress.key === "c") {
      Deno.exit(0);
    }

    await printLines(
      formatCheckboxList(question, items, currentIndex, checked),
    );
  }

  return answer;
}

enum CommandNames {
  ask = "ask",
  confirm = "confirm",
  radio = "radio",
  checkbox = "checkbox",
}

interface Params {
  question: string;
}

interface RadioParams extends Params {
  items: { title: string; value: any }[];
}

interface CheckboxParams extends Params {
  items: { title: string; value: any }[];
}

interface Command {
  name: string;
  command: CommandNames;
  params: Params | RadioParams;
}

export class Master {
  private commands: Command[] = [];
  private result: { [key: string]: any } = {};

  ask(name: Command["name"], question: Params["question"]): Master {
    this.commands.push({
      name,
      command: CommandNames.ask,
      params: { question },
    });

    return this;
  }

  confirm(name: Command["name"], question: RadioParams["question"]): Master {
    this.commands.push({
      name,
      command: CommandNames.confirm,
      params: { question },
    });

    return this;
  }

  radio(
    name: Command["name"],
    question: RadioParams["question"],
    items: RadioParams["items"],
  ) {
    this.commands.push({
      name,
      command: CommandNames.radio,
      params: {
        question,
        items,
      },
    });

    return this;
  }

  checkbox(
    name: Command["name"],
    question: CheckboxParams["question"],
    items: CheckboxParams["items"],
  ) {
    this.commands.push({
      name,
      command: CommandNames.checkbox,
      params: {
        question,
        items,
      },
    });

    return this;
  }

  async execute() {
    await hideCursor();

    for (const command of this.commands) {
      switch (command.command) {
        case CommandNames.ask:
          this.result[command.name] = await ask(command.params as Params);
          break;
        case CommandNames.confirm:
          this.result[command.name] = await confirm(command.params as Params);
          break;
        case CommandNames.radio:
          this.result[command.name] = await radio(
            command.params as RadioParams,
          );
          break;
        case CommandNames.checkbox:
          this.result[command.name] = await checkbox(
            command.params as CheckboxParams,
          );
          break;
      }
    }

    await clearDown();
    await showCursor();

    return this.result;
  }
}

export class MasterStep {
  answers: { [key: string]: any } = {};

  constructor(initial?: MasterStep["answers"]) {
    Object.assign(this.answers, initial);
  }

  async ask(
    name: Command["name"],
    question: Params["question"],
  ): Promise<MasterStep> {
    this.answers[name] = await ask({ question });

    return this;
  }

  async confirm(
    name: Command["name"],
    question: RadioParams["question"],
  ): Promise<MasterStep> {
    this.answers[name] = await confirm({ question });

    return this;
  }

  async radio(
    name: Command["name"],
    question: RadioParams["question"],
    items: RadioParams["items"],
  ): Promise<MasterStep> {
    this.answers[name] = await radio({
      question,
      items,
    });

    return this;
  }

  async checkbox(
    name: Command["name"],
    question: CheckboxParams["question"],
    items: CheckboxParams["items"],
  ): Promise<MasterStep> {
    this.answers[name] = await checkbox({
      question,
      items,
    });

    return this;
  }

  async start(): Promise<MasterStep> {
    return this;
  }

  async skip(): Promise<MasterStep> {
    return this;
  }
}
