from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse

from views import templates
import os

route = APIRouter(tags=["views"])


@route.get("/privacy-policy", response_class=HTMLResponse)
def show_privacy_policy(request: Request):
    response_params = {
        "title": "Privacy Policy",
        "subtitle": "",
        "search_page": True,
        "wp_footer": True,
        "request": request,
        "APP_EMAIL": os.getenv("APP_EMAIL"),
        "PRIVACY_EMAIL": os.getenv("PRIVACY_EMAIL"),
    }
    return templates.TemplateResponse("privacy_policy.jinja2", response_params)
