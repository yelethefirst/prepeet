async def send(to: str, subject: str, html: str | None = None, text: str | None = None, metadata: dict | None = None) -> str:
    print(f"[EMAIL:console] to={to} subject={subject}\ntext={text}\nhtml={html}")
    return "console-email-id"
