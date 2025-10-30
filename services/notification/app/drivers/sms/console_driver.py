async def send(to: str, body: str, metadata: dict | None = None) -> str:
    print(f"[SMS:console] to={to} body={body}")
    return "console-sms-id"
