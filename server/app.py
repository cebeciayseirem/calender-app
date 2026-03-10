import json
import uuid
from pathlib import Path
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)

DATA_FILE = Path(__file__).parent / 'data' / 'events.json'


def read_events():
    if not DATA_FILE.exists():
        return []
    with open(DATA_FILE, 'r') as f:
        return json.load(f)


def write_events(events):
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(DATA_FILE, 'w') as f:
        json.dump(events, f, indent=2)


@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')


@app.route('/api/events', methods=['GET'])
def get_events():
    events = read_events()
    start = request.args.get('start')
    end = request.args.get('end')
    if start and end:
        events = [e for e in events if e['end'] >= start and e['start'] <= end]
    return jsonify(events)


@app.route('/api/events', methods=['POST'])
def create_event():
    data = request.get_json()
    data['id'] = str(uuid.uuid4())
    events = read_events()
    events.append(data)
    write_events(events)
    return jsonify(data), 201


@app.route('/api/events/search', methods=['GET'])
def search_events():
    q = request.args.get('q', '').lower()
    events = read_events()
    results = [e for e in events if
               q in e.get('title', '').lower() or
               q in e.get('description', '').lower() or
               q in e.get('location', '').lower() or
               q in e.get('category', '').lower()]
    return jsonify(results)


@app.route('/api/events/<event_id>', methods=['GET'])
def get_event(event_id):
    events = read_events()
    event = next((e for e in events if e['id'] == event_id), None)
    if not event:
        return jsonify({'error': 'Not found'}), 404
    return jsonify(event)


@app.route('/api/events/<event_id>', methods=['PUT'])
def update_event(event_id):
    data = request.get_json()
    events = read_events()
    for i, e in enumerate(events):
        if e['id'] == event_id:
            data['id'] = event_id
            events[i] = data
            write_events(events)
            return jsonify(data)
    return jsonify({'error': 'Not found'}), 404


@app.route('/api/events/<event_id>', methods=['DELETE'])
def delete_event(event_id):
    events = read_events()
    events = [e for e in events if e['id'] != event_id]
    write_events(events)
    return jsonify({'success': True})


if __name__ == '__main__':
    app.run(debug=True, port=5000)
