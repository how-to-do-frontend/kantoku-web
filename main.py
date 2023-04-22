#!/usr/bin/env python3.9
# -*- coding: utf-8 -*-

__all__ = ()

import os

import aiohttp
import orjson
from quart import Quart
from quart import render_template

from cmyui.logging import Ansi
from cmyui.logging import log
from cmyui.mysql import AsyncSQLPool
from cmyui.version import Version
from countries_dict import country_dict
from objects import glob

app = Quart(__name__)

version = Version(1, 3, 0)

# used to secure session data.
# we recommend using a long randomly generated ascii string.
app.secret_key = glob.config.secret_key

@app.before_serving
async def mysql_conn() -> None:
    glob.db = AsyncSQLPool()
    await glob.db.connect(glob.config.mysql) # type: ignore
    log('Connected to MySQL!', Ansi.LGREEN)

@app.before_serving
async def http_conn() -> None:
    glob.http = aiohttp.ClientSession(json_serialize=lambda x: orjson.dumps(x).decode())
    log('Got our Client Session!', Ansi.LGREEN)

@app.after_serving
async def shutdown() -> None:
    await glob.db.close()
    await glob.http.close()

# globals which can be used in template code
@app.template_global()
def appVersion() -> str:
    return repr(version)

@app.template_global()
def appName() -> str:
    return glob.config.app_name
import requests
@app.template_global()
def getOnlineUsers() -> int:
    onlineJson = requests.get("https://api.fysix.xyz/get_player_count")
    onlineUsers = onlineJson.json()['counts']['online']
    return onlineUsers
@app.template_global()
def getTotalUsers() -> int:
    totalJson = requests.get("https://api.fysix.xyz/get_player_count")
    totalUsers = totalJson.json()['counts']['total']
    return totalUsers
@app.template_global()
async def getHighestPpPlay() -> int:
    yes = await glob.db.fetchall("SELECT pp FROM scores WHERE mode=4 AND status=2 ORDER BY pp DESC LIMIT 1;")
    return round(yes[0]["pp"])
@app.template_global()
async def getHighestPpPlayID() -> int:
    yes2 = await glob.db.fetchall("SELECT userid FROM scores WHERE mode=4 AND status=2 ORDER BY pp DESC LIMIT 1;")
    return yes2[0]["userid"]
@app.template_global()
async def getHighestPpPlayName() -> str:
    yes3 = await glob.db.fetchall(f"SELECT name FROM users WHERE id={int(await getHighestPpPlayID())}")
    return yes3[0]["name"]
@app.template_global()
def captchaKey() -> str:
    return glob.config.hCaptcha_sitekey
@app.template_global()
#FUCKING KILL YOU BPY WHY DONT YOU SERVE FULL COUNTRY
def cctoFullName(cc):
    #FUCKING KILL ME OH MY GODD
    return country_dict[cc]
import requests
@app.template_global()
def getClanTag(id):
    resp = requests.get(f"https://api.fysix.xyz/get_player_info?id={id}&scope=info")
    #print(resp.text["clan_name"])
    try:
        return "[" + resp.json()['player']['info']['clan_name'] + "]"
    except:
        return ''
@app.template_global()
def getClan(id):
    resp2 = requests.get(f"https://api.fysix.xyz/get_clan?id={id}")
    if resp2.status_code != 200:
        return None
    else:
        return resp2.json()
@app.template_global()
def listOfMembers(id):
    members = []
    c=0
    resp2 = requests.get(f"https://api.fysix.xyz/get_clan?id={id}")
    if resp2.status_code != 200:
        return None
    else:
        for i in range(0, len(resp2.json()["members"])):
            members.append(resp2.json()["members"][i]["name"])
        return members
@app.template_global()
def domain() -> str:
    return glob.config.domain

from blueprints.frontend import frontend
app.register_blueprint(frontend)

from blueprints.admin import admin
app.register_blueprint(admin, url_prefix='/admin')

from blueprints.api import api
app.register_blueprint(api, url_prefix='/apiv1')


@app.errorhandler(404)
async def page_not_found(e):
    # NOTE: we set the 404 status explicitly
    return (await render_template('404.html'), 404)

if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.realpath(__file__)))
    app.run(port=8000, debug=glob.config.debug) # blocking call
