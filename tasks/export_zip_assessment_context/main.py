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
MAIN_DISPLAY_MAX = 2500000
MAIN_DISPLAY_BIN_SIZE = 100000


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

    base_sql = f"""
    WITH latest_official AS (
        SELECT
            property_id,
            SAFE_CAST(year AS INT64) AS tax_year,
            SAFE_CAST(market_value AS FLOAT64) AS official_value
        FROM `{project_id}.{core_dataset}.opa_assessments`
        WHERE SAFE_CAST(year AS INT64) IS NOT NULL
        QUALIFY ROW_NUMBER() OVER (
            PARTITION BY property_id
            ORDER BY SAFE_CAST(year AS INT64) DESC
        ) = 1
    ),

    current_predictions AS (
        SELECT
            property_id,
            SAFE_CAST(predicted_value AS FLOAT64) AS model_value
        FROM `{project_id}.{derived_dataset}.current_assessments`
        QUALIFY ROW_NUMBER() OVER (
            PARTITION BY property_id
            ORDER BY predicted_at DESC
        ) = 1
    ),

    base AS (
        SELECT
            properties.zip_code,
            properties.property_id,
            latest_official.official_value,
            current_predictions.model_value,
            CASE
                WHEN latest_official.official_value IS NULL
                    OR latest_official.official_value < 10000
                    THEN NULL
                ELSE
                    SAFE_DIVIDE(
                        current_predictions.model_value - latest_official.official_value,
                        latest_official.official_value
                    ) * 100
            END AS gap_pct
        FROM `{project_id}.{core_dataset}.opa_properties` AS properties
        LEFT JOIN latest_official
            ON properties.property_id = latest_official.property_id
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
    )
    """

    summary_sql = f"""
    {base_sql}

    SELECT
        zip_code,
        COUNT(*) AS record_count,
        APPROX_QUANTILES(official_value, 100)[OFFSET(50)]
            AS official_approx_median,
        APPROX_QUANTILES(model_value, 100)[OFFSET(50)]
            AS model_approx_median,
        APPROX_QUANTILES(gap_pct, 100)[OFFSET(50)]
            AS gap_approx_median_pct
    FROM base
    GROUP BY zip_code
    ORDER BY zip_code
    """

    official_bins_sql = f"""
    {base_sql}

    SELECT
        zip_code,
        lower_bound,
        CASE
            WHEN lower_bound = {MAIN_DISPLAY_MAX} THEN NULL
            ELSE lower_bound + {MAIN_DISPLAY_BIN_SIZE}
        END AS upper_bound,
        COUNT(*) AS property_count
    FROM (
        SELECT
            zip_code,
            CAST(
                FLOOR(
                    LEAST(official_value, {MAIN_DISPLAY_MAX})
                    / {MAIN_DISPLAY_BIN_SIZE}
                ) * {MAIN_DISPLAY_BIN_SIZE}
                AS INT64
            ) AS lower_bound
        FROM base
        WHERE official_value IS NOT NULL
    )
    GROUP BY zip_code, lower_bound, upper_bound
    ORDER BY zip_code, lower_bound
    """

    model_bins_sql = f"""
    {base_sql}

    SELECT
        zip_code,
        lower_bound,
        CASE
            WHEN lower_bound = {MAIN_DISPLAY_MAX} THEN NULL
            ELSE lower_bound + {MAIN_DISPLAY_BIN_SIZE}
        END AS upper_bound,
        COUNT(*) AS property_count
    FROM (
        SELECT
            zip_code,
            CAST(
                FLOOR(
                    LEAST(model_value, {MAIN_DISPLAY_MAX})
                    / {MAIN_DISPLAY_BIN_SIZE}
                ) * {MAIN_DISPLAY_BIN_SIZE}
                AS INT64
            ) AS lower_bound,
        FROM base
        WHERE model_value IS NOT NULL
    )
    GROUP BY zip_code, lower_bound, upper_bound
    ORDER BY zip_code, lower_bound
    """

    try:
        bigquery_client = bigquery.Client()
        summary_rows = bigquery_client.query(summary_sql).result()

        areas = {}
        for row in summary_rows:
            areas[row.zip_code] = {
                "label": f"ZIP {row.zip_code}",
                "record_count": row.record_count,
                "official": {
                    "approx_median": row.official_approx_median,
                    "bins": [],
                },
                "model": {
                    "approx_median": row.model_approx_median,
                    "bins": [],
                },
                "gap": {
                    "approx_median_pct": row.gap_approx_median_pct,
                },
            }

        official_bin_rows = bigquery_client.query(official_bins_sql).result()
        for row in official_bin_rows:
            if row.zip_code in areas:
                areas[row.zip_code]["official"]["bins"].append(
                    {
                        "lower_bound": row.lower_bound,
                        "upper_bound": row.upper_bound,
                        "property_count": row.property_count,
                    }
                )

        model_bin_rows = bigquery_client.query(model_bins_sql).result()
        for row in model_bin_rows:
            if row.zip_code in areas:
                areas[row.zip_code]["model"]["bins"].append(
                    {
                        "lower_bound": row.lower_bound,
                        "upper_bound": row.upper_bound,
                        "property_count": row.property_count,
                    }
                )

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
