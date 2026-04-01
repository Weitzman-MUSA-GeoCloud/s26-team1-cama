from pathlib import Path
from dotenv import load_dotenv

# 明确加载 repo 根目录的 .env
REPO_ROOT = Path(__file__).resolve().parents[3]
load_dotenv(REPO_ROOT / ".env")

import csv
import json
import os
import tempfile

import functions_framework
from google.cloud import storage


RAW_OBJECT_NAME = "opa_properties/opa_properties_public.csv"
PREPARED_OBJECT_NAME = "opa_properties/data.jsonl"


@functions_framework.http
def prepare_opa_properties(request):
    del request
    print("function started", flush=True)

    raw_bucket = os.getenv("RAW_BUCKET")
    prepared_bucket = os.getenv("PREPARED_BUCKET")

    if not raw_bucket:
        return (
            json.dumps({"ok": False, "error": "Missing RAW_BUCKET"}),
            500,
            {"Content-Type": "application/json"},
        )

    if not prepared_bucket:
        return (
            json.dumps({"ok": False, "error": "Missing PREPARED_BUCKET"}),
            500,
            {"Content-Type": "application/json"},
        )

    temp_dir = Path(tempfile.mkdtemp(dir="/tmp"))
    local_csv = temp_dir / "opa_properties_public.csv"
    local_jsonl = temp_dir / "data.jsonl"

    try:
        storage_client = storage.Client()

        print("downloading raw csv from gcs", flush=True)
        raw_blob = storage_client.bucket(raw_bucket).blob(RAW_OBJECT_NAME)
        raw_blob.download_to_filename(str(local_csv))

        print("converting csv to jsonl", flush=True)
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

        print(f"rows written: {row_count}", flush=True)

        print("uploading prepared jsonl to gcs", flush=True)
        prepared_blob = storage_client.bucket(prepared_bucket).blob(PREPARED_OBJECT_NAME)
        prepared_blob.upload_from_filename(
            str(local_jsonl),
            content_type="application/json",
            timeout=600,
        )

        print("upload finished", flush=True)

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
        print(f"error: {e}", flush=True)
        return (
            json.dumps({"ok": False, "error": str(e)}),
            500,
            {"Content-Type": "application/json"},
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