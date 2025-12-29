import sys
import json
import time
import threading
from flask import Flask, jsonify, request
from flask_cors import CORS
from valclient.client import Client
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Global variables
valorant_client = None
current_match_data = {
    "state": "MENUS",
    "match_id": None,
    "players": [],
    "map": None,
    "side": None,
    "pregame": False,
    "ingame": False
}
match_history = []
auto_lock_enabled = False
selected_agent = None
seen_matches = set()
player_name_cache = {}  # Cache player names to avoid repeated API calls

# Agent codes mapping
AGENT_CODES = {
    "Astra": "41fb69c1-4189-7b37-f117-bcaf1e96f1bf",
    "Breach": "5f8d3a7f-467b-97f3-062c-13acf203c006",
    "Brimstone": "9f0d8ba9-4140-b941-57d3-a7ad57c6b417",
    "Chamber": "22697a3d-45bf-8dd7-4fec-84a9e28c69d7",
    "Clove": "1dbf2edd-4729-0984-3115-daa5eed44993",
    "Cypher": "117ed9e3-49f3-6512-3ccf-0cada7e3823b",
    "Deadlock": "cc8b64c8-4b25-4ff9-6e7f-37b4da43d235",
    "Fade": "dade69b4-4f5a-8528-247b-219e5a1facd6",
    "Gekko": "e370fa57-4757-3604-3648-499e1f642d3f",
    "Harbor": "95b78ed7-4637-86d9-7e41-71ba8c293152",
    "ISO": "0e38b510-41a8-5780-5e8f-568b2a4f2d6c",
    "Jett": "add6443a-41bd-e414-f6ad-e58d267f4e95",
    "KAYO": "601dbbe7-43ce-be57-2a40-4abd24953621",
    "Killjoy": "1e58de9c-4950-5125-93e9-a0aee9f98746",
    "Neon": "bb2a4828-46eb-8cd1-e765-15848195d751",
    "Omen": "8e253930-4c05-31dd-1b6c-968525494517",
    "Phoenix": "eb93336a-449b-9c1b-0a54-a891f7921d69",
    "Raze": "f94c3b30-42be-e959-889c-5aa313dba261",
    "Reyna": "a3bfb853-43b2-7238-a4f1-ad90e9e46bcc",
    "Sage": "569fdd95-4d10-43ab-ca70-79becc718b46",
    "Skye": "6f2a04ca-43e0-be17-7f36-b3908627744d",
    "Sova": "320b2a48-4d9b-a075-30f1-1f93a9b638fa",
    "Tejo": "b444168c-4e35-8076-db47-ef9bf368f384",
    "Veto": "92eeef5d-43b5-1d4a-8d03-b3927a09034b",
    "Viper": "707eab51-4836-f488-046a-cda6bf494859",
    "Vyse": "efba5359-4016-a1e5-7626-b1ae76895940",
    "Waylay": "df1cb487-4902-002e-5c17-d28e83e78588",
    "Yoru": "7f94d92c-4234-0a36-9646-3a87eb8b5c89"
}

# Map codes to names
MAP_NAMES = {
    # UUID-based mappings
    "7eaecc1b-4337-bbf6-6ab9-04b8f06b3319": "Ascent",
    "d960549e-485c-e861-8d71-aa9d1aed12a2": "Split",
    "de1cdd0e-4d0d-8f9b-43a1-82c8e3ab2b81": "Fracture",
    "2c9d57ec-4431-9c5e-2939-8f9ef6dd5cba": "Bind",
    "e2ad5c54-4114-a870-9641-8ea21279579a": "Breeze",
    "2fe4ed3a-450a-948b-6d6b-e89a78e680a9": "District",
    "690b3ed2-4dff-945b-8223-6da834e30d24": "Icebox",
    "63afcf9c-4c5f-11eb-b83b-0242ac130002": "Lotus",
    "2bee0dc9-4ffe-519b-1cbd-7fbe763a6047": "Pearl",
    "fd267378-4d90-419c-83b1-2c94db05b1f0": "Sunset",
    "340b5d93-4954-4a4c-b47d-0ee96e77e1aa": "Haven",
    "4eb7366e-4955-4a94-b2c2-3f6f0a4b8c0d": "Abyss",
    # Asset path-based mappings (internal codenames)
    "/Game/Maps/Ascent/Ascent": "Ascent",
    "/Game/Maps/Bonsai/Bonsai": "Split",
    "/Game/Maps/Canyon/Canyon": "Fracture",
    "/Game/Maps/Duality/Duality": "Bind",
    "/Game/Maps/Foxtrot/Foxtrot": "Breeze",
    "/Game/Maps/HURM/HURM_Alley/HURM_Alley": "District",
    "/Game/Maps/HURM/HURM_Bowl/HURM_Bowl": "Kasbah",
    "/Game/Maps/HURM/HURM_Helix/HURM_Helix": "Drift",
    "/Game/Maps/HURM/HURM_HighTide/HURM_HighTide": "Glitch",
    "/Game/Maps/HURM/HURM_Yard/HURM_Yard": "Piazza",
    "/Game/Maps/Infinity/Infinity": "Abyss",
    "/Game/Maps/Jam/Jam": "Lotus",
    "/Game/Maps/Juliett/Juliett": "Sunset",
    "/Game/Maps/Pitt/Pitt": "Pearl",
    "/Game/Maps/Port/Port": "Icebox",
    "/Game/Maps/Poveglia/Range": "The Range",
    "/Game/Maps/PovegliaV2/RangeV2": "The Range",
    "/Game/Maps/Rook/Rook": "Corrode",
    "/Game/Maps/Triad/Triad": "Haven"
}

def parse_map_name(map_id):
    """Parse map name from ID or path"""
    if not map_id:
        return "Unknown"

    # Check if it's a known map ID
    if map_id in MAP_NAMES:
        return MAP_NAMES[map_id]

    # If it's a path like /Game/Maps/HURM/HURM_Yard/HURM_Yard, extract the map name
    if "/" in map_id:
        parts = map_id.split("/")
        if len(parts) >= 4:
            return parts[3].replace("_", " ")  # HURM -> HURM

    return "Unknown"

def init_client(region='na'):
    """Initialize Valorant client"""
    global valorant_client
    try:
        valorant_client = Client(region=region)
        valorant_client.activate()
        logger.info(f"Valorant client initialized for region: {region}")
        return True
    except Exception as e:
        logger.error(f"Failed to initialize client: {e}")
        return False

def get_player_names(puuids):
    """Get player names by PUUIDs using the name service endpoint"""
    global player_name_cache

    if not valorant_client or not puuids:
        return {}

    try:
        # Use the generic put method to call the name service endpoint
        names_data = valorant_client.put(
            endpoint="/name-service/v2/players",
            endpoint_type="pd",
            json_data=puuids
        )

        # Cache the results
        for name_info in names_data:
            puuid = name_info.get("Subject")
            game_name = name_info.get("GameName", "Unknown")
            tag_line = name_info.get("TagLine", "")
            display_name = f"{game_name}#{tag_line}" if tag_line else game_name
            player_name_cache[puuid] = display_name

        return player_name_cache
    except Exception as e:
        logger.error(f"Error fetching player names: {e}")
        return {}

def get_session_state():
    """Get current session state"""
    try:
        if not valorant_client:
            logger.warning("Client not initialized")
            return None
        presence = valorant_client.fetch_presence(valorant_client.puuid)
        state = presence.get("sessionLoopState", "MENUS")
        logger.info(f"Session state: {state}")
        return state
    except Exception as e:
        logger.error(f"Error fetching session state: {e}", exc_info=True)
        return None

def get_pregame_data():
    """Fetch pregame match data"""
    try:
        if not valorant_client:
            return None

        # First get the pregame match ID
        pregame_player = valorant_client.pregame_fetch_player()
        if not pregame_player:
            return None

        match_id = pregame_player.get("MatchID")
        if not match_id:
            return None

        logger.info(f"Found pregame match ID: {match_id}")

        # Now fetch the full match data
        pregame_match = valorant_client.pregame_fetch_match(match_id)
        if not pregame_match:
            logger.info("No pregame match data returned")
            return None

        logger.info(f"Pregame match data received: {pregame_match.keys()}")

        match_id = pregame_match.get("ID")
        map_id = pregame_match.get("MapID")

        # Get all teams data
        teams = pregame_match.get("Teams", [])
        ally_team = pregame_match.get("AllyTeam", {})

        # Determine our side (attacking or defending)
        # This is based on the team we're in
        side = None
        our_team_id = None

        # Find our team
        for team in teams:
            team_players = team.get("Players", [])
            for player in team_players:
                if player.get("Subject") == valorant_client.puuid:
                    our_team_id = team.get("TeamID")
                    break

        # Determine side based on team assignment
        # In Valorant, Team 1 typically starts on attacking side
        if our_team_id == "Blue":
            side = "Attacking"
        elif our_team_id == "Red":
            side = "Defending"

        # Parse players
        players = []

        # Collect all PUUIDs
        puuids = []
        for team in teams:
            for player in team.get("Players", []):
                puuids.append(player.get("Subject"))

        # Fetch all player names at once
        if puuids:
            get_player_names(puuids)

        for team in teams:
            team_id = team.get("TeamID")
            for player in team.get("Players", []):
                player_identity = player.get("PlayerIdentity", {})
                seasonal_badge = player.get("SeasonalBadgeInfo", {})
                puuid = player.get("Subject")

                # Get player name from cache
                display_name = player_name_cache.get(puuid, "Unknown Player")

                player_data = {
                    "puuid": puuid,
                    "name": display_name,
                    "team": team_id,
                    "character_id": player.get("CharacterID"),
                    "character_locked": player.get("CharacterSelectionState") == "locked",
                    "account_level": player_identity.get("AccountLevel", 0),
                    "competitive_tier": seasonal_badge.get("Rank", 0),
                    "wins": seasonal_badge.get("NumberOfWins", 0),
                    "is_captain": player.get("IsCaptain", False)
                }
                players.append(player_data)

        map_name = parse_map_name(map_id)

        return {
            "match_id": match_id,
            "map_id": map_id,
            "map_name": map_name,
            "side": side,
            "players": players,
            "pregame": True,
            "state": "PREGAME"
        }

    except Exception as e:
        # Silently ignore PhaseError (not in pregame)
        return None

def get_current_game_data():
    """Fetch current game match data"""
    try:
        if not valorant_client:
            return None

        # First get the current game match ID
        current_player = valorant_client.coregame_fetch_player()
        if not current_player:
            return None

        match_id = current_player.get("MatchID")
        if not match_id:
            return None

        logger.info(f"Found current game match ID: {match_id}")

        # Now fetch the full match data
        current_game = valorant_client.coregame_fetch_match(match_id)
        if not current_game:
            logger.info("No current game data returned")
            return None

        logger.info(f"Current game data received: {current_game.keys()}")

        match_id = current_game.get("MatchID")
        map_id = current_game.get("MapID")

        map_name = parse_map_name(map_id)
        logger.info(f"Map ID: {map_id}, Map name: {map_name}")

        # Parse players
        players = []
        puuids = [p.get("Subject") for p in current_game.get("Players", [])]

        # Fetch all player names at once
        if puuids:
            get_player_names(puuids)

        for player in current_game.get("Players", []):
            player_identity = player.get("PlayerIdentity", {})
            seasonal_badge = player.get("SeasonalBadgeInfo", {})
            puuid = player.get("Subject")

            # Get player name from cache
            display_name = player_name_cache.get(puuid, "Unknown Player")

            player_data = {
                "puuid": puuid,
                "name": display_name,
                "team": player.get("TeamID"),
                "character_id": player.get("CharacterID"),
                "account_level": player_identity.get("AccountLevel", 0),
                "competitive_tier": seasonal_badge.get("Rank", 0),
                "wins": seasonal_badge.get("NumberOfWins", 0)
            }
            players.append(player_data)

        return {
            "match_id": match_id,
            "map_id": map_id,
            "map_name": map_name,
            "players": players,
            "ingame": True,
            "state": "INGAME"
        }

    except Exception as e:
        logger.error(f"Error fetching current game data: {e}", exc_info=True)
        return None

def update_match_data():
    """Background thread to update match data"""
    global current_match_data, match_history, seen_matches

    while True:
        try:
            if valorant_client:
                state = get_session_state()
                logger.info(f"Update loop - Current state: {state}")

                # Try to fetch match data - try both pregame and current game
                data = None

                # Try pregame first
                if not data:
                    try:
                        data = get_pregame_data()
                        if data:
                            logger.info("Successfully fetched pregame data")
                            current_match_data.update(data)

                            # Auto-lock agent if enabled (disable after first lock)
                            if auto_lock_enabled and selected_agent:
                                match_id = data.get("match_id")
                                if match_id not in seen_matches:
                                    lock_success = try_lock_agent()
                                    seen_matches.add(match_id)
                                    # Disable autolock after successful lock
                                    if lock_success:
                                        auto_lock_enabled = False
                                        logger.info("Auto-lock disabled after successful lock")

                            # Add to history if new match
                            if data["match_id"] and data["match_id"] not in [m.get("match_id") for m in match_history]:
                                match_history.append({
                                    "match_id": data["match_id"],
                                    "map": data["map_name"],
                                    "timestamp": time.time(),
                                    "state": "PREGAME"
                                })
                    except Exception as e:
                        pass  # Silently ignore pregame errors when not in pregame

                # Try current game if pregame failed
                if not data:
                    try:
                        data = get_current_game_data()
                        if data:
                            logger.info(f"Successfully fetched current game data")
                            current_match_data.update(data)
                            current_match_data["pregame"] = False

                            # Add to history if new match
                            if data["match_id"] and data["match_id"] not in [m.get("match_id") for m in match_history]:
                                match_history.append({
                                    "match_id": data["match_id"],
                                    "map": data["map_name"],
                                    "timestamp": time.time(),
                                    "state": state or "INGAME"
                                })
                    except Exception as e:
                        pass  # Silently ignore current game errors when not in game

                # If no match data found, reset to menus
                if not data:
                    if current_match_data.get("state") != "MENUS":
                        logger.info("Resetting to MENUS state")
                    current_match_data = {
                        "state": state or "MENUS",
                        "match_id": None,
                        "players": [],
                        "map": None,
                        "side": None,
                        "pregame": False,
                        "ingame": False
                    }

            time.sleep(3)  # Poll every 3 seconds

        except Exception as e:
            logger.error(f"Error in update loop: {e}", exc_info=True)
            time.sleep(5)

def try_lock_agent():
    """Attempt to lock the selected agent"""
    global selected_agent
    try:
        if selected_agent and valorant_client:
            agent_id = AGENT_CODES.get(selected_agent)
            if agent_id:
                # Get the pregame match ID first
                pregame_player = valorant_client.pregame_fetch_player()
                if not pregame_player:
                    logger.warning("Cannot lock agent: not in pregame")
                    return False

                match_id = pregame_player.get("MatchID")
                if not match_id:
                    logger.warning("Cannot lock agent: no match ID")
                    return False

                logger.info(f"Attempting to lock agent: {selected_agent} in match {match_id}")
                valorant_client.pregame_select_character(agent_id, match_id)
                time.sleep(0.5)
                valorant_client.pregame_lock_character(agent_id, match_id)
                logger.info(f"Successfully locked agent: {selected_agent}")
                return True
    except Exception as e:
        logger.error(f"Error locking agent: {e}", exc_info=True)
    return False

# API Routes
@app.route('/api/init', methods=['POST'])
def initialize():
    """Initialize the Valorant client"""
    data = request.json
    region = data.get('region', 'na')

    if init_client(region):
        # Start background update thread
        update_thread = threading.Thread(target=update_match_data, daemon=True)
        update_thread.start()
        return jsonify({"success": True, "puuid": valorant_client.puuid})
    else:
        return jsonify({"success": False, "error": "Failed to initialize client"}), 500

@app.route('/api/match', methods=['GET'])
def get_match():
    """Get current match data"""
    return jsonify(current_match_data)

@app.route('/api/history', methods=['GET'])
def get_history():
    """Get match history"""
    return jsonify(match_history)

@app.route('/api/autolock', methods=['POST'])
def set_autolock():
    """Enable/disable auto-lock"""
    global auto_lock_enabled, selected_agent
    data = request.json
    auto_lock_enabled = data.get('enabled', False)
    selected_agent = data.get('agent', None)

    return jsonify({
        "success": True,
        "enabled": auto_lock_enabled,
        "agent": selected_agent
    })

@app.route('/api/agents', methods=['GET'])
def get_agents():
    """Get list of available agents"""
    return jsonify(list(AGENT_CODES.keys()))

@app.route('/api/export', methods=['GET'])
def export_data():
    """Export match history"""
    return jsonify({
        "history": match_history,
        "exported_at": time.time()
    })

@app.route('/api/health', methods=['GET'])
def health():
    """Health check"""
    return jsonify({"status": "running", "client_active": valorant_client is not None})

if __name__ == '__main__':
    logger.info("Starting Valorant Match Tracker backend...")
    app.run(host='127.0.0.1', port=5555, debug=False)
