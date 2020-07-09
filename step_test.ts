import { MasterStep } from "./mod.ts";
import { blue, green, red } from "./dep.ts";

const data = await new MasterStep({ name: "User" })
    .start()
    .then((master) => {
      return master.ask("age", `${master.answers.name} how old are you?`);
    })
    .then((master) => {
      if (master.answers.age > 33) {
        return master
            .confirm("kek", "Do you really want to kek?")
            .then((master) => {
              if (master.answers.kek) {
                return master.radio("kek-type", "Select kek:", [
                  { title: "Big", value: 3 },
                  { title: "Medium", value: 2 },
                  { title: "Small", value: 1 },
                ]);
              } else {
                return master.skip();
              }
            });
      } else {
        return master
            .confirm("lol", "Do you really want to lol?")
            .then((master) => {
              if (master.answers.kek) {
                return master.radio("lol-type", "Select lol:", [
                  { title: "Loool", value: 3 },
                  { title: "Lool", value: 2 },
                  { title: "Lol", value: 1 },
                ]);
              } else {
                return master.skip();
              }
            });
      }
    })
    .then((master) => {
      if (master.answers.kek) {
        return master.confirm("good", `Is it good kek?`);
      } else if (master.answers.lol) {
        return master.confirm("good", `Is it good lol?`);
      } else {
        return master.skip();
      }
    })
    .then((master) => {
      return master.checkbox("colors", "Choose colors", [
        { title: red("red"), value: "red" },
        { title: blue("blue"), value: "blue" },
        { title: green("green"), value: "green" },
      ]);
    });

console.log(data);
