import json
import os

import functions_framework
from dotenv import load_dotenv
from google.cloud import bigquery
from google.cloud import storage

load_dotenv()


OUTPUT_OBJECT_NAME = "configs/tax_year_assessment_bins.json"


@functions_framework.http
def export_tax_year_assessment_bins(request):
    del request

    project_id = os.getenv("PROJECT_ID")
    public_bucket = os.getenv("PUBLIC_BUCKET")
    derived_dataset = os.getenv("BQ_DERIVED_DATASET", "derived")

    if not project_id:
        return (
            json.dumps({"ok": False, "error": "Missing PROJECT_ID"}),
            500,
            {"Content-Type": "application/json"},
        )

    if not public_bucket:
        return (
            json.dumps({"ok": False, "error": "Missing PUBLIC_BUCKET"}),
            500,
            {"Content-Type": "application/json"},
        )

    sql = f"""
    SELECT
        tax_year,
        lower_bound,
        upper_bound,
        property_count
    FROM `{project_id}.{derived_dataset}.tax_year_assessment_bins`
    ORDER BY
        tax_year,
        lower_bound
    """

    try:
        bigquery_client = bigquery.Client()
        rows = bigquery_client.query(sql).result()

        results = []
        for row in rows:
            results.append(
                {
                    "tax_year": row.tax_year,
                    "lower_bound": row.lower_bound,
                    "upper_bound": row.upper_bound,
                    "property_count": row.property_count,
                }
            )

        payload = json.dumps(results)

        storage_client = storage.Client()
        bucket = storage_client.bucket(public_bucket)
        blob = bucket.blob(OUTPUT_OBJECT_NAME)
        blob.upload_from_string(
            payload,
            content_type="application/json",
            timeout=600,
        )

        return (
            json.dumps(
                {
                    "ok": True,
                    "rows": len(results),
                    "output_uri": f"gs://{public_bucket}/{OUTPUT_OBJECT_NAME}",
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
