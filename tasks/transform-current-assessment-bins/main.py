import json
import os
from pathlib import Path

from dotenv import load_dotenv
from google.cloud import bigquery

load_dotenv()


def main(request):
    project_id = os.getenv("PROJECT_ID")
    derived_dataset = os.getenv("DERIVED_DATASET", "derived")

    if not project_id:
        return (
            json.dumps(
                {
                    "status": "error",
                    "message": "Missing required environment variable: PROJECT_ID",
                }
            ),
            400,
            {"Content-Type": "application/json"},
        )

    sql_path = (
        Path(__file__).resolve().parent
        / "create_derived_current_assessment_bins.sql"
    )

    if not sql_path.exists():
        return (
            json.dumps(
                {
                    "status": "error",
                    "message": f"SQL file not found: {sql_path.name}",
                }
            ),
            500,
            {"Content-Type": "application/json"},
        )

    sql_template = sql_path.read_text(encoding="utf-8")
    sql = sql_template.format(
        project_id=project_id,
        derived_dataset=derived_dataset,
    )

    client = bigquery.Client(project=project_id)
    client.query(sql).result()

    output_table = f"{project_id}.{derived_dataset}.current_assessment_bins"

    validation_sql = f"""
    SELECT SUM(property_count) AS total_properties
    FROM `{output_table}`
    """
    validation_result = list(client.query(validation_sql).result())
    total_properties = (
        validation_result[0]["total_properties"] if validation_result else None
    )

    return (
        json.dumps(
            {
                "status": "ok",
                "table": output_table,
                "total_properties": total_properties,
            }
        ),
        200,
        {"Content-Type": "application/json"},
    )