from quart import Blueprint
from quart import jsonify
from quart import request
import json
from objects import glob
import spectra
api = Blueprint('apiv1', __name__)
diffColors = spectra.scale([ spectra.html(x).to("lab") for x in (['#4290FB', '#4FC0FF', '#4FFFD5', '#7CFF4F', '#F6F05C', '#FF8068', '#FF4E6F', '#C645B8', '#6563DE', '#18158E', '#000000']) ])
diffColorsDomain = diffColors.domain([0.1, 1.25, 2, 2.5, 3.3, 4.2, 4.9, 5.8, 6.7, 7.7, 9])
def getDiffColor(diff:float):
    """Get diff color from color spectrum"""
    if diff <= 0.1:
        return "#AAAAAA"
    elif diff <= 9:
        return diffColorsDomain(diff).hexcode
    else:
        return "#000000"
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
@api.route('/mapset_diffs', methods=['GET'])
async def mapset_diffs():
    """Get mapset diffs data by id of mapset"""
    # Get api arg
    set_id = request.args.get('id', default=None, type=int)
    if not set_id:
        return {"success": False, "msg": "You must specify 'id' arg."}

    # Fetch all maps from set by set_id
    res = await glob.db.fetchall(
        "SELECT id, version diffname, total_length, max_combo, plays, mode, bpm, "
        "cs, ar, od, hp, diff, plays, total_length length, last_update, status "
        f"FROM maps WHERE set_id={set_id} ORDER BY diff ASC"
    )
    if not res:
        return {"success": False, "msg": "Mapset not found"}
    # Convert elements of res to dicts
    res = [dict(row) for row in res]

    # Loop through all maps in results
    for el in res:
        el['diff_color'] = getDiffColor(el['diff'])

    # Return data
    return {'success': True, 'map': res}
@api.route('/bmap_search', methods=['POST'])
async def bmap_search():
    # Get data from request body
    d = await request.get_data()
    if d:
        d = json.loads(d.decode('utf-8'))
    else:
        return {'success': False, 'msg': 'No data received.'}

    # Create arg list for query
    arg_list = []
    args_to_query = {}

    # Checks for mode
    if 'mode' in d:
        if d['mode'] not in (None, 'null'):
            arg_list.append("`mode`=':mode'")
            args_to_query['mode'] = d['mode']

    # Checks for status
    if 'status' in d:
        status = d['status']
        if status in (None, 'null'):
            pass
        elif status == '0':
            arg_list.append('(status=2 OR status=3)')
        elif status == '1':
            arg_list.append('status=5')
        elif status == '2':
            arg_list.append('status=4')
        elif status == '3':
            arg_list.append('(status=0 OR status=1')
    # Checks for search
    if 'query' in d:
        query = d['query']
        if query not in (None, 'null'):
            arg_list.append('(artist LIKE :query OR creator LIKE :query OR version LIKE :query OR title LIKE :query)')
            args_to_query['query'] = '%' + query.replace(" ", "%") + '%'

    # Checks for frozen
    if 'frozen' in d:
        if d['frozen'] not in (None, 'null'):
            arg_list.append('frozen=1')

    # Checks for offset
    if 'offset' in d:
        if d['offset'] in (None, 'null'):
            args_to_query['offset'] = 0
        else:
            args_to_query['offset'] = d['offset']
    else:
        args_to_query['offset'] = 0

    # Convert arg_list to string, add 'AND' between every element
    arg_list = ' AND '.join(arg_list)
    if arg_list != '':
        arg_list = 'WHERE ' + arg_list

    # Fetch maps from database, don't allow duplicates
    res = await glob.db.fetchall(
        "SELECT DISTINCT(set_id), artist, creator, title, status, last_update "
        f"FROM maps {arg_list} "
        "ORDER BY last_update DESC LIMIT 30")

    # Convert elements of res to dicts
    res = [dict(row) for row in res]

    # Loop through all maps in results
    # Shitcoding at its finest
    for el in res:
        diffs = await glob.db.fetchall(
            f"SELECT mode, diff FROM maps WHERE set_id={el['set_id']} ORDER BY diff ASC LIMIT 14")
        # Convert elements of diffs to dicts
        diffs = [dict(row) for row in diffs]

        # Get diff color with spectra
        for diff in diffs:
            diff['diff_color'] = getDiffColor(diff['diff'])

        # Fetch fav count
        el['fav_count'] = await glob.db.fetchall(
            f"SELECT COUNT(userid) FROM favourites WHERE setid={el['set_id']}")
        el['diffs'] = diffs

    return {"success": True, 'result': res}
@api.route('/favourite')
async def favourite():
    m = request.args.get('m', type=int)
    if not m:
        return b"No map ID provided!"
    u = request.args.get('u', type=int)
    if not u:
        return b"No user ID provided!"
    if await glob.db.fetchall(
        f"SELECT 1 FROM favourites WHERE userid = {u} AND setid = {m}"
    ):
        return b"This map has already been favorited!"
    await glob.db.execute(
        f"INSERT INTO favourites VALUES ({u}, {m}, UNIX_TIMESTAMP())"
    )
    return b"Map succesfully favourited!"