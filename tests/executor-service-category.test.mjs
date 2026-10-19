import test from "node:test";
import assert from "node:assert/strict";
import {
  formatExecutorSpecialty,
  formatServiceCategoryDisplayName,
  formatServiceCategoryName,
  getServiceCategoryVisualMeta,
  isExecutorServiceCategory,
} from "../constants/requests.ts";

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

test("the former «КТО» category is shown as «Техника»", () => {
  for (const name of ["КТО", " кто ", "KTO"]) {
    assert.equal(formatServiceCategoryName(name), "Техника", name);
    assert.equal(formatServiceCategoryDisplayName(name), "Техника", name);
    assert.equal(getServiceCategoryVisualMeta(name).title, "Техника", name);
  }
  assert.equal(formatServiceCategoryName("КТО (3 этаж)"), "Техника (3 этаж)");
  assert.equal(formatServiceCategoryName("Офис / KTO"), "Офис / Техника");
  assert.equal(formatServiceCategoryDisplayName("Ремонт КТО и прочие работы по офису"), "Ремонт Техника и прочие работы по офису");
});

test("other category names stay as the administrator named them", () => {
  assert.equal(formatServiceCategoryName("Техническое обслуживание"), "Техническое обслуживание");
  assert.equal(formatServiceCategoryName(" Электрика "), "Электрика");
  assert.equal(formatServiceCategoryName("ЭКТОР"), "ЭКТОР");
  assert.equal(formatServiceCategoryName(null), "");
});

test("a tech executor is a «Техник»", () => {
  for (const specialty of ["КТО", "кто", "KTO", "Техника", " техника "]) {
    assert.equal(formatExecutorSpecialty(specialty), "Техник", specialty);
  }
  assert.equal(formatExecutorSpecialty("Старший КТО"), "Старший Техник");
  assert.equal(formatExecutorSpecialty("электрик"), "электрик");
  assert.equal(formatExecutorSpecialty("Клининг"), "Клининг");
  assert.equal(formatExecutorSpecialty(undefined), "");
});
