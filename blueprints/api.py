from quart import Blueprint
from quart import jsonify
from quart import request

from objects import glob

api = Blueprint('apiv1', __name__)

@api.route('/search')
async def home():
    q = request.args.get('q', type=str)
    if not q:
        return b'{}'

    res = await glob.db.fetchall(
        'SELECT id, name '
        'FROM `users` '
        'WHERE priv >= 3 AND `name` LIKE %s '
        'LIMIT 5',
        [q + '%%']
    )

    if (len(res) == 0):
        return b'{}'
    else:
        return jsonify(res) 
@api.route('/highpp')
async def pp():
    id = await glob.db.fetchall("SELECT userid FROM scores WHERE mode=4 AND status=2 ORDER BY pp DESC LIMIT 1")
    id = id[0]["userid"]
    name = await glob.db.fetchall(f"SELECT name FROM users WHERE id={id}")
    name = name[0]["name"]
    pp = await glob.db.fetchall("SELECT pp FROM scores WHERE mode=4 AND status=2 ORDER BY pp DESC LIMIT 1")
    pp = round(pp[0]["pp"])
    yes = {"id":id, "name":name, "pp":pp}
    print(yes)
    return jsonify(yes)