import json
import os
from datetime import datetime
from datetime import timezone

import functions_framework
from google.cloud import bigquery
from google.cloud import storage


DEFAULT_PROJECT_ID = "musa5090s26-team1"
DEFAULT_CORE_DATASET = "core"
DEFAULT_DERIVED_DATASET = "derived"
DEFAULT_PUBLIC_BUCKET = "musa5090s26-team1-public"
DEFAULT_OUTPUT_BLOB = "configs/map_style_metadata.json"

FIELD_LABELS = {
    "current_assessed_value": "Current assessed value",
    "tax_year_assessed_value": "Latest tax year assessed value",
    "absolute_change": "Absolute change",
    "percent_change": "Percent change",
}

FIXED_BREAKPOINTS = {
    "current_assessed_value": [100000, 250000, 500000, 750000, 1000000, 2500000],
    "tax_year_assessed_value": [100000, 250000, 500000, 750000, 1000000, 2500000],
    "absolute_change": [-250000, -100000, 0, 100000, 250000, 500000],
    "percent_change": [-0.25, -0.1, 0, 0.1, 0.25, 0.5, 1.0],
}


@functions_framework.http
def export_map_style_metadata(request):
    del request

    project_id = os.getenv("PROJECT_ID", DEFAULT_PROJECT_ID)
    core_dataset = os.getenv("BQ_CORE_DATASET", DEFAULT_CORE_DATASET)
    derived_dataset = os.getenv("BQ_DERIVED_DATASET", DEFAULT_DERIVED_DATASET)
    public_bucket = os.getenv("PUBLIC_BUCKET", DEFAULT_PUBLIC_BUCKET)
    output_blob = os.getenv("OUTPUT_BLOB", DEFAULT_OUTPUT_BLOB)

    sql = f"""
    WITH latest_tax_year AS (
        SELECT
            MAX(SAFE_CAST(year AS INT64)) AS tax_year
        FROM `{project_id}.{core_dataset}.opa_assessments`
        WHERE SAFE_CAST(year AS INT64) IS NOT NULL
    ),

    latest_assessments AS (
        SELECT
            assessments.property_id,
            SAFE_CAST(assessments.market_value AS FLOAT64) AS tax_year_assessed_value
        FROM `{project_id}.{core_dataset}.opa_assessments` AS assessments
        CROSS JOIN latest_tax_year
        WHERE SAFE_CAST(assessments.year AS INT64) = latest_tax_year.tax_year
    ),

    current_predictions AS (
        SELECT
            property_id,
            SAFE_CAST(predicted_value AS FLOAT64) AS current_assessed_value
        FROM `{project_id}.{derived_dataset}.current_assessments`
        QUALIFY ROW_NUMBER() OVER (
            PARTITION BY property_id
            ORDER BY predicted_at DESC
        ) = 1
    ),

    style_values AS (
        SELECT
            current_predictions.current_assessed_value,
            latest_assessments.tax_year_assessed_value,
            current_predictions.current_assessed_value
                - latest_assessments.tax_year_assessed_value AS absolute_change,
            SAFE_DIVIDE(
                current_predictions.current_assessed_value
                    - latest_assessments.tax_year_assessed_value,
                latest_assessments.tax_year_assessed_value
            ) AS percent_change
        FROM `{project_id}.{core_dataset}.pwd_parcels` AS parcels
        LEFT JOIN `{project_id}.{core_dataset}.opa_properties` AS properties
            ON parcels.property_id = properties.property_id
        LEFT JOIN current_predictions
            ON parcels.property_id = current_predictions.property_id
        LEFT JOIN latest_assessments
            ON parcels.property_id = latest_assessments.property_id
        WHERE
            parcels.geog IS NOT NULL
            AND parcels.property_id IS NOT NULL
            AND properties.category_code_description IN (
                'SINGLE FAMILY',
                'MULTI FAMILY',
                'APARTMENTS > 4 UNITS',
                'VACANT LAND - RESIDENTIAL',
                'GARAGE - RESIDENTIAL'
            )
    )

    SELECT
        COUNT(*) AS record_count,
        MIN(current_assessed_value) AS current_assessed_value_min,
        MAX(current_assessed_value) AS current_assessed_value_max,
        ARRAY(
            SELECT DISTINCT breakpoint
            FROM UNNEST(APPROX_QUANTILES(current_assessed_value, 5)) AS breakpoint
            WHERE breakpoint IS NOT NULL
            ORDER BY breakpoint
        ) AS current_assessed_value_quantiles,
        MIN(tax_year_assessed_value) AS tax_year_assessed_value_min,
        MAX(tax_year_assessed_value) AS tax_year_assessed_value_max,
        ARRAY(
            SELECT DISTINCT breakpoint
            FROM UNNEST(APPROX_QUANTILES(tax_year_assessed_value, 5)) AS breakpoint
            WHERE breakpoint IS NOT NULL
            ORDER BY breakpoint
        ) AS tax_year_assessed_value_quantiles,
        MIN(absolute_change) AS absolute_change_min,
        MAX(absolute_change) AS absolute_change_max,
        ARRAY(
            SELECT DISTINCT breakpoint
            FROM UNNEST(APPROX_QUANTILES(absolute_change, 5)) AS breakpoint
            WHERE breakpoint IS NOT NULL
            ORDER BY breakpoint
        ) AS absolute_change_quantiles,
        MIN(percent_change) AS percent_change_min,
        MAX(percent_change) AS percent_change_max,
        ARRAY(
            SELECT DISTINCT breakpoint
            FROM UNNEST(APPROX_QUANTILES(percent_change, 5)) AS breakpoint
            WHERE breakpoint IS NOT NULL
            ORDER BY breakpoint
        ) AS percent_change_quantiles
    FROM style_values
    """

    try:
        bigquery_client = bigquery.Client(project=project_id)
        rows = list(bigquery_client.query(sql).result())
        row = rows[0]

        fields = {}
        for field_name, label in FIELD_LABELS.items():
            fields[field_name] = {
                "label": label,
                "min": row[f"{field_name}_min"],
                "max": row[f"{field_name}_max"],
                "quantile_breakpoints": list(row[f"{field_name}_quantiles"]),
                "fixed_breakpoints": FIXED_BREAKPOINTS[field_name],
            }

        metadata = {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "source": "BigQuery",
            "record_count": row["record_count"],
            "default_style_field": "current_assessed_value",
            "default_breakpoint_type": "quantile_breakpoints",
            "fields": fields,
        }
        payload = json.dumps(metadata)

        storage_client = storage.Client()
        bucket = storage_client.bucket(public_bucket)
        blob = bucket.blob(output_blob)
        blob.upload_from_string(
            payload,
            content_type="application/json",
            timeout=600,
        )

        output_uri = f"gs://{public_bucket}/{output_blob}"
        public_url = f"https://storage.googleapis.com/{public_bucket}/{output_blob}"

        return (
            json.dumps(
                {
                    "ok": True,
                    "output_uri": output_uri,
                    "public_url": public_url,
                    "record_count": row["record_count"],
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
