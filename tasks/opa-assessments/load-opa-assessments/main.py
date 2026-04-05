import json
import os
from pathlib import Path

import functions_framework
from dotenv import load_dotenv
from google.cloud import bigquery

load_dotenv()


SQL_DIR = Path(__file__).resolve().parent / "sql"


def read_sql(filename, replacements):
    sql = (SQL_DIR / filename).read_text()

    for key, value in replacements.items():
        sql = sql.replace(f"__{key}__", value)

    return sql


@functions_framework.http
def load_opa_assessments(request):
    del request

    project_id = os.getenv("PROJECT_ID")
    prepared_bucket = os.getenv("PREPARED_BUCKET")
    source_dataset = os.getenv("BQ_SOURCE_DATASET")
    core_dataset = os.getenv("BQ_CORE_DATASET")

    if not project_id:
        return (
            json.dumps({"ok": False, "error": "Missing PROJECT_ID"}),
            500,
            {"Content-Type": "application/json"},
        )

    if not prepared_bucket:
        return (
            json.dumps({"ok": False, "error": "Missing PREPARED_BUCKET"}),
            500,
            {"Content-Type": "application/json"},
        )

    if not source_dataset:
        return (
            json.dumps({"ok": False, "error": "Missing BQ_SOURCE_DATASET"}),
            500,
            {"Content-Type": "application/json"},
        )

    if not core_dataset:
        return (
            json.dumps({"ok": False, "error": "Missing BQ_CORE_DATASET"}),
            500,
            {"Content-Type": "application/json"},
        )

    replacements = {
        "PROJECT_ID": project_id,
        "PREPARED_BUCKET": prepared_bucket,
        "BQ_SOURCE_DATASET": source_dataset,
        "BQ_CORE_DATASET": core_dataset,
    }

    try:
        client = bigquery.Client(project=project_id)

        source_sql = read_sql("source_opa_assessments.sql", replacements)
        core_sql = read_sql("core_opa_assessments.sql", replacements)

        print("running source sql", flush=True)
        client.query(source_sql).result()

        print("running core sql", flush=True)
        client.query(core_sql).result()

        return (
            json.dumps(
                {
                    "ok": True,
                    "source_table": f"{project_id}.{source_dataset}.opa_assessments",
                    "core_table": f"{project_id}.{core_dataset}.opa_assessments",
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
