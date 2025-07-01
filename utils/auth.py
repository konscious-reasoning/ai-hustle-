from functools import wraps
from flask import request, jsonify
import hashlib

def require_api_key(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        api_key = request.headers.get('X-API-KEY')
        if not api_key or api_key != hashlib.sha256(b'your-secret-key').hexdigest():
            return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)
    return decorated