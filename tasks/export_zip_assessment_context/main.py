import json
import os
from datetime import datetime
from datetime import timezone

import functions_framework
from dotenv import load_dotenv
from google.cloud import bigquery
from google.cloud import storage

load_dotenv()


OUTPUT_OBJECT_NAME = "configs/zip_assessment_context.json"


@functions_framework.http
def export_zip_assessment_context(request):
    del request

    project_id = os.getenv("PROJECT_ID", "musa5090s26-team1")
    public_bucket = os.getenv("PUBLIC_BUCKET")
    core_dataset = os.getenv("BQ_CORE_DATASET", "core")
    derived_dataset = os.getenv("BQ_DERIVED_DATASET", "derived")

    if not public_bucket:
        return (
            json.dumps({"ok": False, "error": "Missing PUBLIC_BUCKET"}),
            500,
            {"Content-Type": "application/json"},
        )

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
            MAX(SAFE_CAST(assessments.market_value AS FLOAT64))
                AS tax_year_assessed_value
        FROM `{project_id}.{core_dataset}.opa_assessments` AS assessments
        CROSS JOIN latest_tax_year
        WHERE SAFE_CAST(assessments.year AS INT64) = latest_tax_year.tax_year
        GROUP BY assessments.property_id
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

    property_values AS (
        SELECT
            properties.zip_code,
            latest_assessments.tax_year_assessed_value,
            current_predictions.current_assessed_value,
            CASE
                WHEN latest_assessments.tax_year_assessed_value IS NULL
                    OR latest_assessments.tax_year_assessed_value < 10000
                    THEN NULL
                ELSE
                    SAFE_DIVIDE(
                        current_predictions.current_assessed_value
                        - latest_assessments.tax_year_assessed_value,
                        latest_assessments.tax_year_assessed_value
                    ) * 100
            END AS gap_pct
        FROM `{project_id}.{core_dataset}.opa_properties` AS properties
        LEFT JOIN latest_assessments
            ON properties.property_id = latest_assessments.property_id
        LEFT JOIN current_predictions
            ON properties.property_id = current_predictions.property_id
        WHERE
            REGEXP_CONTAINS(properties.zip_code, r'^\\d{{5}}$')
            AND properties.category_code_description IN (
                'SINGLE FAMILY',
                'MULTI FAMILY',
                'APARTMENTS > 4 UNITS',
                'VACANT LAND - RESIDENTIAL',
                'GARAGE - RESIDENTIAL'
            )
    ),

    stats AS (
        SELECT
            zip_code,
            COUNT(*) AS record_count,
            APPROX_QUANTILES(tax_year_assessed_value, 2)[OFFSET(1)]
                AS official_median,
            APPROX_QUANTILES(current_assessed_value, 2)[OFFSET(1)]
                AS model_median,
            APPROX_QUANTILES(gap_pct, 2)[OFFSET(1)] AS gap_median_pct
        FROM property_values
        GROUP BY zip_code
    ),

    official_bins AS (
        SELECT
            zip_code,
            LEAST(
                DIV(CAST(FLOOR(tax_year_assessed_value) AS INT64), 100000)
                    * 100000,
                2500000
            ) AS lower_bound,
            COUNT(*) AS property_count
        FROM property_values
        WHERE tax_year_assessed_value IS NOT NULL
        GROUP BY zip_code, lower_bound
    ),

    model_bins AS (
        SELECT
            zip_code,
            LEAST(
                DIV(CAST(FLOOR(current_assessed_value) AS INT64), 100000)
                    * 100000,
                2500000
            ) AS lower_bound,
            COUNT(*) AS property_count
        FROM property_values
        WHERE current_assessed_value IS NOT NULL
        GROUP BY zip_code, lower_bound
    )

    SELECT
        stats.zip_code,
        stats.record_count,
        stats.official_median,
        stats.model_median,
        stats.gap_median_pct,
        ARRAY(
            SELECT AS STRUCT
                official_bins.lower_bound,
                CASE
                    WHEN official_bins.lower_bound = 2500000 THEN NULL
                    ELSE official_bins.lower_bound + 100000
                END AS upper_bound,
                official_bins.property_count
            FROM official_bins
            WHERE official_bins.zip_code = stats.zip_code
            ORDER BY official_bins.lower_bound
        ) AS official_bins,
        ARRAY(
            SELECT AS STRUCT
                model_bins.lower_bound,
                CASE
                    WHEN model_bins.lower_bound = 2500000 THEN NULL
                    ELSE model_bins.lower_bound + 100000
                END AS upper_bound,
                model_bins.property_count
            FROM model_bins
            WHERE model_bins.zip_code = stats.zip_code
            ORDER BY model_bins.lower_bound
        ) AS model_bins
    FROM stats
    ORDER BY stats.zip_code
    """

    try:
        bigquery_client = bigquery.Client()
        rows = bigquery_client.query(sql).result()

        areas = {}
        for row in rows:
            areas[row.zip_code] = {
                "label": f"ZIP {row.zip_code}",
                "record_count": row.record_count,
                "official": {
                    "approx_median": row.official_median,
                    "bins": [
                        {
                            "lower_bound": item["lower_bound"],
                            "upper_bound": item["upper_bound"],
                            "property_count": item["property_count"],
                        }
                        for item in row.official_bins
                    ],
                },
                "model": {
                    "approx_median": row.model_median,
                    "bins": [
                        {
                            "lower_bound": item["lower_bound"],
                            "upper_bound": item["upper_bound"],
                            "property_count": item["property_count"],
                        }
                        for item in row.model_bins
                    ],
                },
                "gap": {
                    "approx_median_pct": row.gap_median_pct,
                },
            }

        payload = {
            "geography": "zip_code",
            "generated_at": datetime.now(timezone.utc)
            .isoformat()
            .replace("+00:00", "Z"),
            "areas": areas,
        }

        storage_client = storage.Client()
        bucket = storage_client.bucket(public_bucket)
        blob = bucket.blob(OUTPUT_OBJECT_NAME)
        blob.upload_from_string(
            json.dumps(payload),
            content_type="application/json",
            timeout=600,
        )

        return (
            json.dumps(
                {
                    "ok": True,
                    "areas": len(areas),
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
