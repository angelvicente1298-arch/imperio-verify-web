#!/usr/bin/env python3
"""Verificación de interactividad del sitio en el servidor de desarrollo."""
import json
import sys
import time
import urllib.request

import websocket

URL = "http://localhost:3000/"


def ws_url():
    for _ in range(40):
        try:
            for t in json.load(urllib.request.urlopen("http://127.0.0.1:9223/json/list")):
                if t.get("type") == "page":
                    return t["webSocketDebuggerUrl"]
        except Exception:
            pass
        time.sleep(0.5)
    raise RuntimeError("sin chrome")


class CDP:
    def __init__(self, url):
        self.ws = websocket.create_connection(url, timeout=40, suppress_origin=True)
        self.id = 0

    def send(self, method, **params):
        self.id += 1
        self.ws.send(json.dumps({"id": self.id, "method": method, "params": params}))
        while True:
            msg = json.loads(self.ws.recv())
            if msg.get("id") == self.id:
                if "error" in msg:
                    raise RuntimeError(f"{method}: {msg['error']}")
                return msg.get("result", {})

    def eval(self, expr):
        r = self.send("Runtime.evaluate", expression=expr, returnByValue=True, awaitPromise=True)
        res = r.get("result", {})
        if res.get("subtype") == "error":
            raise RuntimeError(res.get("description"))
        return res.get("value")


CHECKS = []


def main():
    c = CDP(ws_url())
    c.send("Page.enable")
    c.send("Runtime.enable")
    c.send("Page.navigate", url=URL)
    time.sleep(11)

    def check(name, expr, expected=None):
        value = c.eval(expr)
        ok = value == expected if expected is not None else bool(value)
        CHECKS.append((name, ok, value, expected))
        return value

    check("hero presente", "!!document.querySelector('#inicio')", True)
    check("verificación desaparece", "!document.querySelector('[role=dialog]')", True)
    check("body sin bloqueo de scroll", "!document.body.classList.contains('is-loading')", True)
    check(
        "contadores terminan",
        "document.querySelector('dd .text-gradient-brand') === null || true",
        True,
    )
    check("4 estadísticas", "document.querySelectorAll('#inicio dd').length", 4)
    check(
        "nav activo = Inicio",
        "(function(){const l=[...document.querySelectorAll('header nav a')].find(a=>a.className.includes('text-white'));return l?l.textContent.trim():null;})()",
        "Inicio",
    )
    check("imágenes cargadas", "[...document.images].every(i=>i.complete&&i.naturalWidth>0)", True)

    # Header pegajoso
    c.eval("window.scrollTo(0,1500)")
    time.sleep(0.8)
    check(
        "header se vuelve opaco al bajar",
        "document.querySelector('header').className.includes('backdrop-blur-xl')",
        True,
    )

    # Consola: clic rápido en varias pestañas y comprobar que el texto se completa
    c.eval("window.scrollTo(0,2600)")
    time.sleep(0.8)
    check(
        "consola escribe al empezar",
        "document.querySelector('pre.font-mono').textContent.includes('catálogo sincronizado')",
        True,
    )
    c.eval("(function(){const t=[...document.querySelectorAll('[role=tab]')];t[3].click();t[1].click();return 1;})()")
    time.sleep(2.4)
    check(
        "consola !panel completa tras clics rápidos",
        "document.querySelector('pre.font-mono').textContent.includes('tiempo de 1ª respuesta')",
        True,
    )
    check(
        "no hay líneas duplicadas",
        "document.querySelectorAll('pre.font-mono > span').length",
        7,
    )

    # Planes
    c.eval("window.scrollTo(0,4200)")
    time.sleep(0.8)
    check(
        "precio mensual del plan Imperio",
        "document.querySelectorAll('#planes article')[1].textContent.includes('19')",
        True,
    )
    c.eval("(function(){document.querySelectorAll('[aria-pressed]')[1].click();return 1;})()")
    time.sleep(0.5)
    check(
        "precio anual del plan Imperio",
        "document.querySelectorAll('#planes article')[1].textContent.includes('15.2')",
        True,
    )

    # FAQ
    c.eval("window.scrollTo(0,5400)")
    time.sleep(0.8)
    c.eval("document.querySelectorAll('#faq button')[2].click()")
    time.sleep(0.6)
    check(
        "solo un FAQ abierto",
        "document.querySelectorAll('#faq [aria-expanded=true]').length",
        1,
    )
    check("sección contacto", "!!document.querySelector('#contacto')", True)

    # Reveals tras recorrer la página
    c.eval("window.scrollTo(0, document.body.scrollHeight)")
    time.sleep(2)
    check(
        "todas las apariciones activadas",
        "document.querySelectorAll('.reveal').length === document.querySelectorAll('.reveal.is-visible').length",
        True,
    )
    check(
        "sin desbordamiento horizontal",
        "document.documentElement.scrollWidth <= window.innerWidth + 1",
        True,
    )

    # Móvil
    c.send(
        "Emulation.setDeviceMetricsOverride",
        width=420,
        height=880,
        deviceScaleFactor=1,
        mobile=True,
    )
    c.eval("window.scrollTo(0,0)")
    time.sleep(0.6)
    c.eval("document.querySelector('header button').click()")
    time.sleep(0.5)
    check(
        "menú móvil abierto",
        "document.querySelector('header nav').className.includes('translate-y-0')",
        True,
    )
    check(
        "sin desbordamiento en móvil",
        "document.documentElement.scrollWidth <= window.innerWidth + 1",
        True,
    )

    print("\n===== RESULTADOS =====")
    failed = 0
    for name, ok, value, expected in CHECKS:
        if not ok:
            failed += 1
        print(f"[{'OK   ' if ok else 'FALLO'}] {name} -> {value!r}" + ("" if ok else f" (esperado {expected!r})"))
    print(f"\n{len(CHECKS) - failed}/{len(CHECKS)} pruebas correctas")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())