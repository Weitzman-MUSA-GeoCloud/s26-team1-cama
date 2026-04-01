from dotenv import load_dotenv
load_dotenv()

import csv
import json
import os
import tempfile
from pathlib import Path

import functions_framework
from google.cloud import storage


RAW_OBJECT_NAME = "opa_properties/opa_properties_public.csv"
PREPARED_OBJECT_NAME = "opa_properties/data.jsonl"


def require_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def json_response(payload: dict, status: int = 200):
    return (
        json.dumps(payload),
        status,
        {"Content-Type": "application/json"},
    )


@functions_framework.http
def prepare_opa_properties(request):
    raw_bucket = require_env("RAW_BUCKET")
    prepared_bucket = require_env("PREPARED_BUCKET")

    temp_dir = Path(tempfile.mkdtemp(dir="/tmp"))
    local_csv = temp_dir / "opa_properties_public.csv"
    local_jsonl = temp_dir / "data.jsonl"

    try:
        storage_client = storage.Client()

        raw_blob = storage_client.bucket(raw_bucket).blob(RAW_OBJECT_NAME)
        raw_blob.download_to_filename(str(local_csv))

        row_count = 0

        with local_csv.open("r", encoding="utf-8-sig", newline="") as f_in, \
             local_jsonl.open("w", encoding="utf-8") as f_out:

            reader = csv.DictReader(f_in)

            for row in reader:
                cleaned = {}
                for key, value in row.items():
                    new_key = (key or "").strip().lower()
                    cleaned[new_key] = value

                f_out.write(json.dumps(cleaned, ensure_ascii=False) + "\n")
                row_count += 1

        prepared_blob = storage_client.bucket(prepared_bucket).blob(PREPARED_OBJECT_NAME)
        prepared_blob.upload_from_filename(
            str(local_jsonl),
            content_type="application/x-ndjson",
            timeout=600,
        )

        return json_response(
            {
                "ok": True,
                "rows": row_count,
                "prepared_uri": f"gs://{prepared_bucket}/{PREPARED_OBJECT_NAME}",
            },
            status=200,
        )

    except Exception as e:
        return json_response(
            {
                "ok": False,
                "error": str(e),
            },
            status=500,
        )

    finally:
        try:
            if local_csv.exists():
                local_csv.unlink()
            if local_jsonl.exists():
                local_jsonl.unlink()
            temp_dir.rmdir()
        except Exception:
            pass