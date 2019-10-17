import express = require("express");
import puppeteer = require("puppeteer");
import { join } from "path";
import { createServer } from "http";
import { AddressInfo } from "net";
import bodyParser = require("body-parser");

const API_PREFIX = "/__vuechain_test__/";

export async function runApp({
	cwd,
	timeout = 60 * 1000
}: {
	cwd: string;
	timeout?: number;
}) {
	const app = express();
	const server = createServer(app);
	let end: () => void;
	const chunks: any[] = [];

	app.use(express.static(join(cwd, "dist")));

	app.post(`${API_PREFIX}data`, bodyParser.json(), (req, res) => {
		chunks.push(req.body);
		res.end();
	});

	app.post(`${API_PREFIX}end`, (req, res) => {
		end();
		res.end();
	});

	try {
		await new Promise<void>((resolve, reject) => {
			server.on("error", reject);
			server.listen(0, () => resolve());
		});
		const address = <AddressInfo> server.address();
		const browser = await puppeteer.launch({ headless: false });
		try {
			const page = await browser.newPage();
			await page.goto(`http://localhost:${address.port}/`);
			await new Promise((resolve, reject) => {
				const timer = setTimeout(() => {
					end = () => {};
					reject(new Error("The WebApp timed out."));
				}, timeout);
				end = () => {
					clearTimeout(timer);
					resolve();
				};
			});
		} finally {
			await browser.close();
		}
	} finally {
		server.close();
	}

	return chunks;
}

export function sendData(expression: string) {
	return `fetch("${API_PREFIX}data", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(${expression}) })`;
}

export function sendEnd() {
	return `fetch("${API_PREFIX}end", { method: "POST" })`;
}
