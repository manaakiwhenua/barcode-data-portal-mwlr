from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse

from views import templates

route = APIRouter(tags=["views"])


@route.get("/nz-fungi", response_class=HTMLResponse)
def show_nz_fungi(request: Request):
    response_params = {
        "title": "New Zealand Fungi",
        "subtitle": "Work in progress",
        "search_page": True,
        "wp_footer": True,
        "request": request,
    }
    return templates.TemplateResponse("nz_fungi.jinja2", response_params)
