import json
import os

import functions_framework
from dotenv import load_dotenv
from google.cloud import bigquery
from google.cloud import storage

load_dotenv()


OUTPUT_OBJECT_NAME = "property_tile_info.geojson"


@functions_framework.http
def export_property_tile_info(request):
    del request

    project_id = os.getenv("PROJECT_ID")
    temp_bucket = os.getenv("TEMP_BUCKET")
    core_dataset = os.getenv("BQ_CORE_DATASET", "core")
    derived_dataset = os.getenv("BQ_DERIVED_DATASET", "derived")

    if not project_id:
        return (
            json.dumps({"ok": False, "error": "Missing PROJECT_ID"}),
            500,
            {"Content-Type": "application/json"},
        )

    if not temp_bucket:
        return (
            json.dumps({"ok": False, "error": "Missing TEMP_BUCKET"}),
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
    )

    SELECT
        parcels.property_id,
        properties.location AS address,
        ST_ASGEOJSON(parcels.geog) AS geometry,
        current_predictions.current_assessed_value,
        latest_assessments.tax_year_assessed_value
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
    ORDER BY parcels.property_id
    """

    try:
        bigquery_client = bigquery.Client()
        rows = bigquery_client.query(sql).result()

        features = []
        for row in rows:
            features.append(
                {
                    "type": "Feature",
                    "geometry": json.loads(row.geometry),
                    "properties": {
                        "property_id": row.property_id,
                        "address": row.address,
                        "current_assessed_value": row.current_assessed_value,
                        "tax_year_assessed_value": row.tax_year_assessed_value,
                    },
                }
            )

        feature_collection = {
            "type": "FeatureCollection",
            "features": features,
        }
        payload = json.dumps(feature_collection)

        storage_client = storage.Client()
        bucket = storage_client.bucket(temp_bucket)
        blob = bucket.blob(OUTPUT_OBJECT_NAME)
        blob.upload_from_string(
            payload,
            content_type="application/geo+json",
            timeout=600,
        )

        return (
            json.dumps(
                {
                    "ok": True,
                    "rows": len(features),
                    "output_uri": f"gs://{temp_bucket}/{OUTPUT_OBJECT_NAME}",
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
