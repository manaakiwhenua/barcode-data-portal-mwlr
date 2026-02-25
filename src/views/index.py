from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse

from util import get_notice_switch
from views import templates

import os

route = APIRouter(tags=["views"])


@route.get("/", response_class=HTMLResponse)
def show_index(request: Request):
    response_params = {
        "title": "Sequence",
        "subtitle": "",
        "search_page": True,
        "wp_footer": True,
        "notice": get_notice_switch(),
        "request": request,
        "app_email": os.getenv("APP_EMAIL"),
    }
    return templates.TemplateResponse("index.jinja2", response_params)
