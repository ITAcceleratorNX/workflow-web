import test from "node:test";
import assert from "node:assert/strict";
import { isExecutorServiceCategory } from "../constants/requests.ts";

test("the administration category is not offered to executors", () => {
  for (const name of ["Администрация", "администрация офиса", "Административные вопросы", "Administrative"]) {
    assert.equal(isExecutorServiceCategory(name), false, name);
  }
});

test("service categories stay available to executors", () => {
  for (const name of ["КТО", "Клининг", "Cleaning", "Техническое обслуживание", "Электрика"]) {
    assert.equal(isExecutorServiceCategory(name), true, name);
  }
});
