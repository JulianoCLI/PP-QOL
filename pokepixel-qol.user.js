// ==UserScript==
// @name         PokePixel QOL - refill / catch / hunt
// @namespace    pp-qol
// @version      0.6.0
// @match        https://pokepixel.nietore.com/play/*
// @run-at       document-idle
// @grant        none
// @updateURL    https://raw.githubusercontent.com/JulianoCLI/PP-QOL/main/pokepixel-qol.user.js
// @downloadURL  https://raw.githubusercontent.com/JulianoCLI/PP-QOL/main/pokepixel-qol.user.js
// @homepageURL  https://github.com/JulianoCLI/PP-QOL
// ==/UserScript==
(() => {
const PP_VERSION = "0.6.0";
const PP_REPO = "JulianoCLI/PP-QOL";
const K = "pp-qol-v1";
const cfg = Object.assign({
  refillOn: false, ballId: "", ballMin: 20, ballBuy: 50,
  potionId: "", potionMin: 10, potionBuy: 20,
  reviveId: "", reviveMin: 2, reviveBuy: 5,
  catchOn: false, commonBall: "", shinyBall: "capsule_ultra", catchDelay: 900,
  huntOn: false, routes: [], // {min,max,zoneId}
  recoverOn: false,
  sellOn: false, sellIntervalMin: 30, sellKeep: [], sellLastAt: 0,
  sellMonsOn: false, sellMons: [], sellMonsMinSell: 25,
}, JSON.parse(localStorage.getItem(K) || "{}"));
if (!Array.isArray(cfg.sellKeep)) cfg.sellKeep = [];
if (!Array.isArray(cfg.routes)) cfg.routes = [];
if (!Array.isArray(cfg.sellMons)) cfg.sellMons = [];
// migrate: keys are storage UUIDs, not sellable ids; keep array anyway
if (typeof cfg.uiW !== "number") cfg.uiW = 300;
if (typeof cfg.uiH !== "number") cfg.uiH = 0;
const save = () => localStorage.setItem(K, JSON.stringify(cfg));
const PI = () => window.PokeIdle;
const log = (...a) => console.log("[pp-qol]", ...a);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const PP_FONT_B64 = "AAEAAAAMAIAAAwBAR0RFRgARAGcAAB9MAAAAFk9TLzIOYBFsAAABSAAAAGBjbWFwkMCXaQAAAngAAACkZ2FzcP//AAMAAB9EAAAACGdseWbOyuMYAAAD7AAAGIBoZWFkGzwYVwAAAMwAAAA2aGhlYQcjAioAAAEEAAAAJGhtdHgLuAj8AAABqAAAANBsb2NhRB9KOwAAAxwAAADQbWF4cADsCmsAAAEoAAAAIG5hbWU5UmUfAAAcbAAAArhwb3N0/zsAZQAAHyQAAAAgAAEAAAABAADDmXg9Xw889QALBLAAAAAA0jce9AAAAADmrbR//9D/MQNoBAYAAAAIAAIAAAAAAAAAAQAAA+j/OAAAAyD/0P/QA2gAAQAAAAAAAAAAAAAAAAAAAAEAAQAAAGcKaQCEAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAEAyABkAAFAAAEsASwAAACWASwBLAAAAJYAGQB9AAAAgAACQAAAAAAAIAAAAMAAKAgAAAAAAAAAABWLlIuAcAAICcTA+j/OAAAA+gAyAAAAAEAAAAAAlgDhAAAACAAAQMgAAAAAADIAAAAAAAAAAAAyADIAAAAZADIAAABLAAAAAAAZAAAAAAAAAAAAAAAAAAAAAABLADIAAAAZABkAAAAAAAAAAAAAAAAAAAAAAAAAAAAyAAAAAAAAAAAAAAAAAAAAAAAAAAAAGQAAAAAAAAAAABkAAAAyADIAAAAAAAAAAAAAAAAAAAAAAAAAAAAyABkAAAAyAAAAAAAAAAAAAAAAAAAAAAAAABkAAAAAAAAAAAAZAEsAGQAAAEsAAAAZAAAAAAAAABkAAAAAABkAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAJAAAAAgACAABAAAACEAJgBbAF8AfgC3ANcgFCAmIZIloCWyJbwlzycT//8AAAAgACMAKABdAGEAtwDXIBMgJiGSJaAlsiW8Jc8nE////+H/4P/f/97/3f+l/4bgS+A63s/awtqx2qjaltlTAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAbAEYAcwCgANYA8wEPATMBRwFYAWQBcAGTAcMB2QIGAi4CVQJ1ApkCtwLiAwcDGQMvA1sDbgOaA70D3QQEBCkEUgR0BJoEvATqBQEFFwUwBVUFbgWLBagF0wXzBhcGOwZoBoMGmQa7BtgHBAckB1IHZAd2B5YHogfEB+UIAwgnCEkIbAiTCLMIzAjqCQ8JIwk/CVoJdgmYCbsJ2QoCCiIKPQpXCnQKnwq+CuELAAsSCzALSQtWC4ELjguaC7ALzAvZC/AMCAweDEAAAgDIAAACWAOEAAsADwAAExEzNTMVMxEjFSM1ETMVI8hkyGRkyMjIAfQBLGRk/tTIyP7UyAAAAgAAAAACvAOEABsAHwAAPQEzESM1MzUzFTM1MxUzFSMRMxUjFSM1IxUjNSURIxFkZGTIZMhkZGRkyGTIASxkyGQBLGTIyMjIZP7UZMjIyMhkASz+1AABAAD/nAK8A+gAIwAAPQEzFSE1ITUjNTM1MzUzFTMVMxUjNSEVIRUzFSMVIxUjNSM1yAEs/nBkZMjIZGTI/tQBkGRkZMjIyGRkyGTIZMjIZGRkyGTIZMjIZAADAAAAAAK8ArwAGQAdACEAADE1MzUzNTM1MzUzNTM1MxUjFSMVIxUjFSMVAzUzFQEzFSNkZGRkZGRkZGRkZGTIyAEsyMhkZGRkZGRkyGRkZGRkAfTIyP7UyAACAAAAAAK8A4QAJQApAAA1ETM1MzUjNTM1IRUzFSMVIxUzNTMVIxEzFSM1IzUjNSMRMxUhNQE1IxVkZGRkASxkZGRkyGRkyGRkZMj+1AEsZGQBLGRkyGRkyGRkZGT+1GRkyGT+1GRkAfTIyAABAMgAAAJYA4QAEwAANxEzNTM1MxUjFSMRMxUzFSM1IzXIZGTIZGRkZMhkyAH0ZGRkZP4MZGRkZAAAAQDIAAACWAOEABMAADM1MzUzESM1IzUzFTMVMxEjFSMVyGRkZGTIZGRkZGRkAfRkZGRk/gxkZAABAAAAyAMgArwAGwAAETUzNSM1MxUzNTMVIxUzFSMVMxUjNSMVIzUzNchkyMjIZMjIZMjIyGQBkGRkZGRkZGRkZGRkZGRkAAABAGQAyAK8ArwACwAAJSM1IzUzNTMVMxUjAfTIyMjIyMjIyGTIyGQAAQDI/5wB9AEsAAcAACEVIzUzETMRAZDIZMhkZAEs/tQAAAEAAAGQArwB9AADAAARNSEVArwBkGRkAAEBLAAAAfQAyAADAAAlFSM1AfTIyMjIAAEAAABkArwDhAAbAAA9ATM1MzUzNTM1MzUzNTMVIxUjFSMVIxUjFSMVZGRkZGRkZGRkZGRkZGTIZGRkZGRkyGRkZGRkZAADAAAAAAK8A4QAEwAfACMAADURMzUzNSEVMxUzESMVIxUhNSM1OwEVMzUzESM1IxUjFxUjNWRkASxkZGRk/tRkZGRkZGRkZMhkyAH0ZGRkZP4MZGRkZGRkAfRkZMhkZAABAGQAAAK8A4QADQAAMzUzESM1MzUzNTMRMxVkyMhkZMjIZAH0ZGRk/OBkAAEAAAAAArwDhAAjAAA1MzUzNTM1MzUzNSEVIzUzNSEVMxUjFSMVIxUjFSMVITUzFSFkZGRkZP7UyGQB9GRkZGRkZAEsyP1EyGRkZGTIZGRkZMhkZGRkZGTIAAEAAAAAArwDhAAbAAA9ATMVIREhNSERIRUjNTM1IRUzESMVMxEjFSE1yAEs/tQBLP7UyGQB9GRkZGT+DGRkZAEsZAEsZGRkZP7UZP7UZGQAAgAAAAACvAOEABUAGwAAETM1MzUzNTM1MxEzFSMVMxUhNTM1ITcVMzUjFWRkZGTIZGRk/nBk/nDIyGQB9GRkZGT+DGTIZGTIyGTIZAAAAQAAAAACvAOEABMAAD0BMxUhESERIRUhESEVMxEjFSE1yAEs/gwCvP4MAZBkZP4MZGRkASwB9GT+1GT+1GRkAAIAAAAAArwDhAATABcAADURMzUzNSEVIxUjFSEVMxEjFSE1MyERIWRkASzIZAGQZGT+DGQBLP7UZAJYZGRkZMhk/tRkZAEsAAEAAAAAArwDhAATAAARNSERIxUjFSMRIxEzNTM1MzUhFQK8ZGRkyGRkZP7UArzI/tRkZP5wAZBkZMhkAAMAAAAAArwDhAATABcAGwAANREzNSMRMzUhFTMRIxUzESMVITUzIREhNSERIWRkZAH0ZGRkZP4MZAEs/tQBLP7UZAEsZAEsZGT+1GT+1GRkASxkASwAAgAAAAACvAOEABMAFwAAGQEzNSEVMxEjFSMVITUhNTM1ITUzIREhZAH0ZGRk/nABLGT+cGQBLP7UAfQBLGRk/ahkZGRkyGQBLAACASwAZAH0AyAAAwAHAAAlIzUzESM1MwH0yMjIyGTIASzIAAACAMgAAAH0AyAABwALAAAlFSM1MzUzFREjNTMBkMhkyMjIZGRkyMgB9MgAAAEAAAAAAlgDhAAjAAARNTM1MzUzNTM1MxUjFSMVIxUjFTMVMxUzFTMVIzUjNSM1IzVkZGRkyGRkZGRkZGRkyGRkZAGQZGRkZGRkZGRkZGRkZGRkZGRkAAACAGQAyAK8AlgAAwAHAAA3NSEVATUhFWQCWP2oAljIZGQBLGRkAAEAZAAAArwDhAAjAAA3NTM1MzUzNSM1IzUjNSM1MxUzFTMVMxUzFSMVIxUjFSMVIzXIZGRkZGRkZMhkZGRkZGRkZMhkZGRkZGRkZGRkZGRkZGRkZGRkAAACAAAAAAK8A4QAEwAXAAARNTM1IRUzFSMVIxUjNTM1MzUhFRMzFSNkAfRkZGTIZGT+1GTIyAJYyGRkyGTIyGTIyP5wyAAAAQAAAAACvAOEABMAADURMzUhFTMRIxUhETM1IREhFSE1ZAH0ZGT+1Mj+1AGQ/gxkArxkZP4MZAGQyP1EZGQAAAIAAAAAArwDhAATABsAADERMzUzNTM1MxUzFTMVMxEjESEZASE1IzUjFSNkZGRkZGRkyP7UASxkZGQCWGRkZGRkZP2oASz+1AGQyGRkAAMAAAAAArwDhAAPABMAFwAAMTUzESM1IRUzESMVMxEjFSUzESM1MxEjZGQCWGRkZGT+1MjIyMhkArxkZP7UZP7UZGQBLGQBLAAAAQAAAAACvAOEAB8AADURMzUzNSEVMxUjNSM1IxUjETMVMzUzNTMVIxUhNSM1ZGQBkGRkZMhkZMhkZGT+cGTIAfRkZGTIZGRk/gxkZGTIZGRkAAIAAAAAArwDhAAPABcAADE1MxEjNSEVMxUzESMVIxUnMzUzESM1I2RkAfRkZGRkyGRkZGRkArxkZGT+DGRkZGQB9GQAAQAAAAACvAOEABsAADE1MxEjNSERIzUjNSMRMzUzESM1IxEzNTM1MxFkZAK8ZGTIZGRkZMhkZGQCvGT+1GRk/tRk/tRk/tRkZP7UAAEAAAAAArwDhAAXAAAxNTMRIzUhESM1IzUjETM1MxEjNSMRMxVkZAK8ZGTIZGRkZGRkArxk/tRkZP7UZP7UZP7UZAAAAgAAAAACvAOEABkAIQAANREzNTM1IRUzFSM1IzUjFSMRMxUzFSE1IzUFIzUjNSERI2RkAZBkZGTIZGTI/tRkAfRkyAGQZMgB9GRkZMhkZGT+DGRkZGRkyGT+cAABAAAAAAK8A4QACwAAMREzESERMxEjESERyAEsyMj+1AOE/nABkPx8AZD+cAAAAQDIAAACWAOEAAsAACUzFSE1MxEjNSEVIwH0ZP5wZGQBkGRkZGQCvGRkAAABAAAAAAK8A4QADwAAPQEzFTMRIzUhFSMRIxUhNcjIZAGQZGT+cGTIyAK8ZGT9RGRkAAEAAAAAArwDhAAbAAAxNTMRIzUhETM1MzUzFSMVIxUzFTMVIzUjNSMRZGQBLGRkyGRkZGTIZGRkArxk/nDIyMjIZMjIyMj+cAAAAQAAAAACvAOEAA8AADE1MxEjNSEVIxEzNTM1MxFkZAGQZMhkZGQCvGRk/URkZP7UAAABAAAAAAK8A4QAEwAAMREzFTMVMzUzNTMRIxEjFSM1IxHIZGRkyMhkZGQDhGRkZGT8fAH0ZGT+DAAAAQAAAAACvAOEABMAADERMxUzFTMVMxEzESMRIzUjNSMRyGRkZMjIZGRkA4RkZGQBLPx8ASxkZP4MAAIAAAAAArwDhAATAB8AADURMzUzNSEVMxUzESMVIxUhNSM1OwEVMzUzESM1IxUjZGQBLGRkZGT+1GRkZGRkZGRkyAH0ZGRkZP4MZGRkZGRkAfRkZAAAAgAAAAACvAOEAA8AEwAAMTUzESM1IRUzESMVIREzFQMzESNkZAJYZGT+1GRkyMhkArxkZP7UZP7UZAH0ASwAAAIAAP+cArwDhAAPABcAADURMzUhFTMRIxUzFSE1ITU7ATUzFTMRIWQB9GRkZP7U/tRkZGRk/tTIAlhkZP2oyGTIZMhkAfQAAAIAAAAAArwDhAATABcAADE1MxEjNSEVMxEjFTMRIxEjNSMZATMRI2RkAlhkZGTIZGTIyGQCvGRk/tTI/tQBLGT+cAH0ASwAAAEAAAAAArwDhAAjAAA9ATMVITUjNSM1IzUjNTM1IRUzFSM1IRUzFTMVMxUzFSMVITXIASxkyGRkZAH0ZMj+1GTIZGRk/gxkyMjIZGRkyGRkyMjIZGRkyGRkAAEAZAAAArwDhAAPAAATESERIzUjETMVITUzESMVZAJYZGRk/nBkZAJYASz+1GT9qGRkAlhkAAEAAAAAArwDhAALAAA1ETMRIREzESMVITXIASzIZP4MZAMg/OADIPzgZGQAAQAAAAACvAOEABcAABkBMxEzFTM1MxEzESMVIxUjFSM1IzUjNchkZGTIZGRkZGRkASwCWP2oZGQCWP2oZGRkZGRkAAABAAAAAAK8A4QAEwAANREzETM1MxUzETMRIxUjNSMVIzXIZGRkyGTIZMjIArz9qMjIAlj9RMhkZMgAAQAAAAACvAOEACMAADUzNTMRIzUjNTMVMxUzNTM1MxUjFSMRMxUzFSM1IzUjFSMVI2RkZGTIZGRkyGRkZGTIZGRkyMhkASxkyMhkZMjIZP7UZMjIZGTIAAEAZAAAArwDhAATAAATETMRMxEzESMVIxEzFSE1MxEjNWTIyMhkZGT+cGRkAfQBkP5wAZD+cGT+1GRkASxkAAABAAAAAAK8A4QAIwAAMREzNTM1MzUzNTM1IRUjFSMRIRUjFSMVIxUjFSMVITUzNTMRZGRkZGT+1GRkArxkZGRkZAEsZGQBLGRkZGRkZGQBLMhkZGRkyGRk/tQAAAEAyAAAAlgDhAAHAAAlMxUhESEVIwGQyP5wAZDIZGQDhGQAAAEAyAAAAlgDhAAHAAAlESM1IREhNQGQyAGQ/nBkArxk/HxkAAEAAAJYArwD6AAXAAARNTM1MzUzNTMVMxUzFTMVIzUjNSMVIxVkZGRkZGRkyGRkZAJYZGRkZGRkZGRkZGRkAAABAAD/OAK8/5wAAwAAFTUhFQK8yGRkAAABAAAAAAK8AlgAFwAAPQEzNSE1ITUhFTMRMxUjNSM1IxUzFSE1ZAEs/tQBkGRkyGTIyP7UZMhkZGRk/nBkZMjIZGQAAAIAAAAAArwDhAANABMAABE1IREzFTMVMxEjFSEREzMRIzUjASzIZGRk/gzIyGRkAyBk/tRkZP7UZAMg/UQBLGQAAAEAAAAAArwCWAATAAA1ETM1IRUzFSM1IREhNTMVIxUhNWQB9GTI/tQBLMhk/gxkAZBkZGRk/nBkZGRkAAEAAAAAArwDhAAZAAA1ETM1MzUzNSM1IREzFSM1IxEjFSMRMxUhNWRkyGQBLGTIZGRkyP7UZAEsZGTIZPzgZGQBkGT+1GRkAAIAAAAAArwCWAARABUAADURMzUhFTMVIRUhNTMVIxUhNRMVITVkAfRk/gwBLMhk/gxkASxkAZBkZMjIZGRkZAGQZGQAAQAAAAACWAOEABkAADE1MxEjNTMRMzUhFTMVIzUjNSMRMxUjETMVZGRkZAEsZGRkZGRkZGQBLGQBLGRkyGRk/tRk/tRkAAEAAP84ArwCWAAbAAAVNTMVMzUhNSMRMzUhFSMRMxEzNTMVIxEjFSE1yMj+1GRkASzIyGTIZGT+cGRkZMhkASxkZP7UASxkZP2oZGQAAAIAAAAAArwDhAALABMAADE1MxEjNSERMxUjERM1MxUzESMRZGQBLGRkZMhkyGQCvGT+cGT+cAH0ZGT+DAH0AAACAMgAAAJYA4QACQANAAAzNTMRIzUhETMVATUzFchkZAEsZP7UyGQBkGT+DGQCvMjIAAIAZP84ArwDhAANABEAADczFTMRIzUhESMVITUjATUzFWTIyGQBLGT+cGQBkMhkyAJYZP1EZGQDIMjIAAEAAAAAArwDhAAbAAAxNTMRIzUhETM1MzUzFSMVIxUzFTMVIzUjNSMRZGQBLGRkyGRkZGTIZGRkArxk/gxkZGRkZGTIyGT+1AAAAQDIAAACWAOEAAkAACUzFSE1MxEjNSEB9GT+cGRkASxkZGQCvGQAAAEAAAAAArwCWAARAAAxESEVMzUzFTMRIxEjESMRIxEBLGTIZMhkZGQCWGRkZP4MAZD+1AEs/nAAAgAAAAACvAJYAAcADwAAETUzFTMRIxEzNSEVMxEjEchkyMgBLGTIAfRkZP4MAfRkZP4MAfQAAgAAAAACvAJYAAsADwAANREzNSEVMxEjFSE1MyERIWQB9GRk/gxkASz+1GQBkGRk/nBkZAGQAAABAAD/OAK8AlgAFwAAFTUzESM1MxUzETMRIzUhFTMRIxUhFTMVZGTIZMjIASxkZP7UZMhkAlhkZP7UASxkZP7UZMhkAAEAAP84ArwCWAAXAAA1ETM1IRUjETMRMzUzFSMRMxUhNTM1ITVkASzIyGTIZGT+cGT+1MgBLGRk/tQBLGRk/ahkZMhkAAABAAAAAAK8AlgAFQAAMTUzESM1MxUzNSEVMxUjNSMVIxEzFWRkyGQBLGTIZGRkZAGQZGRkZMjIZP7UZAABAAAAAAK8AlgAHwAAPQEzFSE1IzUjNSM1MzUhFTMVIzUhFTMVMxUzFSMVITXIASzIyGRkAfRkyP7UyMhkZP4MZGRkZGRkZGRkZGRkZGRkZGQAAQAAAAACvAOEABUAABE1MzUzNTMRMxUjETM1MxUjFSE1IxHIZGTIyGTIZP7UZAH0ZMhk/tRk/nBkZGRkAZAAAAIAAAAAArwCWAAHAA8AADURMxEzFSE1IREzETMVIzXIyP7UASzIZMhkAfT+DGRkAfT+DGRkAAEAZAAAArwCWAAPAAA3ETMRMxEzESMVIxUjNSM1ZMjIyGRkyGTIAZD+cAGQ/nBkZGRkAAABAAAAAAK8AlgAEwAANREzETM1MxUzETMRIxUjNSMVIzXIZGRkyGTIZMhkAfT+cMjIAZD+DGRkZGQAAQAAAAACvAJYACMAADE1MzUzNSM1IzUzFTMVMzUzNTMVIxUjFTMVMxUjNSM1IxUjFWRkZGTIZGRkyGRkZGTIZGRkZGTIZGRkZGRkZGTIZGRkZGRkAAABAAD/OAK8AlgAEwAAFTUhNTM1ITUjETMRIREzESMVIxUBkGT+cGTIASzIZGTIZGRkZAGQ/nABkP2oZGQAAAEAAAAAArwCWAAbAAAxNTM1MzUzNTM1IxUjNSEVIxUjFSMVIxUzNTMVZGRkZMjIArxkZGRkyMhkZGRkZGTIZGRkZGRkyAABAGQAAAK8A4QAEwAAEzUzETM1IRUjESMVMxEzFSE1IxFkyGQBLMhkZMj+1GQBkGQBLGRk/tRk/tRkZAEsAAIBLAAAAfQDhAADAAcAACEjETM1IxEzAfTIyMjIAZBkAZAAAAEAZAAAArwDhAATAAAzNTMRMzUjESM1IRUzETMVIxEjFWTIZGTIASxkyMhkZAEsZAEsZGT+1GT+1GQAAAEAAAK8ArwDhAAPAAARNTM1IRUzNTMVIxUhNSMVZAEsZMhk/tRkArxkZGRkZGRkZAAAAQEsASwB9AGQAAMAAAEVIzUB9MgBkGRkAAABAAAAZAK8ArwAIwAAPQEzNTM1IzUjNTMVMxUzNTM1MxUjFSMVMxUzFSM1IzUjFSMVZGRkZMhkZGTIZGRkZMhkZGRkZGTIZGRkZGRkZGTIZGRkZGRkAAEAZAGQAlgB9AADAAATNSEVZAH0AZBkZAAAAQAAAZADIAH0AAMAABE1IRUDIAGQZGQAAwAAAAADIADIAAMABwALAAA1MxUjJRUjNSMVIzXIyAMgyGTIyMjIyMjIyAABAAAAyAK8ArwAEwAAETUhNSM1MxUzFTMVIxUjFSM1MzUBkGTIZGRkZMhkAZBkZGRkZGRkZGRkAAEAZABkAlgCvAADAAA3ESERZAH0ZAJY/agAAQAAAGQCvAMgAA8AAD0BMzUzNTM1MxUzFTMVMxVkZGRkZGRkZMjIyGRkyMjIAAEAAABkArwDIAAPAAARNSEVIxUjFSMVIzUjNSM1ArxkZGRkZGQCWMjIyMhkZMjIAAEAZABkArwCvAALAAA3ETM1IRUzESMVITVkZAGQZGT+cMgBkGRk/nBkZAAAAQAAAAACvAPoABcAAD0BMxUzFTM1MxEzETMRIxEjESMVIzUjNWRkZGRkyGRkZMhkyMhkZMgBLAEs/tT+1P7UZGRkAAAAAA0AogADAAEECQAAABwAAAADAAEECQABADwAHAADAAEECQACAA4AWAADAAEECQADAEgAZgADAAEECQAEADwAHAADAAEECQAFAEoArgADAAEECQAGACQA+AADAAEECQAIAAoBHAADAAEECQAJAAoBHAADAAEECQALACIBJgADAAEECQAMACIBJgADAAEECQANAHIBSAADAAEECQAOAFwBugAoAGMAKQAgADIAMAAxADUAIABWAGkAbABlAFIAQgBpAGcAQgBsAHUAZQBUAGUAcgBtAFAAbAB1AHMAIABOAGUAcgBkACAARgBvAG4AdAAgAE0AbwBuAG8AUgBlAGcAdQBsAGEAcgBCAGkAZwBCAGwAdQBlAFQAZQByAG0AUABsAHUAcwAgAE4AZQByAGQAIABGAG8AbgB0ACAATQBvAG4AbwAgADMALgA1AC4AMQBWAGUAcgBzAGkAbwBuACAAdgAxAC4AMAAtADIAMAAxADUALQAxADEAOwBOAGUAcgBkACAARgBvAG4AdABzACAAMwAuADUALgAxAEIAaQBnAEIAbAB1AGUAVABlAHIAbQBQAGwAdQBzAE4ARgBNAFYAaQBsAGUAUgBoAHQAdABwADoALwAvAGkAbgB0ADEAMABoAC4AbwByAGcAQwByAGUAYQB0AGkAdgBlACAAQwBvAG0AbQBvAG4AcwAgAEEAdAB0AHIAaQBiAHUAdABpAG8AbgAtAFMAaABhAHIAZQBBAGwAaQBrAGUAIAA0AC4AMAAgAEkAbgB0AGUAcgBuAGEAdABpAG8AbgBhAGwAaAB0AHQAcAA6AC8ALwBjAHIAZQBhAHQAaQB2AGUAYwBvAG0AbQBvAG4AcwAuAG8AcgBnAC8AbABpAGMAZQBuAHMAZQBzAC8AYgB5AC0AcwBhAC8ANAAuADAALwADAAAAAAAA/zgAZAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAf//AAIAAQAAAAwAAAAAAAAAAgABAAEAZgABAAA=";

// ---- inventory / shop ----
async function invList() {
  const Api = PI().Api;
  try { Api.invalidateDynamicCache(); } catch {}
  const r = await Api.getInventory();
  const arr = r.data || r.inventory || r || [];
  return Array.isArray(arr) ? arr : [];
}
const qtyOf = (list, id) => {
  const it = list.find(i => String(i.item_id || i.id) === String(id));
  return Number(it?.qty ?? it?.quantity ?? 0);
};
async function ensureStock(itemId, min, buyQty) {
  if (!itemId || !cfg.refillOn || !(Number(min) > 0) || !(Number(buyQty) > 0)) return;
  const list = await invList();
  const q = qtyOf(list, itemId);
  if (q >= min) return;
  log("refill", itemId, "qtd", q, "comprando", buyQty);
  await PI().Api.buyShopItem(itemId, buyQty);
}

// refill loop: checa a cada 15s
async function refillTick() {
  if (!cfg.refillOn) return;
  try {
    await ensureStock(cfg.ballId, cfg.ballMin, cfg.ballBuy);
    await ensureStock(cfg.potionId, cfg.potionMin, cfg.potionBuy);
    await ensureStock(cfg.reviveId, cfg.reviveMin, cfg.reviveBuy);
  } catch (e) { log("refill falhou", e.code || e.message || e); }
}

// ---- auto catch ----
// ponytail: um arremesso por tick; sem fila paralela nem filtro por IV/quality
let lastThrow = 0;
const thrown = new Map();
function queueBodies() {
  const s = PI().HuntSimStage;
  if (!s || !s.active) return [];
  return [...s.captureQueue.values()];
}
async function catchTick() {
  if (!cfg.catchOn) return;
  const now = Date.now();
  if (now - lastThrow < cfg.catchDelay) return;
  const bodies = queueBodies();
  if (!bodies.length) return;
  // shiny primeiro, depois expiracao mais proxima
  bodies.sort((a, b) => ((b.shiny ? 1 : 0) - (a.shiny ? 1 : 0)) || ((a.expiresAt || 0) - (b.expiresAt || 0)));
  const t = bodies.find(b => !thrown.has(b.id) || now - thrown.get(b.id) > 8000);
  if (!t) return;
  const stage = PI().HuntSimStage;
  const ball = t.shiny ? cfg.shinyBall : cfg.commonBall;
  thrown.set(t.id, now);
  lastThrow = now;
  if (!ball) stage.throwBestCapsule(t.id);
  else stage.throwCapsule(ball, t.id);
  log("catch", t.speciesId, "lv" + t.level, t.shiny ? "SHINY" : "", "bola", ball || "best", "id", t.id);
}

// ---- auto hunt ----
let zonesCache = [];
let shopCache = [];
let speciesCache = {};
let catalogCache = [];
async function getZones() {
  if (zonesCache.length) return zonesCache;
  const r = await PI().Api.getZones();
  zonesCache = r.data || r || [];
  return zonesCache;
}
async function getShop() {
  if (shopCache.length) return shopCache;
  const r = await PI().Api.getShopItems();
  const a = r.data || r || [];
  shopCache = Array.isArray(a) ? a : [];
  return shopCache;
}
async function getSpecies() {
  if (Object.keys(speciesCache).length) return speciesCache;
  try {
    const r = await PI().Api.getSpeciesList();
    const a = r.data || r || [];
    (Array.isArray(a) ? a : []).forEach(s => { speciesCache[s.id] = s; });
  } catch {}
  return speciesCache;
}
async function getCatalog() {
  if (catalogCache.length) return catalogCache;
  const r = await PI().Api.getItemCatalog();
  const a = r.data || r || [];
  catalogCache = Array.isArray(a) ? a : [];
  return catalogCache;
}
function catalogById(id) {
  return catalogCache.find(i => String(i.id || i.item_id) === String(id)) || {};
}
// ---- auto sell (Mark) ----
const sellFilter = { text: "" };
function sellProtectedIds() {
  return new Set([cfg.ballId, cfg.potionId, cfg.reviveId, cfg.commonBall, cfg.shinyBall].filter(Boolean).map(String));
}
async function sellCandidates() {
  const list = await invList();
  await getCatalog().catch(() => []);
  const keep = new Set((cfg.sellKeep || []).map(String));
  const prot = sellProtectedIds();
  return list
    .filter(i => (i.can_sell !== false) && Number(i.sellable_qty ?? i.qty ?? i.quantity ?? 0) > 0)
    .filter(i => !keep.has(String(i.item_id || i.id)) && !prot.has(String(i.item_id || i.id)))
    .map(i => {
      const id = String(i.item_id || i.id);
      const cat = catalogById(id);
      return { id, qty: Number(i.sellable_qty ?? i.qty ?? i.quantity ?? 0), name: i.name || cat.name || id, sell: Number(i.sell_price ?? cat.sell_price ?? 0) };
    });
}
async function sellTick(force) {
  if (!cfg.sellOn && !force) return "off";
  if (!force && Date.now() - Number(cfg.sellLastAt || 0) < Number(cfg.sellIntervalMin || 30) * 60000) return "wait";
  const items = await sellCandidates();
  const mons = await sellMonCandidates();
  if (!items.length && !mons.length) return "empty";
  let res = {}, gold = null;
  if (items.length) {
    const payload = items.map(c => ({ item_id: c.id, qty: c.qty }));
    res = await PI().Api.sellShopItems(payload);
    gold = res.gold ?? res.total ?? gold;
  }
  let monRes = null;
  // ponytail: lotes de 500 ids, mesmo limite do NPC
  for (let o = 0; o < mons.length; o += 500) {
    monRes = await PI().Api.sellShopCreatures(mons.slice(o, o + 500).map(m => m.id));
    gold = monRes.gold ?? gold;
  }
  cfg.sellLastAt = Date.now(); save();
  const receipt = {
    items: items.map(c => ({ id: c.id, name: c.name, qty: c.qty, gold: c.qty * c.sell })),
    mons: mons.map(m => ({ id: m.id, name: m.name, gold: m.price })),
    gold,
  };
  receipt.totalGold = receipt.items.reduce((s, x) => s + x.gold, 0) + receipt.mons.reduce((s, x) => s + x.gold, 0);
  log("sell", items.length, "itens +", mons.length, "mons, ~" + receipt.totalGold + " ouro");
  sellNotify(receipt);
  refreshSellPreview().catch(() => {});
  return receipt;
}
// ---- auto sell pokemons (opt-in, allowlist; off default) ----
const sellMonFilter = { text: "" };
function monSellable(c) {
  return !!c && (c.location === "inventory" || c.location === "storage")
    && c.captured_zone !== "starter_gift" && !c.locked
    && c.species_id !== "ditto" && !c.is_shiny && !c.mega_active;
}
async function sellableMons() {
  try { PI().Api.invalidateDynamicCache(); } catch {}
  const [inv, sto] = await Promise.all([
    PI().Api.getCreatures("inventory").catch(() => ({})),
    PI().Api.getCreatures("storage").catch(() => ({})),
  ]);
  const all = [...(inv.data || inv || []), ...(sto.data || sto || [])].filter(monSellable);
  await getSpecies().catch(() => {});
  return all.map(c => {
    const sp = speciesCache[c.species_id] || {};
    return { id: String(c.id), name: `${c.nickname || sp.name || c.species_id} lv${c.level || "?"}`, species: c.species_id, level: Number(c.level || 0), price: Math.max(25, Number(c.sell_value || 0)), locked: !!c.locked, shiny: !!c.is_shiny };
  });
}
async function sellMonCandidates() {
  if (!cfg.sellMonsOn) return [];
  const allow = new Set((cfg.sellMons || []).map(String));
  if (!allow.size) return [];
  const all = await sellableMons();
  return all.filter(m => allow.has(m.id));
}
function zoneInfo(z) {
  const enc = (z.encounters || [])[0] || {};
  const sp = speciesCache[enc.species_id] || {};
  return {
    id: z.id,
    name: z.name || sp.name || enc.species_id || String(z.id).slice(0, 8),
    species: enc.species_id || "",
    min: Number(z.min_level || enc.min_level || 0),
    max: Number(z.max_level || enc.max_level || 0),
    elements: [...new Set([...(z.elements || []), ...((sp.elements || sp.types) || [])])],
  };
}
function zoneName(id) {
  const z = zonesCache.find(x => String(x.id) === String(id));
  if (!z) return String(id).slice(0, 8);
  const info = zoneInfo(z);
  return `${info.name} lv${info.min}${info.min === info.max ? "" : "-" + info.max}`;
}
async function teamLevel() {
  try { PI().Api.invalidateDynamicCache(); } catch {}
  const r = await PI().Api.getCreatures("team");
  const m = r.data || r || [];
  const alive = (Array.isArray(m) ? m : []).find(c => Number(c.hp || 0) > 0) || m[0];
  return Number(alive?.level || alive?.lv || 1);
}
function currentZoneId() {
  try { return String(PI().HuntSimStage?.zoneId() || PI().Local?.selectedZoneId || ""); } catch { return ""; }
}
function isInHunt() {
  try {
    const s = PI().HuntSimStage;
    if (!s || !s.active) return false;
    if (window.$gameMap && Number(window.$gameMap.mapId()) === 1) return false;
    return true;
  } catch { return false; }
}
async function enterZone(zoneId) {
  const Api = PI().Api;
  const res = await Api.prepareHunt(zoneId);
  const al = res.allocation || res.data || res;
  if (!al?.map_id) throw new Error("allocation invalida");
  if (PI().HuntPresentation?.enter) {
    const cur = currentZoneId();
    await PI().HuntPresentation.enter(al, { source: "pp-qol", replaceActive: !!cur && cur !== String(al.zone_id) });
  } else {
    try { await Api.stopHunt(); } catch {}
    PI().Local.selectedZoneId = al.zone_id;
    PI().Local.selectedHuntMapId = al.map_id;
    PI().Local.selectedHuntAllocation = al;
    await PI().Nav.goToHunt(al.map_id);
  }
  log("hunt entrou", al.zone_id, "map", al.map_id);
}
async function huntTick() {
  if (!cfg.huntOn || !cfg.routes.length) return;
  try {
    const lv = await teamLevel();
    const route = cfg.routes.find(r => lv >= Number(r.min) && lv <= Number(r.max));
    if (!route) return;
    // ponytail: cidade nunca conta como "ja na zona"; entra sempre que fora da hunt
    if (isInHunt() && currentZoneId() === String(route.zoneId)) return;
    await enterZone(route.zoneId);
  } catch (e) {
    if (e.code === "HUNT_CHANGE_COOLDOWN") await sleep(Number(e.retryAfterMs || 5000));
    else if (e.code !== "FARM_PENDING") log("hunt falhou", e.code || e.message || e);
  }
}

// ---- UI ----
function sel(id, val, opts, cb) {
  const s = document.getElementById(id);
  s.innerHTML = "";
  opts.forEach(o => {
    const el = document.createElement("option");
    el.value = o[0]; el.textContent = o[1];
    s.appendChild(el);
  });
  s.value = val || "";
  s.onchange = () => { cb(s.value); save(); };
}
const huntFilter = { text: "", min: "", max: "", el: "" };
function filteredZones() {
  const t = huntFilter.text.trim().toLowerCase();
  const fmin = huntFilter.min === "" ? -Infinity : +huntFilter.min;
  const fmax = huntFilter.max === "" ? Infinity : +huntFilter.max;
  return zonesCache.map(zoneInfo).filter(z => {
    if (z.min > fmax || z.max < fmin) return false;
    if (huntFilter.el && !z.elements.map(e => String(e).toLowerCase()).includes(huntFilter.el)) return false;
    if (t && !(z.name + " " + z.species).toLowerCase().includes(t)) return false;
    return true;
  }).sort((a, b) => a.min - b.min || a.name.localeCompare(b.name));
}
function shopLabel(i, qty) {
  const price = i.price ?? i.cost ?? "?";
  return `${i.name || i.item_id || i.id} — ${price} ouro${qty != null ? ` (tem ${qty})` : ""}`;
}
async function fillSelectors() {
  const [list, shop] = await Promise.all([invList().catch(() => []), getShop().catch(() => [])]);
  await getSpecies().catch(() => {});
  const qtyById = id => qtyOf(list, id);
  const byType = t => shop.filter(i => (i.type || i.item?.type) === t);
  const mkOpts = (arr, offLabel) => [["", offLabel], ...arr.map(i => {
    const id = String(i.item_id || i.id);
    return [id, shopLabel({ name: i.name || i.item?.name, item_id: id, price: i.price ?? i.cost }, qtyById(id))];
  })];
  const balls = byType("capsule"), pots = byType("potion"), revs = byType("revive");
  sel("pp-ball", cfg.ballId, mkOpts(balls, "off"), v => cfg.ballId = v);
  sel("pp-pot", cfg.potionId, mkOpts(pots, "off"), v => cfg.potionId = v);
  sel("pp-rev", cfg.reviveId, mkOpts(revs, "off"), v => cfg.reviveId = v);
  sel("pp-common", cfg.commonBall, mkOpts(balls, "melhor (auto)"), v => cfg.commonBall = v);
  sel("pp-shiny", cfg.shinyBall, mkOpts(balls, "melhor (auto)"), v => cfg.shinyBall = v);
  await getZones().catch(() => []);
  const els = [...new Set(zonesCache.flatMap(z => zoneInfo(z).elements.map(e => String(e).toLowerCase())) )].sort();
  const esel = document.getElementById("pp-fel");
  if (esel) {
    const cur = huntFilter.el;
    esel.innerHTML = "";
    [["", "tipo: todos"], ...els.map(e => [e, e])].forEach(([v, l]) => {
      const o = document.createElement("option"); o.value = v; o.textContent = l; esel.appendChild(o);
    });
    esel.value = cur;
  }
  renderZoneOptions();
  renderRoutes();
  renderSellKeep();
  refreshSellKeepOptions().catch(() => {});
  refreshSellPreview().catch(() => {});
}
function renderZoneOptions() {
  const zsel = document.getElementById("pp-zone");
  if (!zsel) return;
  const cur = zsel.value || null;
  zsel.innerHTML = "";
  const rows = filteredZones();
  rows.forEach(z => {
    const o = document.createElement("option");
    o.value = z.id;
    o.textContent = `${z.name} lv${z.min}${z.min === z.max ? "" : "-" + z.max}${z.elements.length ? " [" + z.elements.join("/") + "]" : ""}`;
    zsel.appendChild(o);
  });
  const hint = document.getElementById("pp-zcount");
  if (hint) hint.textContent = `${rows.length}/${zonesCache.length} zonas`;
  if (cur && rows.some(z => String(z.id) === String(cur))) zsel.value = cur;
}
function renderRoutes() {
  const d = document.getElementById("pp-routes");
  if (!d) return;
  d.innerHTML = cfg.routes.map((r, i) => `<div>${r.min}-${r.max} → ${zoneName(r.zoneId)} <button data-i="${i}">x</button></div>`).join("") || "<div>sem rotas</div>";
  d.querySelectorAll("button").forEach(b => b.onclick = () => { cfg.routes.splice(Number(b.dataset.i), 1); save(); renderRoutes(); });
}
function itemName(id) {
  const c = catalogById(id);
  return c.name || id;
}
async function refreshSellKeepOptions() {
  const s = document.getElementById("pp-skeep-sel");
  if (!s) return;
  await getCatalog().catch(() => []);
  const t = (sellFilter.text || "").trim().toLowerCase();
  const rows = catalogCache
    .filter(i => i && (i.id || i.item_id))
    .filter(i => !t || String((i.name || "") + " " + (i.id || i.item_id)).toLowerCase().includes(t))
    .slice(0, 200);
  const cur = s.value;
  s.innerHTML = "";
  rows.forEach(i => {
    const id = String(i.id || i.item_id);
    const o = document.createElement("option");
    o.value = id;
    o.textContent = `${i.name || id} (${i.type || "?"})`;
    s.appendChild(o);
  });
  if (cur && [...s.options].some(o => o.value === cur)) s.value = cur;
  const hint = document.getElementById("pp-skeep-count");
  if (hint) hint.textContent = `${rows.length}/${catalogCache.length} itens`;
}
function renderSellKeep() {
  const d = document.getElementById("pp-skeep-list");
  if (!d) return;
  d.innerHTML = (cfg.sellKeep || []).map((id, i) => `<div class=pp-skeep>${itemName(id)} <button data-i="${i}">x</button></div>`).join("") || "<div>nenhum — vende tudo vendável</div>";
  d.querySelectorAll("button").forEach(b => b.onclick = () => { cfg.sellKeep.splice(Number(b.dataset.i), 1); save(); renderSellKeep(); refreshSellPreview(); });
}
function sellSummary(r) {
  if (!r || typeof r !== "object" || !("items" in r)) return String(r);
  const nu = r.items.reduce((s, x) => s + x.qty, 0);
  return `vendido: ${r.items.length} tipos (${nu} un) + ${r.mons.length} mons = +${r.totalGold} ouro`;
}
function sellNotify(r) {
  const st = document.getElementById("pp-status");
  const txt = sellSummary(r);
  if (st) st.textContent = txt;
  const toast = document.getElementById("pp-toast");
  const lines = [
    ...r.items.map(c => `${c.name} x${c.qty} → +${c.gold}`),
    ...r.mons.map(m => `${m.name} → +${m.gold}`),
  ];
  if (toast) {
    toast.innerHTML = `<b>${txt}</b>` + (lines.length ? "<br>" + lines.slice(0, 12).join("<br>") + (lines.length > 12 ? "<br>…" : "") : "<br>nada vendido");
    toast.classList.add("pp-show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove("pp-show"), 9000);
  }
  log("sell", txt, lines.slice(0, 12).join(" | "));
  return txt;
}
async function refreshSellPreview() {
  const d = document.getElementById("pp-spreview");
  if (!d) return;
  try {
    const [items, mons] = await Promise.all([sellCandidates(), sellMonCandidates()]);
    const units = items.reduce((s, x) => s + x.qty, 0);
    const gold = items.reduce((s, x) => s + x.qty * x.sell, 0) + mons.reduce((s, x) => s + x.price, 0);
    const il = items.slice(0, 6).map(c => `${c.name} x${c.qty} (+${c.qty * c.sell})`);
    const ml = mons.slice(0, 4).map(m => `${m.name} (+${m.price})`);
    const all = [...il, ...ml];
    d.innerHTML = (items.length || mons.length)
      ? `<b>vende agora: ${items.length} tipos (${units} un) + ${mons.length} mons = ~${gold} ouro</b><br>` + all.join("<br>") + ((items.length + mons.length) > all.length ? "<br>…" : "")
      : "nada a vender (filtros/estoque)";
  } catch (e) { d.textContent = "preview falhou"; }
}
const _ppMonMap = {};
async function refreshSellMonOptions() {
  const s = document.getElementById("pp-sm-sel");
  if (!s) return;
  const all = await sellableMons().catch(() => []);
  all.forEach(m => { _ppMonMap[m.id] = m.name; });
  const t = (sellMonFilter.text || "").trim().toLowerCase();
  const allow = new Set((cfg.sellMons || []).map(String));
  const rows = all.filter(m => !allow.has(m.id) && (!t || (m.name + " " + m.species).toLowerCase().includes(t))).slice(0, 200);
  const cur = s.value;
  s.innerHTML = "";
  rows.forEach(m => {
    const o = document.createElement("option");
    o.value = m.id;
    o.textContent = `${m.name} (+${m.price})`;
    s.appendChild(o);
  });
  if (cur && [...s.options].some(o => o.value === cur)) s.value = cur;
  const hint = document.getElementById("pp-sm-count");
  if (hint) hint.textContent = `${rows.length} mons vendáveis`;
}
function renderSellMons() {
  const d = document.getElementById("pp-sm-list");
  if (!d) return;
  const rows = cfg.sellMons || [];
  d.innerHTML = rows.map((id, i) => `<div class=pp-skeep>${_ppMonMap[String(id)] || String(id).slice(0, 8)} <button data-i="${i}">x</button></div>`).join("") || "<div>lista vazia — nenhum pokemon será vendido</div>";
  d.querySelectorAll("button").forEach(b => b.onclick = () => { cfg.sellMons.splice(Number(b.dataset.i), 1); save(); renderSellMons(); refreshSellPreview(); });
}
function ui() {
  if (document.getElementById("pp-qol")) return;
  if (!document.getElementById("pp-qol-css")) {
    const st = document.createElement("style");
    st.id = "pp-qol-css";
    st.textContent = `
#pp-qol{position:fixed;right:12px;top:50%;transform:translateY(-50%);z-index:99999;width:300px;background:linear-gradient(165deg,#1a1e30,#10121e);color:#e9ebf5;border:1px solid #333a58;border-radius:16px;box-shadow:0 14px 44px rgba(0,0,0,.6);font:12px/1.5 'PP-Term',ui-monospace,monospace;overflow:hidden;transition:transform .25s,opacity .25s}
#pp-qol.pp-min{display:none}
#pp-qol-tab{position:fixed;right:0;top:50%;transform:translateY(-50%);z-index:99999;background:linear-gradient(165deg,#7c5cff,#4a3aff);color:#fff;border:none;border-radius:10px 0 0 10px;padding:10px 7px;cursor:pointer;font:700 12px system-ui;writing-mode:vertical-rl;box-shadow:0 8px 24px rgba(0,0,0,.5);display:none}
#pp-qol-tab.pp-show{display:block}
.pp-head{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:rgba(124,92,255,.14);border-bottom:1px solid #2c3147}
.pp-head b{font-size:13px;letter-spacing:.5px}
.pp-dot{width:8px;height:8px;border-radius:50%;background:#3ddc84;display:inline-block;margin-right:6px;box-shadow:0 0 8px #3ddc84}
#pp-hide{background:#232842;color:#fff;border:1px solid #3a4160;border-radius:8px;width:26px;height:22px;cursor:pointer;font-size:14px;line-height:1}
#pp-hide:hover{background:#7c5cff}
.pp-body{padding:10px 12px;max-height:70vh;overflow:auto}
.pp-toggles{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:10px}
.pp-skeep{display:flex;justify-content:space-between;align-items:center;background:#12152a;border:1px solid #2c3147;border-radius:6px;padding:3px 7px;margin-top:4px}
.pp-skeep button{background:none;border:none;color:#ff7b7b;cursor:pointer}
.pp-preview{font-size:11px;color:#9aa0b8;margin-top:4px;max-height:90px;overflow:auto}
.pp-toggle{display:flex;align-items:center;gap:6px;background:#1d2233;border:1px solid #2c3147;border-radius:8px;padding:6px 8px;cursor:pointer;user-select:none}
.pp-toggle.on{border-color:#7c5cff;background:rgba(124,92,255,.16)}
.pp-toggle input{accent-color:#7c5cff}
.pp-sec{background:#1d2233;border:1px solid #2c3147;border-radius:10px;padding:8px;margin-bottom:8px}
.pp-sec h4{margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:.6px;color:#9aa0b8}
.pp-row{display:flex;align-items:center;gap:5px;margin-bottom:6px}
.pp-row:last-child{margin-bottom:0}
.pp-row span.lbl{width:44px;color:#9aa0b8;flex:none}
#pp-qol select,#pp-qol input[type=text],#pp-qol input:not([type]){background:#12152a;color:#e8eaf2;border:1px solid #343a55;border-radius:6px;padding:3px 5px;font-size:12px;max-width:100%}
#pp-qol input[size]{width:34px}
#pp-qol select{flex:1;min-width:0}
#pp-add{background:#7c5cff;color:#fff;border:none;border-radius:6px;padding:4px 10px;cursor:pointer;font-weight:700}
#pp-add:hover{background:#6a4ef0}
#pp-routes div{display:flex;justify-content:space-between;background:#12152a;border:1px solid #2c3147;border-radius:6px;padding:3px 7px;margin-top:4px}
#pp-routes button{background:none;border:none;color:#ff7b7b;cursor:pointer}
.pp-status{font-size:11px;color:#9aa0b8;text-align:center;margin-top:4px}
.pp-hint{font-size:11px;color:#9aa0b8;margin:2px 0 6px}
.pp-head{cursor:grab}
.pp-head:active{cursor:grabbing}
.pp-h{position:absolute;width:14px;height:14px;z-index:2;opacity:.55}
.pp-h:hover{opacity:1}
.pp-h[data-c=nw]{top:-4px;left:-4px;cursor:nwse-resize}
.pp-h[data-c=ne]{top:-4px;right:-4px;cursor:nesw-resize}
.pp-h[data-c=sw]{bottom:-4px;left:-4px;cursor:nesw-resize}
.pp-h[data-c=se]{bottom:-4px;right:-4px;cursor:nwse-resize}
#pp-toast{margin:8px 0 0;padding:8px;border:1px solid #3ddc84;border-radius:10px;background:rgba(61,220,132,.08);font-size:11px;display:none;max-height:150px;overflow:auto}
#pp-toast.pp-show{display:block}`;
  const th = document.createElement("style");
  th.id = "pp-qol-theme";
  th.textContent = "@font-face{font-family:'PP-Term';src:url(data:font/woff2;base64," + PP_FONT_B64 + ") format('woff2');font-display:swap}";
  document.head.appendChild(th);
    document.head.appendChild(st);
  }
  const tab = document.createElement("button");
  tab.id = "pp-qol-tab";
  tab.textContent = "◀ PP-QOL";
  document.body.appendChild(tab);
  const d = document.createElement("div");
  d.id = "pp-qol";
  d.innerHTML = `
<div class=pp-head><span><span class=pp-dot></span><b>PP-QOL</b></span><button id=pp-hide title=minimizar>–</button></div>
<div class=pp-body>
<div class=pp-toggles>
<label class="pp-toggle ${cfg.refillOn ? "on" : ""}"><input type=checkbox id=pp-rOn ${cfg.refillOn ? "checked" : ""}>Refill</label>
<label class="pp-toggle ${cfg.catchOn ? "on" : ""}"><input type=checkbox id=pp-cOn ${cfg.catchOn ? "checked" : ""}>Catch</label>
<label class="pp-toggle ${cfg.huntOn ? "on" : ""}"><input type=checkbox id=pp-hOn ${cfg.huntOn ? "checked" : ""}>Hunt</label>
<label class="pp-toggle ${cfg.recoverOn ? "on" : ""}"><input type=checkbox id=pp-recOn ${cfg.recoverOn ? "checked" : ""}>Recover</label>
<label class="pp-toggle ${cfg.sellOn ? "on" : ""}"><input type=checkbox id=pp-sOn ${cfg.sellOn ? "checked" : ""}>Sell</label>
</div>
<div class=pp-sec><h4>Refill</h4>
<div class=pp-row><span class=lbl>Bola</span><select id=pp-ball></select></div>
<div class=pp-row><span class=lbl></span>min<input id=pp-bMin size=3 value=${cfg.ballMin}>qtd<input id=pp-bBuy size=3 value=${cfg.ballBuy}></div>
<div class=pp-row><span class=lbl>Pocao</span><select id=pp-pot></select></div>
<div class=pp-row><span class=lbl></span>min<input id=pp-pMin size=3 value=${cfg.potionMin}>qtd<input id=pp-pBuy size=3 value=${cfg.potionBuy}></div>
<div class=pp-row><span class=lbl>Revive</span><select id=pp-rev></select></div>
<div class=pp-row><span class=lbl></span>min<input id=pp-rMin size=3 value=${cfg.reviveMin}>qtd<input id=pp-rBuy size=3 value=${cfg.reviveBuy}></div>
</div>
<div class=pp-sec><h4>Captura</h4>
<div class=pp-row><span class=lbl>Comum</span><select id=pp-common></select></div>
<div class=pp-row><span class=lbl>Shiny</span><select id=pp-shiny></select></div>
</div>
<div class=pp-sec><h4>Hunt — buscar zona</h4>
<div class=pp-row><input id=pp-ftext placeholder="nome: ex meowth" style="flex:1"></div>
<div class=pp-row><input id=pp-fmin size=3 placeholder="nv min">-<input id=pp-fmax size=3 placeholder="nv max"><select id=pp-fel style="flex:1"></select></div>
<div class=pp-row><select id=pp-zone></select></div>
<div class=pp-row><span class=lbl id=pp-zcount style="width:auto"></span></div>
</div>
<div class=pp-sec><h4>Rotas por nivel</h4>
<div class=pp-row><input id=pp-rmin size=3 placeholder=1>-<input id=pp-rmax size=3 placeholder=10><button id=pp-add>+</button></div>
<div id=pp-routes></div>
</div>
<div class=pp-sec><h4>Auto sell (Mark)</h4>
<div class=pp-row>cada<input id=pp-sMin size=3 value=${cfg.sellIntervalMin}>min <button id=pp-sell-now>Vender agora</button></div>
<div class=pp-row><input id=pp-skeep-text placeholder="buscar item p/ nao vender" style="flex:1"></div>
<div class=pp-row><select id=pp-skeep-sel></select><button id=pp-skeep-add>+</button></div>
<div class=pp-row><span class=lbl id=pp-skeep-count style="width:auto"></span></div>
<div id=pp-skeep-list></div>
<div class=pp-preview id=pp-spreview></div>
</div>
<div class=pp-sec><h4>Sell pokemons (opt-in)</h4>
<label class="pp-toggle"><input type=checkbox id=pp-smOn> Vender mons da lista</label>
<div class=pp-hint>desligado = nunca vende pokemon. ligado = vende só os ids abaixo.</div>
<div class=pp-row><input id=pp-sm-text placeholder="buscar mon (nome/nivel)" style="flex:1"></div>
<div class=pp-row><select id=pp-sm-sel></select><button id=pp-sm-add>+</button></div>
<div class=pp-row><span class=lbl id=pp-sm-count style="width:auto"></span></div>
<div id=pp-sm-list></div>
</div>
<div class=pp-row><button id=pp-check-update style="flex:1;background:none;color:#9aa0b8;border:1px solid #343a55;border-radius:6px;padding:4px;cursor:pointer">Verificar update</button></div>
<div class=pp-status id=pp-status></div>
<div id=pp-toast></div>
</div>`;
  document.body.appendChild(d);
  const applyMin = min => { d.classList.toggle("pp-min", min); tab.classList.toggle("pp-show", min); tab.textContent = min ? "▶ PP-QOL" : "◀ PP-QOL"; cfg.uiMin = min; save(); };
  document.getElementById("pp-hide").onclick = () => applyMin(true);
  tab.onclick = () => applyMin(false);
  applyMin(!!cfg.uiMin);
  const bind = (id, fn) => document.getElementById(id).onchange = e => {
    fn(e.target);
    const lab = e.target.closest(".pp-toggle");
    if (lab) lab.classList.toggle("on", e.target.checked);
    save();
  };
  bind("pp-rOn", t => cfg.refillOn = t.checked);
  bind("pp-cOn", t => cfg.catchOn = t.checked);
  bind("pp-hOn", t => cfg.huntOn = t.checked);
  bind("pp-recOn", t => cfg.recoverOn = t.checked);
  bind("pp-bMin", t => cfg.ballMin = +t.value || 0);
  bind("pp-bBuy", t => cfg.ballBuy = +t.value || 1);
  bind("pp-pMin", t => cfg.potionMin = +t.value || 0);
  bind("pp-pBuy", t => cfg.potionBuy = +t.value || 1);
  bind("pp-rMin", t => cfg.reviveMin = +t.value || 0);
  bind("pp-rBuy", t => cfg.reviveBuy = +t.value || 1);
  bind("pp-sOn", t => cfg.sellOn = t.checked);
  bind("pp-sMin", t => cfg.sellIntervalMin = Math.max(1, +t.value || 30));
  document.getElementById("pp-sell-now").onclick = async () => {
    const st = document.getElementById("pp-status");
    try { await sellTick(true); }
    catch (e) { if (st) st.textContent = "sell falhou: " + (e.code || e.message || e); }
    refreshSellPreview();
  };
  document.getElementById("pp-skeep-add").onclick = () => {
    const s = document.getElementById("pp-skeep-sel");
    if (s && s.value && !cfg.sellKeep.includes(s.value)) { cfg.sellKeep.push(s.value); save(); renderSellKeep(); refreshSellPreview(); }
  };
  const sbind = (id, fn) => { const el = document.getElementById(id); if (el) el.oninput = el.onchange = () => fn(el.value); };
  sbind("pp-skeep-text", v => { sellFilter.text = v; refreshSellKeepOptions(); });
  const smChk = document.getElementById("pp-smOn");
  if (smChk) { smChk.checked = !!cfg.sellMonsOn; smChk.onchange = e => { cfg.sellMonsOn = e.target.checked; e.target.closest(".pp-toggle").classList.toggle("on", e.target.checked); save(); refreshSellPreview(); }; if (cfg.sellMonsOn) smChk.closest(".pp-toggle").classList.add("on"); }
  sbind("pp-sm-text", v => { sellMonFilter.text = v; refreshSellMonOptions(); });
  document.getElementById("pp-sm-add").onclick = () => {
    const s = document.getElementById("pp-sm-sel");
    if (s && s.value && !cfg.sellMons.includes(s.value)) { cfg.sellMons.push(s.value); save(); renderSellMons(); refreshSellMonOptions(); refreshSellPreview(); }
  };
  const fbind = (id, fn) => { const el = document.getElementById(id); if (el) el.oninput = el.onchange = () => { fn(el.value); renderZoneOptions(); }; };
  fbind("pp-ftext", v => huntFilter.text = v);
  fbind("pp-fmin", v => huntFilter.min = v);
  fbind("pp-fmax", v => huntFilter.max = v);
  fbind("pp-fel", v => huntFilter.el = v);
  document.getElementById("pp-add").onclick = () => {
    cfg.routes.push({ min: +document.getElementById("pp-rmin").value || 1, max: +document.getElementById("pp-rmax").value || 10, zoneId: document.getElementById("pp-zone").value });
    save(); renderRoutes();
  };
  document.getElementById("pp-check-update").onclick = () => checkUpdate(true);
  ppPlace(); ppHandles();
  fillSelectors();
  renderSellMons();
  refreshSellMonOptions().catch(() => {});
}

// ---- panel size / drag / resize ----
function ppPlace() {
  const d = document.getElementById("pp-qol");
  if (!d) return;
  d.style.width = Math.min(520, Math.max(240, cfg.uiW || 300)) + "px";
  const body = d.querySelector(".pp-body");
  if (body && cfg.uiH > 0) body.style.maxHeight = Math.min(92, Math.max(30, cfg.uiH)) + "vh";
}
function ppHandles() {
  const d = document.getElementById("pp-qol");
  if (!d || d._ppHandles) return;
  d._ppHandles = true;
  ["nw", "ne", "sw", "se"].forEach(c => {
    const h = document.createElement("div");
    h.className = "pp-h"; h.dataset.c = c;
    d.appendChild(h);
    h.addEventListener("pointerdown", e => {
      e.preventDefault(); e.stopPropagation();
      const r = d.getBoundingClientRect();
      const x0 = e.clientX, y0 = e.clientY, w0 = r.width, h0 = r.height, top = r.top;
      d.style.right = "auto"; d.style.top = top + "px"; d.style.transform = "none"; d.style.left = r.left + "px";
      const mv = ev2 => {
        const dx = ev2.clientX - x0, dy = ev2.clientY - y0;
        let w = c.includes("e") ? w0 + dx : w0 - dx;
        let hh = c.includes("s") ? h0 + dy : h0 - dy;
        if (!c.includes("e")) d.style.left = (r.left + dx) + "px";
        if (!c.includes("n")) d.style.top = (top + dy) + "px";
        d.style.width = Math.min(520, Math.max(240, w)) + "px";
        const body = d.querySelector(".pp-body");
        if (body) body.style.maxHeight = Math.min(92, Math.max(30, hh / window.innerHeight * 100)) + "vh";
      };
      const up = () => {
        window.removeEventListener("pointermove", mv);
        window.removeEventListener("pointerup", up);
        cfg.uiW = Math.round(d.getBoundingClientRect().width);
        save();
      };
      window.addEventListener("pointermove", mv);
      window.addEventListener("pointerup", up);
    });
  });
  const head = d.querySelector(".pp-head");
  if (head) head.addEventListener("pointerdown", e => {
    if (e.target.closest("button")) return;
    const r = d.getBoundingClientRect();
    const ox = e.clientX - r.left, oy = e.clientY - r.top;
    d.style.right = "auto"; d.style.transform = "none";
    const mv = ev2 => {
      d.style.left = Math.min(window.innerWidth - 80, Math.max(0, ev2.clientX - ox)) + "px";
      d.style.top = Math.min(window.innerHeight - 60, Math.max(0, ev2.clientY - oy)) + "px";
    };
    const up = () => { window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", mv);
    window.addEventListener("pointerup", up);
  });
}

// ---- auto recover ----
let recovering = false;
async function teamStatus() {
  try { PI().Api.invalidateDynamicCache(); } catch {}
  const r = await PI().Api.getCreatures("team");
  const m = r.data || r || [];
  const team = Array.isArray(m) ? m : [];
  const alive = team.filter(c => Number(c.hp || 0) > 0);
  return { team, allDead: team.length > 0 && alive.length === 0 };
}
async function reviveStock() {
  const list = await invList();
  return ["revive_basic", "revive_minor", "revive_max"].reduce((s, id) => s + qtyOf(list, id), 0);
}
function defeatVisible() {
  try {
    const s = PI().HuntSimStage;
    if (s && typeof s.companionDown === "function" && s.companionDown()) return true;
    const o = PI().HuntDefeatOverlay;
    if (o && typeof o.isVisible === "function" && o.isVisible()) return true;
  } catch {}
  return false;
}
async function waitCity(timeoutMs = 15000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    try { if (window.$gameMap && Number(window.$gameMap.mapId()) === 1) return true; } catch {}
    await sleep(500);
  }
  return false;
}
async function recoverTick() {
  if (!cfg.recoverOn || recovering) return "off-or-busy";
  if (!defeatVisible()) return "no-defeat";
  recovering = true;
  try {
    const { allDead } = await teamStatus();
    if (!allDead) return "team-ok";
    const stock = await reviveStock();
    if (stock > 0) {
      await PI().Api.reviveHunt("");
      log("recover revive usado, estoque", stock);
      return "revived";
    }
    if (PI().HuntPresentation?.exitToCity) await PI().HuntPresentation.exitToCity({ stopSession: true });
    else if (PI().HuntSimStage?.stopHunt) await PI().HuntSimStage.stopHunt();
    await waitCity();
    await PI().Api.healTeam();
    log("recover cidade + heal, reentra rota");
    const lv = await teamLevel();
    const route = cfg.routes.find(r => lv >= Number(r.min) && lv <= Number(r.max));
    if (route) await enterZone(route.zoneId);
    else await huntTick();
    return "city-heal-reenter";
  } catch (e) { log("recover falhou", e.code || e.message || e); return "err:" + (e.code || e.message || e); }
  finally { recovering = false; }
}

// ---- self update (GitHub; opt-in banner) ----
const PP_SCRIPT_URL = `https://raw.githubusercontent.com/${PP_REPO}/main/pokepixel-qol.user.js`;
function cmpVer(a, b) {
  const pa = String(a).split(".").map(Number), pb = String(b).split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d;
  }
  return 0;
}
function showUpdateBanner(remote) {
  const panel = document.getElementById("pp-qol");
  if (!panel || document.getElementById("pp-update")) return;
  const bar = document.createElement("div");
  bar.id = "pp-update";
  bar.style.cssText = "margin:8px;padding:8px;border:1px solid #7c5cff;border-radius:10px;background:rgba(124,92,255,.12);font-size:11px";
  bar.innerHTML = `<b>Nova versão ${remote} disponível</b> (atual ${PP_VERSION}).<br>`;
  const row = document.createElement("div");
  row.style.cssText = "display:flex;gap:6px;margin-top:6px";
  const go = document.createElement("button");
  go.textContent = "Atualizar";
  go.style.cssText = "background:#7c5cff;color:#fff;border:none;border-radius:6px;padding:4px 10px;cursor:pointer;font-weight:700";
  go.onclick = () => window.open(PP_SCRIPT_URL, "_blank");
  const later = document.createElement("button");
  later.textContent = "Depois";
  later.style.cssText = "background:none;color:#9aa0b8;border:1px solid #343a55;border-radius:6px;padding:4px 10px;cursor:pointer";
  later.onclick = () => { cfg.skipUpdate = remote; save(); bar.remove(); };
  row.append(go, later);
  bar.appendChild(row);
  const body = panel.querySelector(".pp-body");
  (body || panel).prepend(bar);
  const st = document.getElementById("pp-status");
  if (st) st.textContent = `update disponível: ${remote} (atual ${PP_VERSION})`;
  log("update disponível", remote, "atual", PP_VERSION);
}
async function checkUpdate(manual) {
  try {
    const r = await fetch(PP_SCRIPT_URL, { cache: "no-store" });
    if (!r.ok) return "http-" + r.status;
    const txt = await r.text();
    const m = txt.match(/@version\s+([\d.]+)/);
    if (!m) return "no-version";
    const remote = m[1];
    if (cmpVer(remote, PP_VERSION) > 0 && cfg.skipUpdate !== remote) showUpdateBanner(remote);
    else if (manual) {
      const st = document.getElementById("pp-status");
      if (st) st.textContent = `PP-QOL ${PP_VERSION} — já atualizado`;
    }
    return remote;
  } catch (e) { log("update check falhou", e.message || e); return "err"; }
}

// ---- test hooks (no side effect; ticks only run when toggled on) ----
window.PP_QOL = { cfg, save, version: PP_VERSION, checkUpdate, invList, qtyOf, ensureStock, refillTick, queueBodies, catchTick, getZones, getShop, getSpecies, getCatalog, zoneInfo, zoneName, filteredZones, renderZoneOptions, teamLevel, currentZoneId, isInHunt, enterZone, huntTick, fillSelectors,
  teamStatus, reviveStock, defeatVisible, recoverTick, sellCandidates, sellTick, refreshSellPreview, sellNotify, sellSummary, sellableMons, sellMonCandidates, renderSellMons, refreshSellMonOptions,
  _resetCatch: () => { thrown.clear(); lastThrow = 0; } };

// ---- boot ----
const t = setInterval(() => {
  if (!window.PokeIdle?.Api || !window.PokeIdle?.HuntSimStage) return;
  clearInterval(t); ui();
  setInterval(refillTick, 15000);
  setInterval(catchTick, 300);
  setInterval(huntTick, 15000);
  setInterval(recoverTick, 2000);
  setInterval(() => sellTick().catch(e => log("sell", e.code || e.message || e)), 60000);
  setInterval(() => { fillSelectors().catch(() => {}); refreshSellPreview().catch(() => {}); }, 60000);
  log("on", "v" + PP_VERSION);
  // entra na hunt na injeção; cidade nunca conta como "já na zona"
  huntTick().catch(e => log("boot hunt", e.code || e.message || e));
  // update check no boot; banner opt-in se GitHub tiver versão maior
  checkUpdate(false).catch(() => {});
}, 1000);
})();
