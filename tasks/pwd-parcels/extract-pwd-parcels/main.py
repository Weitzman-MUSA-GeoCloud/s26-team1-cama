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
    "downloads/data?format=csv&spatialRefId=3857&where=1%3D1"
)
RAW_OBJECT_NAME = "pwd_parcels/pwd_parcels.csv"


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
    local_csv = temp_dir / "pwd_parcels.csv"

    try:
        response = requests.get(source_url, stream=True, timeout=300)
        response.raise_for_status()

        with local_csv.open("wb") as f:
            for chunk in response.iter_content(chunk_size=1024 * 1024):
                if chunk:
                    f.write(chunk)

        storage_client = storage.Client()
        bucket = storage_client.bucket(raw_bucket)
        blob = bucket.blob(RAW_OBJECT_NAME)
        blob.upload_from_filename(
            str(local_csv),
            content_type="text/csv",
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
            if local_csv.exists():
                local_csv.unlink()
            temp_dir.rmdir()
        except Exception:
            pass
