import json
import os
import tempfile
from pathlib import Path

import functions_framework
import requests
from dotenv import load_dotenv
from google.cloud import storage

load_dotenv()


DEFAULT_SOURCE_URL = (
    "https://hub.arcgis.com/api/v3/datasets/84baed491de44f539889f2af178ad85c_0/"
    "downloads/data?format=geojson&spatialRefId=4326&where=1%3D1"
)
RAW_OBJECT_NAME = "pwd_parcels/pwd_parcels.geojson"


@functions_framework.http
def extract_pwd_parcels(request):
    del request

    raw_bucket = os.getenv("RAW_BUCKET")
    if not raw_bucket:
        return (
            json.dumps({"ok": False, "error": "Missing RAW_BUCKET"}),
            500,
            {"Content-Type": "application/json"},
        )

    source_url = os.getenv("PWD_PARCELS_URL", DEFAULT_SOURCE_URL)

    temp_dir = Path(tempfile.mkdtemp(dir="/tmp"))
    local_geojson = temp_dir / "pwd_parcels.geojson"

    try:
        response = requests.get(source_url, stream=True, timeout=300)
        response.raise_for_status()

        with local_geojson.open("wb") as f:
            for chunk in response.iter_content(chunk_size=1024 * 1024):
                if chunk:
                    f.write(chunk)

        storage_client = storage.Client()
        bucket = storage_client.bucket(raw_bucket)
        blob = bucket.blob(RAW_OBJECT_NAME)
        blob.upload_from_filename(
            str(local_geojson),
            content_type="application/geo+json",
            timeout=600,
        )

        return (
            json.dumps(
                {
                    "ok": True,
                    "raw_uri": f"gs://{raw_bucket}/{RAW_OBJECT_NAME}",
                }
            ),
            200,
            {"Content-Type": "application/json"},
        )

    except Exception as e:
        return (
            json.dumps({"ok": False, "error": str(e)}),
            500,
            {"Content-Type": "application/json"},
        )

    finally:
        try:
            if local_geojson.exists():
                local_geojson.unlink()
            temp_dir.rmdir()
        except Exception:
            pass
