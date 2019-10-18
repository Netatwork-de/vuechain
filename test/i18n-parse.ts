import test from "ava";
import { parseSource } from "../src/tooling/i18n/parse-source";

test("no entity", t => {
	t.deepEqual(parseSource("$x() $x([]) $x({})"), []);
})

test("directive without value", t => {
	t.deepEqual(parseSource(`<div v-x>foo</div>`), [
		{ start: 5, end: 8, key: undefined, type: "directive", value: "foo" }
	]);
});

test("directive with empty value", t => {
	t.deepEqual(parseSource(`<div v-x="">foo</div>`), [
		{ start: 5, end: 11, key: undefined, type: "directive", value: "foo" }
	]);
});

test("directive with whitespace value", t => {
	t.deepEqual(parseSource(`<div v-x=" ">foo</div>`), [
		{ start: 5, end: 12, key: undefined, type: "directive", value: "foo" }
	]);
});

test("directive with empty array", t => {
	t.deepEqual(parseSource(`<div v-x="[]">foo</div>`), [
		{ start: 5, end: 13, key: undefined, type: "directive", value: "foo" }
	]);
	t.deepEqual(parseSource(`<div v-x=" [ ] ">foo</div>`), [
		{ start: 5, end: 16, key: undefined, type: "directive", value: "foo" }
	]);
});

test("directive with value", t => {
	t.deepEqual(parseSource(`<div v-x="42">foo</div>`), [
		{ start: 5, end: 13, key: 42, type: "directive", value: "foo" }
	]);
	t.deepEqual(parseSource(`<div v-x=" 42 ">foo</div>`), [
		{ start: 5, end: 15, key: 42, type: "directive", value: "foo" }
	]);
});

test("directive with value in array", t => {
	t.deepEqual(parseSource(`<div v-x="[42]">foo</div>`), [
		{ start: 5, end: 15, key: 42, type: "directive", value: "foo" }
	]);
	t.deepEqual(parseSource(`<div v-x=" [ 42 ] ">foo</div>`), [
		{ start: 5, end: 19, key: 42, type: "directive", value: "foo" }
	]);
});

test("extended directive with value and params", t => {
	t.deepEqual(parseSource(`<div v-x="[42, {}]">foo</div>`), [
		{ start: 5, end: 19, key: 42, type: "extended-directive", options: "{}", value: "foo" }
	]);
	t.deepEqual(parseSource(`<div v-x=" [ 42 , { } ] ">foo</div>`), [
		{ start: 5, end: 25, key: 42, type: "extended-directive", options: "{ } ", value: "foo" }
	]);
});

test("extended directive with params", t => {
	t.deepEqual(parseSource(`<div v-x="[{}]">foo</div>`), [
		{ start: 5, end: 15, key: undefined, type: "extended-directive", options: "{}", value: "foo" }
	]);
	t.deepEqual(parseSource(`<div v-x=" [ { } ] ">foo</div>`), [
		{ start: 5, end: 20, key: undefined, type: "extended-directive", options: "{ } ", value: "foo" }
	]);
});

test("extended directive with plain params", t => {
	t.deepEqual(parseSource(`<div v-x="{}">foo</div>`), [
		{ start: 5, end: 13, key: undefined, type: "extended-directive", options: "{}", value: "foo" }
	]);
	t.deepEqual(parseSource(`<div v-x=" { } ">foo</div>`), [
		{ start: 5, end: 16, key: undefined, type: "extended-directive", options: " { } ", value: "foo" }
	]);
});

test("translate fn without value", t => {
	t.deepEqual(parseSource(`$x("foo")`), [
		{ start: 3, end: 3, key: undefined, type: "x", value: "foo" }
	]);
	t.deepEqual(parseSource(`$x( "foo" )`), [
		{ start: 3, end: 4, key: undefined, type: "x", value: "foo" }
	]);
});

test("translate fn with value", t => {
	t.deepEqual(parseSource(`$x(42, "foo")`), [
		{ start: 3, end: 7, key: 42, type: "x", value: "foo" }
	]);
	t.deepEqual(parseSource(`$x( 42 , "foo")`), [
		{ start: 3, end: 9, key: 42, type: "x", value: "foo" }
	]);
});

test("entity order", t => {
	t.deepEqual(parseSource(`
		<div v-x="13">foo</div>
		$x(7, "bar")
		<div v-x="42">baz</div>
	`).map(e => e.key), [13, 7, 42]);
});

test("html content whitespace collapsing", t => {
	t.deepEqual(parseSource(`
		<div v-x="42">
			foo   bar
			baz
		</div>
	`), [
		{ start: 8, end: 16, key: 42, type: "directive", value: "foo bar baz" }
	]);

	t.deepEqual(parseSource(`
		<div v-x="42">foo   bar</div>
	`), [
		{ start: 8, end: 16, key: 42, type: "directive", value: "foo bar" }
	]);

	t.deepEqual(parseSource(`
		<div v-x="42">foo   bar   </div>
	`), [
		{ start: 8, end: 16, key: 42, type: "directive", value: "foo bar " }
	]);

	t.deepEqual(parseSource(`
		<div v-x="42">   foo   bar</div>
	`), [
		{ start: 8, end: 16, key: 42, type: "directive", value: " foo bar" }
	]);
});
