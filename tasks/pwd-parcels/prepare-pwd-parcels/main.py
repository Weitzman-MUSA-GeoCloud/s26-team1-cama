import json
import os
import tempfile
from pathlib import Path

import functions_framework
from dotenv import load_dotenv
from google.cloud import storage

load_dotenv()


RAW_OBJECT_NAME = "pwd_parcels/pwd_parcels.geojson"
PREPARED_OBJECT_NAME = "pwd_parcels/data.jsonl"


@functions_framework.http
def prepare_pwd_parcels(request):
    del request

    raw_bucket = os.getenv("RAW_BUCKET")
    if not raw_bucket:
        return (
            json.dumps({"ok": False, "error": "Missing RAW_BUCKET"}),
            500,
            {"Content-Type": "application/json"},
        )

    prepared_bucket = os.getenv("PREPARED_BUCKET")
    if not prepared_bucket:
        return (
            json.dumps({"ok": False, "error": "Missing PREPARED_BUCKET"}),
            500,
            {"Content-Type": "application/json"},
        )

    temp_dir = Path(tempfile.mkdtemp(dir="/tmp"))
    local_geojson = temp_dir / "pwd_parcels.geojson"
    local_jsonl = temp_dir / "data.jsonl"

    try:
        storage_client = storage.Client()

        raw_blob = storage_client.bucket(raw_bucket).blob(RAW_OBJECT_NAME)
        raw_blob.download_to_filename(str(local_geojson))

        row_count = 0

        with local_geojson.open("r", encoding="utf-8-sig") as f_in, \
             local_jsonl.open("w", encoding="utf-8") as f_out:

            data = json.load(f_in)

            for feature in data.get("features", []):
                cleaned = {}
                for key, value in feature.get("properties", {}).items():
                    if value is None:
                        cleaned[(key or "").strip().lower()] = None
                    else:
                        cleaned[(key or "").strip().lower()] = str(value)

                geometry = feature.get("geometry")
                if geometry is None:
                    cleaned["geometry_geojson"] = None
                else:
                    cleaned["geometry_geojson"] = json.dumps(
                        geometry,
                        ensure_ascii=False,
                    )

                f_out.write(json.dumps(cleaned, ensure_ascii=False) + "\n")
                row_count += 1

        prepared_blob = storage_client.bucket(prepared_bucket).blob(PREPARED_OBJECT_NAME)
        prepared_blob.upload_from_filename(
            str(local_jsonl),
            content_type="application/x-ndjson",
            timeout=600,
        )

        return (
            json.dumps(
                {
                    "ok": True,
                    "rows": row_count,
                    "prepared_uri": f"gs://{prepared_bucket}/{PREPARED_OBJECT_NAME}",
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
            if local_jsonl.exists():
                local_jsonl.unlink()
            temp_dir.rmdir()
        except Exception:
            pass
