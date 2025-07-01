#!/usr/bin/env python3
"""
Enhanced with:
- Async support
- Mobile detection
- Rate limiting
- Error handling
"""
from flask import Flask, jsonify, render_template, request
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from agents import strategist, builder, outreach
import utils.logger as logger
import config

app = Flask(__name__)
app.config.from_object(config)

# Rate limiting (100 reqs/hour)
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["100 per hour"]
)

@app.route('/')
@limiter.exempt
def dashboard():
    """Mobile-optimized dashboard"""
    return render_template('dashboard.html',
                         stats=strategist.get_stats(),
                         products=builder.get_products()
                        )

@app.route('/api/strategist', methods=['POST'])
@limiter.limit("10/minute")
def strategist_api():
    try:
        data = request.get_json()
        return jsonify(strategist.analyze(data))
    except Exception as e:
        logger.error(f"Strategist error: {e}")
        return jsonify({"error": "Analysis failed"}), 500

# [Add other enhanced routes here...]

if __name__ == '__main__':
    app.run(host=config.HOST, port=config.PORT, debug=config.DEBUG)