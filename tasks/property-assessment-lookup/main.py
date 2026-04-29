import json
import os

import functions_framework
from dotenv import load_dotenv
from google.cloud import bigquery

load_dotenv()


CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "3600",
}


@functions_framework.http
def property_assessment_lookup(request):
    if request.method == "OPTIONS":
        return ("", 204, CORS_HEADERS)

    if request.method != "GET":
        return (
            json.dumps({"ok": False, "error": "Only GET is supported"}),
            405,
            {**CORS_HEADERS, "Content-Type": "application/json"},
        )

    project_id = os.getenv("PROJECT_ID", "musa5090s26-team1")
    core_dataset = os.getenv("BQ_CORE_DATASET", "core")
    derived_dataset = os.getenv("BQ_DERIVED_DATASET", "derived")
    property_id = (
        request.args.get("property_id") or request.args.get("opa_id") or ""
    ).strip()

    if not property_id:
        return (
            json.dumps({"ok": False, "error": "Missing property_id or opa_id"}),
            400,
            {**CORS_HEADERS, "Content-Type": "application/json"},
        )

    sql = f"""
    WITH property AS (
        SELECT
            property_id,
            parcel_number,
            zip_code,
            location AS address,
            category_code_description AS property_type
        FROM `{project_id}.{core_dataset}.opa_properties`
        WHERE property_id = @property_id OR parcel_number = @property_id
        QUALIFY ROW_NUMBER() OVER (
            PARTITION BY property_id
            ORDER BY property_id
        ) = 1
    ),

    history AS (
        SELECT
            assessments.property_id,
            SAFE_CAST(assessments.year AS INT64) AS tax_year,
            SAFE_CAST(assessments.market_value AS FLOAT64) AS assessed_value
        FROM `{project_id}.{core_dataset}.opa_assessments` AS assessments
        INNER JOIN property
            ON assessments.property_id = property.property_id
        WHERE
            SAFE_CAST(assessments.year AS INT64) IS NOT NULL
            AND SAFE_CAST(assessments.market_value AS FLOAT64) IS NOT NULL
    ),

    latest_assessments AS (
        SELECT
            assessments.property_id,
            MAX(SAFE_CAST(assessments.market_value AS FLOAT64))
                AS tax_year_assessed_value
        FROM `{project_id}.{core_dataset}.opa_assessments` AS assessments
        WHERE SAFE_CAST(assessments.year AS INT64) = (
            SELECT MAX(SAFE_CAST(year AS INT64))
            FROM `{project_id}.{core_dataset}.opa_assessments`
            WHERE SAFE_CAST(year AS INT64) IS NOT NULL
        )
        GROUP BY assessments.property_id
    ),

    current_predictions AS (
        SELECT
            property_id,
            SAFE_CAST(predicted_value AS FLOAT64) AS current_assessed_value,
            predicted_at
        FROM `{project_id}.{derived_dataset}.current_assessments`
        QUALIFY ROW_NUMBER() OVER (
            PARTITION BY property_id
            ORDER BY predicted_at DESC
        ) = 1
    ),

    property_values AS (
        SELECT
            properties.property_id,
            properties.zip_code,
            latest_assessments.tax_year_assessed_value,
            current_predictions.current_assessed_value
        FROM `{project_id}.{core_dataset}.opa_properties` AS properties
        LEFT JOIN latest_assessments
            ON properties.property_id = latest_assessments.property_id
        LEFT JOIN current_predictions
            ON properties.property_id = current_predictions.property_id
        WHERE properties.category_code_description IN (
            'SINGLE FAMILY',
            'MULTI FAMILY',
            'APARTMENTS > 4 UNITS',
            'VACANT LAND - RESIDENTIAL',
            'GARAGE - RESIDENTIAL'
        )
    ),

    official_percentiles AS (
        SELECT
            property_id,
            zip_code,
            CUME_DIST() OVER (
                ORDER BY tax_year_assessed_value
            ) * 100 AS official_citywide_percentile,
            CUME_DIST() OVER (
                PARTITION BY zip_code
                ORDER BY tax_year_assessed_value
            ) * 100 AS official_zip_percentile
        FROM property_values
        WHERE tax_year_assessed_value IS NOT NULL
    ),

    model_percentiles AS (
        SELECT
            property_id,
            zip_code,
            CUME_DIST() OVER (
                ORDER BY current_assessed_value
            ) * 100 AS model_citywide_percentile,
            CUME_DIST() OVER (
                PARTITION BY zip_code
                ORDER BY current_assessed_value
            ) * 100 AS model_zip_percentile
        FROM property_values
        WHERE current_assessed_value IS NOT NULL
    ),

    ranked_history AS (
        SELECT
            property_id,
            tax_year,
            assessed_value,
            ROW_NUMBER() OVER (
                PARTITION BY property_id
                ORDER BY tax_year DESC
            ) AS recency_rank
        FROM history
    ),

    latest_estimate AS (
        SELECT
            current_predictions.property_id,
            current_predictions.current_assessed_value
                AS estimated_current_market_value,
            current_predictions.predicted_at
        FROM current_predictions
        INNER JOIN property
            ON current_predictions.property_id = property.property_id
    )

    SELECT
        property.property_id,
        property.zip_code,
        property.address,
        property.property_type,
        latest.tax_year AS latest_tax_year,
        latest.assessed_value AS latest_assessed_value,
        prior.tax_year AS prior_tax_year,
        prior.assessed_value AS prior_assessed_value,
        ARRAY(
            SELECT AS STRUCT
                tax_year,
                assessed_value
            FROM history
            ORDER BY tax_year
        ) AS history,
        latest_estimate.estimated_current_market_value,
        latest_estimate.predicted_at,
        official_percentiles.official_citywide_percentile,
        official_percentiles.official_zip_percentile,
        model_percentiles.model_citywide_percentile,
        model_percentiles.model_zip_percentile
    FROM property
    LEFT JOIN ranked_history AS latest
        ON property.property_id = latest.property_id
        AND latest.recency_rank = 1
    LEFT JOIN ranked_history AS prior
        ON property.property_id = prior.property_id
        AND prior.recency_rank = 2
    LEFT JOIN latest_estimate
        ON property.property_id = latest_estimate.property_id
    LEFT JOIN official_percentiles
        ON property.property_id = official_percentiles.property_id
    LEFT JOIN model_percentiles
        ON property.property_id = model_percentiles.property_id
    """

    try:
        client = bigquery.Client()
        job_config = bigquery.QueryJobConfig(
            query_parameters=[
                bigquery.ScalarQueryParameter("property_id", "STRING", property_id)
            ]
        )
        rows = list(client.query(sql, job_config=job_config).result())

        if not rows:
            return (
                json.dumps({"ok": False, "error": "Property not found"}),
                404,
                {**CORS_HEADERS, "Content-Type": "application/json"},
            )

        row = rows[0]
        latest_value = row.latest_assessed_value
        prior_value = row.prior_assessed_value
        estimate_value = row.estimated_current_market_value

        official_change_pct = None
        if latest_value is not None and prior_value not in (None, 0):
            official_change_pct = (latest_value - prior_value) / prior_value

        gap_value = None
        gap_pct = None
        if estimate_value is not None and latest_value is not None:
            gap_value = estimate_value - latest_value
            if latest_value != 0:
                gap_pct = gap_value / latest_value

        predicted_at = row.predicted_at
        if predicted_at is not None:
            predicted_at = predicted_at.isoformat().replace("+00:00", "Z")

        response = {
            "ok": True,
            "property": {
                "property_id": row.property_id,
                "zip_code": row.zip_code,
                "address": row.address,
                "property_type": row.property_type,
            },
            "official": {
                "latest_tax_year": row.latest_tax_year,
                "latest_assessed_value": latest_value,
                "prior_tax_year": row.prior_tax_year,
                "prior_assessed_value": prior_value,
                "change_pct": official_change_pct,
            },
            "history": [
                {
                    "tax_year": item["tax_year"],
                    "assessed_value": item["assessed_value"],
                }
                for item in row.history
            ],
            "estimate": {
                "estimated_current_market_value": estimate_value,
                "predicted_at": predicted_at,
                "gap_value": gap_value,
                "gap_pct": gap_pct,
            },
            "context": {
                "citywide": {
                    "official_percentile": row.official_citywide_percentile,
                    "model_percentile": row.model_citywide_percentile,
                },
                "zip": None,
            },
        }

        if row.zip_code:
            response["context"]["zip"] = {
                "zip_code": row.zip_code,
                "label": f"ZIP {row.zip_code}",
                "official_percentile": row.official_zip_percentile,
                "model_percentile": row.model_zip_percentile,
            }

        return (
            json.dumps(response),
            200,
            {**CORS_HEADERS, "Content-Type": "application/json"},
        )

    except Exception as e:
        return (
            json.dumps({"ok": False, "error": str(e)}),
            500,
            {**CORS_HEADERS, "Content-Type": "application/json"},
        )
