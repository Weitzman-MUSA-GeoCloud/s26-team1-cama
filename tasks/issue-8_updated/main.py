from pathlib import Path
import json
import logging

from google.cloud import bigquery


def run_sql_files() -> list[str]:
    """
    Execute all .sql files in the current directory in alphabetical order.
    """
    client = bigquery.Client()
    sql_dir = Path(__file__).resolve().parent
    sql_files = sorted(sql_dir.glob("*.sql"))

    if not sql_files:
        raise FileNotFoundError("No .sql files found in the task directory.")

    executed_files = []

    for sql_file in sql_files:
        sql_text = sql_file.read_text(encoding="utf-8").strip()

        if not sql_text:
            logging.warning("Skipping empty SQL file: %s", sql_file.name)
            continue

        logging.info("Running SQL file: %s", sql_file.name)
        query_job = client.query(sql_text)
        query_job.result()
        executed_files.append(sql_file.name)

    return executed_files


def main(request):
    """
    Cloud Function entry point.
    """
    try:
        executed_files = run_sql_files()

        response = {
            "status": "success",
            "executed_files": executed_files,
            "message": "Issue 8 completed: rebuilt derived.current_assessment_bins from predicted_value."
        }
        return json.dumps(response), 200, {"Content-Type": "application/json"}

    except Exception as e:
        logging.exception("Issue 8 failed.")
        response = {
            "status": "error",
            "message": str(e)
        }
        return json.dumps(response), 500, {"Content-Type": "application/json"}
