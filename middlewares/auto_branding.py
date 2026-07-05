from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

class AutoBrandingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        if "text/html" in response.headers.get("content-type", ""):
            body_chunks = [chunk async for chunk in response.body_iterator]
            html_body = b"".join(body_chunks).decode("utf-8")
            
            ubuntu_branding = '''
    <link rel="icon" type="image/x-icon" href="/src/favicon/ubuntu-backend/favicon.ico?v=1">
    <link rel="icon" type="image/png" sizes="96x96" href="/src/favicon/ubuntu-backend/favicon-96x96.png?v=1">
    <link rel="icon" type="image/svg+xml" href="/src/favicon/ubuntu-backend/favicon.svg?v=1">
    <link rel="apple-touch-icon" sizes="180x180" href="/src/favicon/ubuntu-backend/apple-touch-icon.png?v=1">
    <link rel="manifest" href="/src/favicon/ubuntu-backend/site.webmanifest?v=1">
</head>'''

            if "</head>" in html_body:
                html_body = html_body.replace("</head>", ubuntu_branding)
            elif "<body" in html_body:
                html_body = html_body.replace("<body", f"<head>{ubuntu_branding}\n</head>\n<body")
            
            headers = dict(response.headers)
            headers["content-length"] = str(len(html_body.encode("utf-8")))
            return Response(content=html_body, status_code=response.status_code, headers=headers, media_type="text/html")
        return response